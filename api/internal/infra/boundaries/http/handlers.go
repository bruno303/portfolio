package http

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/bruno303/portfolio/api/internal/domain/metrics"
)

type handlers struct {
	provider SnapshotProvider
	logger   *slog.Logger
}

type servicesResponse struct {
	GeneratedAt time.Time                 `json:"generatedAt"`
	Services    []metrics.ServiceMetrics  `json:"services"`
}

type metricsResponse struct {
	GeneratedAt time.Time               `json:"generatedAt"`
	Metrics     []metrics.CustomMetric  `json:"metrics"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func (h *handlers) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, h.logger, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *handlers) services(w http.ResponseWriter, r *http.Request) {
	snapshot, err := h.provider.Snapshot(r.Context())
	if err != nil {
		h.logger.Error("services snapshot failed", "error", err)
		writeJSON(w, h.logger, http.StatusBadGateway, errorResponse{Error: "metrics provider unavailable"})

		return
	}

	writeJSON(w, h.logger, http.StatusOK, servicesResponse{
		GeneratedAt: snapshot.GeneratedAt,
		Services:    snapshot.Services,
	})
}

func (h *handlers) customMetrics(w http.ResponseWriter, r *http.Request) {
	snapshot, err := h.provider.Snapshot(r.Context())
	if err != nil {
		h.logger.Error("metrics snapshot failed", "error", err)
		writeJSON(w, h.logger, http.StatusBadGateway, errorResponse{Error: "metrics provider unavailable"})

		return
	}

	writeJSON(w, h.logger, http.StatusOK, metricsResponse{
		GeneratedAt: snapshot.GeneratedAt,
		Metrics:     snapshot.Metrics,
	})
}

func writeJSON(w http.ResponseWriter, logger *slog.Logger, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		logger.Error("encode response", "error", err)
	}
}
