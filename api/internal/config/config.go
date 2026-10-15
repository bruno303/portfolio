// Package config loads and validates the YAML configuration, applying the
// environment overrides used by containers.
package config

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

const (
	defaultPort         = 8080
	defaultQueryTimeout = 5 * time.Second
	defaultCacheTTL     = 15 * time.Second
	defaultConfigPath   = "config/config.yaml"
	defaultLogLevel     = "INFO"
)

// Config is the root configuration document.
type Config struct {
	Server        Server         `yaml:"server"`
	Prometheus    Prometheus     `yaml:"prometheus"`
	Services      []Service      `yaml:"services"`
	CustomMetrics []CustomMetric `yaml:"custom_metrics"`
}

// Server holds HTTP boundary settings.
type Server struct {
	Port               int      `yaml:"port"`
	CORSAllowedOrigins []string `yaml:"cors_allowed_origins"`
	LogLevel           string   `yaml:"log_level"`
}

// Prometheus holds connection and caching settings for the metrics provider.
type Prometheus struct {
	URL          string   `yaml:"url"`
	QueryTimeout Duration `yaml:"query_timeout"`
	CacheTTL     Duration `yaml:"cache_ttl"`
}

// Service describes one deployment whose CPU and memory are published.
// Selection is intentionally coarse (namespace + pod name regex) so no pod or
// node identity ever reaches the payload.
type Service struct {
	ID        string `yaml:"id"`
	Name      string `yaml:"name"`
	Namespace string `yaml:"namespace"`
	PodRegex  string `yaml:"pod_regex"`
}

// CustomMetric is a curated PromQL query rendered as a single value.
type CustomMetric struct {
	ID    string `yaml:"id"`
	Label string `yaml:"label"`
	Unit  string `yaml:"unit"`
	Query string `yaml:"query"`
}

// Duration parses Go duration strings such as "5s" or "1m" from YAML.
type Duration time.Duration

// UnmarshalYAML implements yaml.Unmarshaler.
func (d *Duration) UnmarshalYAML(value *yaml.Node) error {
	var raw string
	if err := value.Decode(&raw); err != nil {
		return err
	}

	parsed, err := time.ParseDuration(raw)
	if err != nil {
		return fmt.Errorf("invalid duration %q: %w", raw, err)
	}

	*d = Duration(parsed)

	return nil
}

// Load resolves the config path (CONFIG_PATH or config/config.yaml), reads the
// file and applies environment overrides: PORT, CORS_ALLOWED_ORIGINS,
// PROMETHEUS_URL, LOG_LEVEL.
func Load() (*Config, error) {
	path := os.Getenv("CONFIG_PATH")
	if path == "" {
		path = defaultConfigPath
	}

	cfg, err := loadFrom(path)
	if err != nil {
		return nil, err
	}

	applyEnvOverrides(cfg)

	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}

	return cfg, nil
}

func loadFrom(path string) (*Config, error) {
	contents, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read config %s: %w", path, err)
	}

	var cfg Config

	if err := yaml.Unmarshal(contents, &cfg); err != nil {
		return nil, fmt.Errorf("parse config %s: %w", path, err)
	}

	return &cfg, nil
}

func applyEnvOverrides(cfg *Config) {
	if raw := os.Getenv("PORT"); raw != "" {
		if port, err := strconv.Atoi(raw); err == nil {
			cfg.Server.Port = port
		}
	}

	if raw := os.Getenv("CORS_ALLOWED_ORIGINS"); raw != "" {
		cfg.Server.CORSAllowedOrigins = splitAndTrim(raw)
	}

	if raw := os.Getenv("PROMETHEUS_URL"); raw != "" {
		cfg.Prometheus.URL = raw
	}

	if raw := os.Getenv("LOG_LEVEL"); raw != "" {
		cfg.Server.LogLevel = raw
	}
}

// splitAndTrim parses a comma-separated environment value such as
// CORS_ALLOWED_ORIGINS, dropping surrounding whitespace and empty entries.
func splitAndTrim(raw string) []string {
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))

	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			origins = append(origins, trimmed)
		}
	}

	return origins
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
		c.Prometheus.QueryTimeout = Duration(defaultQueryTimeout)
	}

	if c.Prometheus.CacheTTL <= 0 {
		c.Prometheus.CacheTTL = Duration(defaultCacheTTL)
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
