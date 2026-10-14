// Package metrics defines the portfolio's live-metric contracts: what can be
// queried and the shapes the API returns.
package metrics

import (
	"context"
	"time"
)

// Unit describes how a sample value should be formatted.
type Unit string

const (
	UnitCores Unit = "cores"
	UnitBytes Unit = "bytes"
	UnitCount Unit = "count"
)

// Query is a single PromQL query together with the identity the caller uses to
// match the sample back to its presentation.
type Query struct {
	ID    string
	Label string
	Unit  Unit
	Expr  string
}

// Sample is one queried value. Available is false when the query executed but
// returned no timeseries (for example a service that is not running).
type Sample struct {
	Value     float64
	Available bool
}

// Provider executes a batch of queries. Implementations return a sample for
// every query that executed, even when empty; the returned error is reserved
// for total failures.
type Provider interface {
	Query(ctx context.Context, queries []Query) (map[string]Sample, error)
}

// ServiceMetrics is the aggregated resource usage of one deployment.
type ServiceMetrics struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	CPUCores        float64 `json:"cpuCores"`
	CPUAvailable    bool    `json:"cpuAvailable"`
	MemoryBytes     float64 `json:"memoryBytes"`
	MemoryAvailable bool    `json:"memoryAvailable"`
}

// CustomMetric is one curated application or infrastructure metric.
type CustomMetric struct {
	ID        string  `json:"id"`
	Label     string  `json:"label"`
	Unit      Unit    `json:"unit"`
	Value     float64 `json:"value"`
	Available bool    `json:"available"`
}

// Snapshot is a cached, point-in-time view served to the web app.
type Snapshot struct {
	GeneratedAt time.Time
	Services    []ServiceMetrics
	Metrics     []CustomMetric
}
