// Package metrics assembles the curated live snapshot served by the API.
package metrics

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/bruno303/portfolio/api/internal/config"
	"github.com/bruno303/portfolio/api/internal/domain/metrics"
)

const (
	serviceCPUSamplePrefix    = "service.cpu."
	serviceMemorySamplePrefix = "service.memory."
	customSamplePrefix        = "metric."

	cpuRateWindow = "5m"
)

// UseCase builds and caches the snapshot. Snapshot() is cached for the
// configured TTL so public traffic never becomes Prometheus traffic.
type UseCase struct {
	provider metrics.Provider
	services []config.Service
	custom   []config.CustomMetric
	ttl      time.Duration

	mu       sync.Mutex
	cached   *metrics.Snapshot
	cachedAt time.Time
}

// NewUseCase wires the use case with its provider and curated query set.
func NewUseCase(provider metrics.Provider, cfg *config.Config) *UseCase {
	return &UseCase{
		provider: provider,
		services: cfg.Services,
		custom:   cfg.CustomMetrics,
		ttl:      time.Duration(cfg.Prometheus.CacheTTL),
	}
}

// Snapshot returns the cached snapshot or rebuilds it when stale.
func (u *UseCase) Snapshot(ctx context.Context) (*metrics.Snapshot, error) {
	u.mu.Lock()
	defer u.mu.Unlock()

	if u.cached != nil && time.Since(u.cachedAt) < u.ttl {
		return u.cached, nil
	}

	snapshot, err := u.build(ctx)
	if err != nil {
		return nil, err
	}

	u.cached = snapshot
	u.cachedAt = time.Now()

	return snapshot, nil
}

func (u *UseCase) build(ctx context.Context) (*metrics.Snapshot, error) {
	samples, err := u.provider.Query(ctx, buildQueries(u.services, u.custom))
	if err != nil {
		return nil, fmt.Errorf("query metrics: %w", err)
	}

	snapshot := &metrics.Snapshot{
		GeneratedAt: time.Now().UTC(),
		Services:    make([]metrics.ServiceMetrics, 0, len(u.services)),
		Metrics:     make([]metrics.CustomMetric, 0, len(u.custom)),
	}

	for _, svc := range u.services {
		cpu := samples[serviceCPUSamplePrefix+svc.ID]
		memory := samples[serviceMemorySamplePrefix+svc.ID]

		snapshot.Services = append(snapshot.Services, metrics.ServiceMetrics{
			ID:              svc.ID,
			Name:            svc.Name,
			CPUCores:        cpu.Value,
			CPUAvailable:    cpu.Available,
			MemoryBytes:     memory.Value,
			MemoryAvailable: memory.Available,
		})
	}

	for _, custom := range u.custom {
		sample := samples[customSamplePrefix+custom.ID]

		snapshot.Metrics = append(snapshot.Metrics, metrics.CustomMetric{
			ID:        custom.ID,
			Label:     custom.Label,
			Unit:      parseUnit(custom.Unit),
			Value:     sample.Value,
			Available: sample.Available,
		})
	}

	return snapshot, nil
}

// buildQueries derives PromQL from the curated configuration. Only
// configuration values ever reach a query string; request data never does.
func buildQueries(services []config.Service, custom []config.CustomMetric) []metrics.Query {
	queries := make([]metrics.Query, 0, len(services)*2+len(custom))

	for _, svc := range services {
		queries = append(queries,
			metrics.Query{
				ID:   serviceCPUSamplePrefix + svc.ID,
				Unit: metrics.UnitCores,
				Expr: cpuQuery(svc),
			},
			metrics.Query{
				ID:   serviceMemorySamplePrefix + svc.ID,
				Unit: metrics.UnitBytes,
				Expr: memoryQuery(svc),
			},
		)
	}

	for _, metric := range custom {
		queries = append(queries, metrics.Query{
			ID:    customSamplePrefix + metric.ID,
			Label: metric.Label,
			Unit:  parseUnit(metric.Unit),
			Expr:  metric.Query,
		})
	}

	return queries
}

func cpuQuery(svc config.Service) string {
	return fmt.Sprintf(
		`sum(rate(container_cpu_usage_seconds_total{namespace=%q,pod=~%q,container!="",container!="POD"}[%s]))`,
		svc.Namespace, svc.PodRegex, cpuRateWindow,
	)
}

func memoryQuery(svc config.Service) string {
	return fmt.Sprintf(
		`sum(container_memory_working_set_bytes{namespace=%q,pod=~%q,container!="",container!="POD"})`,
		svc.Namespace, svc.PodRegex,
	)
}

func parseUnit(raw string) metrics.Unit {
	switch raw {
	case string(metrics.UnitCores):
		return metrics.UnitCores
	case string(metrics.UnitBytes):
		return metrics.UnitBytes
	default:
		return metrics.UnitCount
	}
}
