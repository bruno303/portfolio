// Package config loads the API configuration: an embedded YAML baseline with
// environment variable overrides on top (github.com/sethvargo/go-envconfig,
// driven by `env` tags).
package config

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"time"

	tkconfig "github.com/bruno303/go-toolkit/pkg/config"
	configfs "github.com/bruno303/portfolio/api/config"
)

const (
	defaultPort         = 8080
	defaultQueryTimeout = 5 * time.Second
	defaultCacheTTL     = 15 * time.Second
	defaultLogLevel     = "INFO"
)

// Config is the root configuration document.
type Config struct {
	Server        Server        `yaml:"server"`
	Prometheus    Prometheus    `yaml:"prometheus"`
	Services      Services      `yaml:"services" env:"SERVICES"`
	CustomMetrics CustomMetrics `yaml:"custom_metrics" env:"CUSTOM_METRICS"`
}

// Server holds HTTP boundary settings.
//
// Environment: PORT, LOG_LEVEL, CORS_ALLOWED_ORIGINS (comma-separated).
type Server struct {
	Port               int      `yaml:"port" env:"PORT"`
	CORSAllowedOrigins []string `yaml:"cors_allowed_origins" env:"CORS_ALLOWED_ORIGINS"`
	LogLevel           string   `yaml:"log_level" env:"LOG_LEVEL"`
}

// Prometheus holds connection and caching settings for the metrics provider.
//
// Environment: PROMETHEUS_URL, PROMETHEUS_QUERY_TIMEOUT, PROMETHEUS_CACHE_TTL.
type Prometheus struct {
	URL          string        `yaml:"url" env:"PROMETHEUS_URL"`
	QueryTimeout time.Duration `yaml:"query_timeout" env:"PROMETHEUS_QUERY_TIMEOUT"`
	CacheTTL     time.Duration `yaml:"cache_ttl" env:"PROMETHEUS_CACHE_TTL"`
}

// Service describes one deployment whose CPU and memory are published.
// Selection is intentionally coarse (namespace + pod name regex) so no pod or
// node identity ever reaches the payload.
type Service struct {
	ID        string `yaml:"id" json:"id"`
	Name      string `yaml:"name" json:"name"`
	Namespace string `yaml:"namespace" json:"namespace"`
	PodRegex  string `yaml:"pod_regex" json:"pod_regex"`
}

// UnmarshalJSON accepts the YAML spelling (pod_regex) and the Helm values
// spelling (podRegex) so JSON rendered from values files decodes either way.
func (s *Service) UnmarshalJSON(data []byte) error {
	var raw struct {
		ID            string `json:"id"`
		Name          string `json:"name"`
		Namespace     string `json:"namespace"`
		PodRegex      string `json:"pod_regex"`
		PodRegexCamel string `json:"podRegex"`
	}

	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}

	regex := raw.PodRegex
	if regex == "" {
		regex = raw.PodRegexCamel
	}

	*s = Service{ID: raw.ID, Name: raw.Name, Namespace: raw.Namespace, PodRegex: regex}

	return nil
}

// CustomMetric is a curated PromQL query rendered as a single value.
type CustomMetric struct {
	ID    string `yaml:"id" json:"id"`
	Label string `yaml:"label" json:"label"`
	Unit  string `yaml:"unit" json:"unit"`
	Query string `yaml:"query" json:"query"`
}

// Services is the curated list of aggregated deployments. As a named slice it
// can be replaced entirely by the (JSON array) SERVICES env var.
type Services []Service

// EnvDecode implements envconfig.DecoderCtx so the raw env value is decoded as
// a single JSON array instead of being comma-split per item.
func (s *Services) EnvDecode(_ context.Context, val string) error {
	if val == "" {
		return nil
	}

	parsed, err := decodeJSONList[Service](val)
	if err != nil {
		return err
	}

	*s = parsed

	return nil
}

// CustomMetrics is the curated list of PromQL queries exposed as samples.
type CustomMetrics []CustomMetric

