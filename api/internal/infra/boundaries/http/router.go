// Package http is the HTTP boundary: routing, middleware and handlers.
package http

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/bruno303/portfolio/api/internal/domain/metrics"
)

// SnapshotProvider is what the handlers need from the application layer.
type SnapshotProvider interface {
	Snapshot(ctx context.Context) (*metrics.Snapshot, error)
}

// Options configures the router.
type Options struct {
	AllowedOrigins []string
	RequestTimeout time.Duration
	Logger         *slog.Logger
}

// NewRouter wires routes and middleware into an http.Handler.
func NewRouter(provider SnapshotProvider, options Options) http.Handler {
	handlers := &handlers{provider: provider, logger: options.Logger}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", handlers.health)
	mux.HandleFunc("GET /api/v1/services", handlers.services)
	mux.HandleFunc("GET /api/v1/metrics", handlers.customMetrics)

	var handler http.Handler = mux
	handler = cors(options.AllowedOrigins)(handler)
	handler = timeout(options.RequestTimeout)(handler)
	handler = logging(options.Logger)(handler)
	handler = recoverer(options.Logger)(handler)

	return handler
}
