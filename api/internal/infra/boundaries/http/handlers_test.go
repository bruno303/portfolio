package http

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/bruno303/portfolio/api/internal/domain/metrics"
)

type fakeSnapshotProvider struct {
	snapshot *metrics.Snapshot
	err      error
}

func (f *fakeSnapshotProvider) Snapshot(context.Context) (*metrics.Snapshot, error) {
	if f.err != nil {
		return nil, f.err
	}

	return f.snapshot, nil
}

func testRouter(provider SnapshotProvider) http.Handler {
	return NewRouter(provider, Options{
		AllowedOrigins: []string{"http://localhost:3000"},
		RequestTimeout: time.Second,
		Logger:         slog.New(slog.NewTextHandler(io.Discard, nil)),
	})
}

func doRequest(t *testing.T, router http.Handler, request *http.Request) *httptest.ResponseRecorder {
	t.Helper()

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)

	return recorder
}

func TestServices_ReturnsSnapshot(t *testing.T) {
	provider := &fakeSnapshotProvider{snapshot: &metrics.Snapshot{
		GeneratedAt: time.Date(2026, 10, 13, 12, 0, 0, 0, time.UTC),
		Services: []metrics.ServiceMetrics{
			{ID: "api", Name: "API", CPUCores: 0.1, CPUAvailable: true},
		},
	}}

	recorder := doRequest(t, testRouter(provider), httptest.NewRequest(http.MethodGet, "/api/v1/services", nil))

	assert.Equal(t, http.StatusOK, recorder.Code)
	assert.Equal(t, "application/json; charset=utf-8", recorder.Header().Get("Content-Type"))

	var payload servicesResponse
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &payload))
	require.Len(t, payload.Services, 1)
	assert.Equal(t, "api", payload.Services[0].ID)
	assert.InDelta(t, 0.1, payload.Services[0].CPUCores, 0.0001)
}

func TestMetrics_ReturnsSnapshot(t *testing.T) {
	provider := &fakeSnapshotProvider{snapshot: &metrics.Snapshot{
		GeneratedAt: time.Date(2026, 10, 13, 12, 0, 0, 0, time.UTC),
		Metrics: []metrics.CustomMetric{
			{ID: "rooms", Label: "Rooms", Unit: metrics.UnitCount, Value: 2, Available: true},
		},
	}}

	recorder := doRequest(t, testRouter(provider), httptest.NewRequest(http.MethodGet, "/api/v1/metrics", nil))

	assert.Equal(t, http.StatusOK, recorder.Code)

	var payload metricsResponse
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &payload))
	require.Len(t, payload.Metrics, 1)
	assert.Equal(t, "Rooms", payload.Metrics[0].Label)
}

func TestServices_ProviderFailureReturnsBadGateway(t *testing.T) {
	provider := &fakeSnapshotProvider{err: errors.New("prometheus down")}

	recorder := doRequest(t, testRouter(provider), httptest.NewRequest(http.MethodGet, "/api/v1/services", nil))

	assert.Equal(t, http.StatusBadGateway, recorder.Code)

	var payload errorResponse
	require.NoError(t, json.Unmarshal(recorder.Body.Bytes(), &payload))
	assert.NotEmpty(t, payload.Error)
}

func TestHealth(t *testing.T) {
	recorder := doRequest(t, testRouter(&fakeSnapshotProvider{}), httptest.NewRequest(http.MethodGet, "/healthz", nil))

	assert.Equal(t, http.StatusOK, recorder.Code)
}

func TestCORS_AllowsConfiguredOrigin(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	request.Header.Set("Origin", "http://localhost:3000")

	recorder := doRequest(t, testRouter(&fakeSnapshotProvider{}), request)

	assert.Equal(t, "http://localhost:3000", recorder.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "Origin", recorder.Header().Get("Vary"))
}

func TestCORS_IgnoresUnknownOrigin(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	request.Header.Set("Origin", "http://evil.example")

	recorder := doRequest(t, testRouter(&fakeSnapshotProvider{}), request)

	assert.Empty(t, recorder.Header().Get("Access-Control-Allow-Origin"))
}

func TestCORS_Preflight(t *testing.T) {
	recorder := doRequest(t, testRouter(&fakeSnapshotProvider{}), httptest.NewRequest(http.MethodOptions, "/api/v1/services", nil))

	assert.Equal(t, http.StatusNoContent, recorder.Code)
}