// EnvDecode implements envconfig.DecoderCtx so the raw env value is decoded as
// a single JSON array instead of being comma-split per item.
func (c *CustomMetrics) EnvDecode(_ context.Context, val string) error {
	if val == "" {
		return nil
	}

	parsed, err := decodeJSONList[CustomMetric](val)
	if err != nil {
		return err
	}

	*c = parsed

	return nil
}

// decodeJSONList parses the JSON form of a list, decoding into a fresh slice
// so YAML-parsed values can never leak into partially replaced items.
func decodeJSONList[T any](val string) ([]T, error) {
	var parsed []T

	if err := json.Unmarshal([]byte(val), &parsed); err != nil {
		return nil, fmt.Errorf("decode JSON list: %w", err)
	}

	return parsed, nil
}

// Load builds the configuration from the embedded YAML baseline plus env var
// overrides, then validates it. Load errors already before validation are
// mapped onto the error return the same way.
func Load() (*Config, error) {
	cfg, err := load()
	if err != nil {
		return nil, fmt.Errorf("load config: %w", err)
	}

	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}

	return cfg, nil
}

// load invokes the toolkit config loader, which panics on I/O, parse and env
// processing errors; the panic is bridged to the error contract of this
// package so callers fail fast with a plain error.
func load() (loaded *Config, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("%v", r)
		}
	}()

	var cfg Config
	tkconfig.LoadConfig(&cfg, configfs.Files)

	return &cfg, nil
}

func (c *Config) validate() error {
	var errs []error

	if c.Server.Port == 0 {
		c.Server.Port = defaultPort
	}

	if c.Server.Port < 1 || c.Server.Port > 65535 {
		errs = append(errs, fmt.Errorf("server.port %d out of range", c.Server.Port))
	}

	if c.Server.LogLevel == "" {
		c.Server.LogLevel = defaultLogLevel
	}

	if c.Prometheus.URL == "" {
		errs = append(errs, errors.New("prometheus.url is required"))
	} else if parsed, err := url.Parse(c.Prometheus.URL); err != nil {
		errs = append(errs, fmt.Errorf("prometheus.url invalid: %w", err))
	} else if parsed.Scheme != "http" && parsed.Scheme != "https" {
		errs = append(errs, fmt.Errorf("prometheus.url scheme %q is not supported", parsed.Scheme))
	}

	if c.Prometheus.QueryTimeout <= 0 {
		c.Prometheus.QueryTimeout = defaultQueryTimeout
	}

	if c.Prometheus.CacheTTL <= 0 {
		c.Prometheus.CacheTTL = defaultCacheTTL
	}

	seen := make(map[string]struct{}, len(c.Services))

	for i, svc := range c.Services {
		if svc.ID == "" || svc.Name == "" || svc.Namespace == "" || svc.PodRegex == "" {
			errs = append(errs, fmt.Errorf("services[%d]: id, name, namespace and pod_regex are required", i))
			continue
		}

		if _, dup := seen[svc.ID]; dup {
			errs = append(errs, fmt.Errorf("services[%d]: duplicate id %q", i, svc.ID))
		}

		seen[svc.ID] = struct{}{}
	}

	metricIDs := make(map[string]struct{}, len(c.CustomMetrics))

	for i, metric := range c.CustomMetrics {
		if metric.ID == "" || metric.Label == "" || metric.Query == "" {
			errs = append(errs, fmt.Errorf("custom_metrics[%d]: id, label and query are required", i))
			continue
		}

		if _, dup := metricIDs[metric.ID]; dup {
			errs = append(errs, fmt.Errorf("custom_metrics[%d]: duplicate id %q", i, metric.ID))
		}

		metricIDs[metric.ID] = struct{}{}

		switch metric.Unit {
		case "", "cores", "bytes", "count":
		default:
			errs = append(errs, fmt.Errorf("custom_metrics[%d]: unsupported unit %q", i, metric.Unit))
		}
	}

	return errors.Join(errs...)
}
