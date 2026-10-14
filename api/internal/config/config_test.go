package config

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const validYAML = `
server:
  port: 8080
prometheus:
  url: "http://localhost:9090"
services:
  - id: api
    name: "API"
    namespace: production
    pod_regex: "api-.*"
custom_metrics:
  - id: rooms
    label: "Rooms"
    unit: count
    query: "sum(rooms_total)"
`

func writeConfig(t *testing.T, contents string) string {
	t.Helper()

	path := filepath.Join(t.TempDir(), "config.yaml")
	require.NoError(t, os.WriteFile(path, []byte(contents), 0o600))

	return path
}

func TestLoadFrom_AppliesDefaults(t *testing.T) {
	cfg, err := loadFrom(writeConfig(t, validYAML))
	require.NoError(t, err)
	require.NoError(t, cfg.validate())

	assert.Equal(t, 8080, cfg.Server.Port)
	assert.Equal(t, "INFO", cfg.Server.LogLevel)
	assert.Equal(t, 5*time.Second, time.Duration(cfg.Prometheus.QueryTimeout))
	assert.Equal(t, 15*time.Second, time.Duration(cfg.Prometheus.CacheTTL))
}

func TestLoadFrom_RejectsMalformedDuration(t *testing.T) {
	_, err := loadFrom(writeConfig(t, "prometheus:\n  query_timeout: not-a-duration\n"))
	require.Error(t, err)
	assert.Contains(t, err.Error(), "invalid duration")
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

func TestApplyEnvOverrides(t *testing.T) {
	t.Setenv("PORT", "9999")
	t.Setenv("PROMETHEUS_URL", "http://prom.local:9090")
	t.Setenv("LOG_LEVEL", "DEBUG")

	cfg := &Config{}
	applyEnvOverrides(cfg)

	assert.Equal(t, 9999, cfg.Server.Port)
	assert.Equal(t, "http://prom.local:9090", cfg.Prometheus.URL)
	assert.Equal(t, "DEBUG", cfg.Server.LogLevel)
}

func TestApplyEnvOverrides_IgnoresInvalidPort(t *testing.T) {
	t.Setenv("PORT", "nope")

	cfg := &Config{}
	applyEnvOverrides(cfg)

	assert.Equal(t, 0, cfg.Server.Port)
}
