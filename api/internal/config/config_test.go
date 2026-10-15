package config

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// configVarNames are every environment variable this package reads.
var configVarNames = []string{
	"PORT",
	"CORS_ALLOWED_ORIGINS",
	"LOG_LEVEL",
	"PROMETHEUS_URL",
	"PROMETHEUS_QUERY_TIMEOUT",
	"PROMETHEUS_CACHE_TTL",
	"SERVICES",
	"CUSTOM_METRICS",
}

// clearConfigEnv unsets every config env var so tests observe the embedded
// baseline (t.Setenv cannot unset, and a developer environment could hold
// stale values such as PROMETHEUS_URL). Previously set values are restored
// during cleanup.
func clearConfigEnv(t *testing.T) {
	t.Helper()

	for _, name := range configVarNames {
		val, wasSet := os.LookupEnv(name)
		require.NoError(t, os.Unsetenv(name))
		t.Cleanup(func() {
			if wasSet {
				os.Setenv(name, val)
				return
			}
			os.Unsetenv(name)
		})
	}
}

// TestLoad_AppliesEmbeddedDefaults checks the YAML baked into the binary.
func TestLoad_AppliesEmbeddedDefaults(t *testing.T) {
	clearConfigEnv(t)

	cfg, err := Load()
	require.NoError(t, err)
	require.NoError(t, cfg.validate())

	assert.Equal(t, 8080, cfg.Server.Port)
	assert.Equal(t, "INFO", cfg.Server.LogLevel)
	assert.Equal(t, 5*time.Second, cfg.Prometheus.QueryTimeout)
	assert.Equal(t, 15*time.Second, cfg.Prometheus.CacheTTL)
	assert.Len(t, cfg.Services, 2)
	assert.Len(t, cfg.CustomMetrics, 3)
}

func TestLoad_ScalarsFromEnvironment(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("PORT", "9999")
	t.Setenv("CORS_ALLOWED_ORIGINS", "https://a.test, https://b.test ,")
	t.Setenv("PROMETHEUS_URL", "http://prom.local:9090")
	t.Setenv("LOG_LEVEL", "DEBUG")
	t.Setenv("PROMETHEUS_QUERY_TIMEOUT", "7s")
	t.Setenv("PROMETHEUS_CACHE_TTL", "90s")

	cfg, err := Load()
	require.NoError(t, err)

	assert.Equal(t, 9999, cfg.Server.Port)
	// Env values are comma-split with surrounding whitespace trimmed; empty
	// entries are kept.
	assert.Equal(t, []string{"https://a.test", "https://b.test", ""}, cfg.Server.CORSAllowedOrigins)
	assert.Equal(t, "DEBUG", cfg.Server.LogLevel)
	assert.Equal(t, 7*time.Second, cfg.Prometheus.QueryTimeout)
	assert.Equal(t, 90*time.Second, cfg.Prometheus.CacheTTL)
}

func TestLoad_ListsAreReplacedByEnvironmentJSON(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("SERVICES", `[
		{"id":"one","name":"One","namespace":"ns","podRegex":"one-.*"},
		{"id":"two","name":"Two","namespace":"ns","pod_regex":"two-.*"}
	]`)
	t.Setenv("CUSTOM_METRICS", `[
		{"id":"rooms","label":"Rooms","unit":"count","query":"sum(rooms_total)"}
	]`)

	cfg, err := Load()
	require.NoError(t, err)

	require.Len(t, cfg.Services, 2)
	assert.Equal(t, Service{ID: "one", Name: "One", Namespace: "ns", PodRegex: "one-.*"}, cfg.Services[0])
	assert.Equal(t, "two-.*", cfg.Services[1].PodRegex)

	require.Len(t, cfg.CustomMetrics, 1)
	assert.Equal(t, "sum(rooms_total)", cfg.CustomMetrics[0].Query)
}

func TestLoad_MalformedDurationReturnsError(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("PROMETHEUS_QUERY_TIMEOUT", "not-a-duration")

	_, err := Load()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not-a-duration")
}

func TestLoad_MalformedListJSONReturnsError(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("SERVICES", `[{"id":"broken"...`)

	_, err := Load()
	require.Error(t, err)
	assert.Contains(t, err.Error(), "decode JSON list")
}

func TestEnvDecode_IgnoresEmptyValues(t *testing.T) {
	var services Services

	require.NoError(t, services.EnvDecode(context.Background(), ""))
	assert.Nil(t, services)
}

func TestValidate_CollectsErrors(t *testing.T) {
	cfg := &Config{
		Server:     Server{Port: 70000},
		Prometheus: Prometheus{URL: "ftp://prometheus"},
		Services: []Service{
			{ID: "api", Name: "API", Namespace: "production", PodRegex: "api-.*"},
			{ID: "api", Name: "API", Namespace: "production", PodRegex: "api-.*"},
			{ID: "broken"},
		},
		CustomMetrics: []CustomMetric{
			{ID: "rooms", Label: "Rooms", Query: "sum(rooms_total)", Unit: "bananas"},
		},
	}

	err := cfg.validate()
	require.Error(t, err)

	assert.Contains(t, err.Error(), "out of range")
	assert.Contains(t, err.Error(), "scheme")
	assert.Contains(t, err.Error(), "duplicate id")
	assert.Contains(t, err.Error(), "required")
	assert.Contains(t, err.Error(), "unsupported unit")
}
