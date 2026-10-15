// Package setup wires concrete adapters into the HTTP server.
package setup

import (
	"log/slog"
	"net/http"
	"time"

	application "github.com/bruno303/portfolio/api/internal/application/metrics"
	"github.com/bruno303/portfolio/api/internal/config"
	httpboundary "github.com/bruno303/portfolio/api/internal/infra/boundaries/http"
	"github.com/bruno303/portfolio/api/internal/infra/prometheus"
)

// NewRouter builds the application graph and returns the HTTP handler.
func NewRouter(cfg *config.Config, logger *slog.Logger) http.Handler {
	queryTimeout := cfg.Prometheus.QueryTimeout

	provider := prometheus.New(cfg.Prometheus.URL, queryTimeout, logger)
	useCase := application.NewUseCase(provider, cfg)

	return httpboundary.NewRouter(useCase, httpboundary.Options{
		AllowedOrigins: cfg.Server.CORSAllowedOrigins,
		RequestTimeout: queryTimeout + time.Second,
		Logger:         logger,
	})
}
