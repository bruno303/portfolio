package metrics

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/bruno303/portfolio/api/internal/config"
	domainmetrics "github.com/bruno303/portfolio/api/internal/domain/metrics"
)

type fakeProvider struct {
	calls   int
	queries []domainmetrics.Query
	samples map[string]domainmetrics.Sample
	err     error
}

func (f *fakeProvider) Query(_ context.Context, queries []domainmetrics.Query) (map[string]domainmetrics.Sample, error) {
	f.calls++
	f.queries = queries

	if f.err != nil {
		return nil, f.err
	}

	return f.samples, nil
}

func newTestConfig(ttl time.Duration) *config.Config {
	return &config.Config{
		Prometheus: config.Prometheus{CacheTTL: config.Duration(ttl)},
		Services: []config.Service{
			{ID: "api", Name: "API", Namespace: "production", PodRegex: "api-.*"},
		},
		CustomMetrics: []config.CustomMetric{
			{ID: "rooms", Label: "Rooms", Unit: "count", Query: "sum(rooms_total)"},
		},
	}
}

func TestSnapshot_MapsSamples(t *testing.T) {
	provider := &fakeProvider{samples: map[string]domainmetrics.Sample{
		"service.cpu.api":    {Value: 0.42, Available: true},
		"service.memory.api": {Value: 1024, Available: true},
		"metric.rooms":       {Value: 3, Available: true},
	}}

	useCase := NewUseCase(provider, newTestConfig(time.Minute))

	snapshot, err := useCase.Snapshot(context.Background())
	require.NoError(t, err)

	require.Len(t, snapshot.Services, 1)
	assert.Equal(t, "API", snapshot.Services[0].Name)
	assert.InDelta(t, 0.42, snapshot.Services[0].CPUCores, 0.0001)
	assert.True(t, snapshot.Services[0].MemoryAvailable)
	assert.InDelta(t, 1024, snapshot.Services[0].MemoryBytes, 0.0001)

	require.Len(t, snapshot.Metrics, 1)
	assert.Equal(t, domainmetrics.UnitCount, snapshot.Metrics[0].Unit)
	assert.InDelta(t, 3, snapshot.Metrics[0].Value, 0.0001)
}

func TestSnapshot_MissingSampleIsUnavailable(t *testing.T) {
	provider := &fakeProvider{samples: map[string]domainmetrics.Sample{}}
	useCase := NewUseCase(provider, newTestConfig(time.Minute))

	snapshot, err := useCase.Snapshot(context.Background())
	require.NoError(t, err)

	require.Len(t, snapshot.Services, 1)
	assert.False(t, snapshot.Services[0].CPUAvailable)
	assert.False(t, snapshot.Services[0].MemoryAvailable)
}

func TestSnapshot_UsesCacheWithinTTL(t *testing.T) {
	provider := &fakeProvider{samples: map[string]domainmetrics.Sample{}}
	useCase := NewUseCase(provider, newTestConfig(time.Minute))

	_, err := useCase.Snapshot(context.Background())
	require.NoError(t, err)

	_, err = useCase.Snapshot(context.Background())
	require.NoError(t, err)

	assert.Equal(t, 1, provider.calls)
}

func TestSnapshot_RebuildsAfterTTL(t *testing.T) {
	provider := &fakeProvider{samples: map[string]domainmetrics.Sample{}}
	useCase := NewUseCase(provider, newTestConfig(0))

	_, err := useCase.Snapshot(context.Background())
	require.NoError(t, err)

	_, err = useCase.Snapshot(context.Background())
	require.NoError(t, err)

	assert.Equal(t, 2, provider.calls)
}

func TestSnapshot_PropagatesProviderFailure(t *testing.T) {
	provider := &fakeProvider{err: errors.New("prometheus down")}
	useCase := NewUseCase(provider, newTestConfig(time.Minute))

	_, err := useCase.Snapshot(context.Background())
	require.Error(t, err)
	assert.Contains(t, err.Error(), "prometheus down")
}

func TestBuildQueries_ScopesByNamespaceAndPod(t *testing.T) {
	queries := buildQueries(
		[]config.Service{{ID: "api", Name: "API", Namespace: "production", PodRegex: "api-.*"}},
		[]config.CustomMetric{{ID: "rooms", Label: "Rooms", Query: "sum(rooms_total)"}},
	)

	require.Len(t, queries, 3)

	assert.Contains(t, queries[0].Expr, `namespace="production"`)
	assert.Contains(t, queries[0].Expr, `pod=~"api-.*"`)
	assert.Contains(t, queries[0].Expr, "container_cpu_usage_seconds_total")
	assert.Contains(t, queries[1].Expr, "container_memory_working_set_bytes")
	assert.Equal(t, "sum(rooms_total)", queries[2].Expr)
	assert.Equal(t, domainmetrics.UnitCores, queries[0].Unit)
	assert.Equal(t, domainmetrics.UnitBytes, queries[1].Unit)
}
