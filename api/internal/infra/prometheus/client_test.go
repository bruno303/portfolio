package prometheus

import (
	"context"
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

func newTestClient(t *testing.T, handler http.HandlerFunc) *Client {
	t.Helper()

	server := httptest.NewServer(handler)
	t.Cleanup(server.Close)

	logger := slog.New(slog.NewTextHandler(io.Discard, nil))

	return New(server.URL, time.Second, logger)
}

func writeJSON(t *testing.T, w http.ResponseWriter, status int, body string) {
	t.Helper()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	_, err := w.Write([]byte(body))
	require.NoError(t, err)
}

func TestQuery_ParsesVectorValue(t *testing.T) {
	client := newTestClient(t, func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(t, w, http.StatusOK,
			`{"status":"success","data":{"resultType":"vector","result":[{"metric":{},"value":[1712345678.123,"12.5"]}]}}`)
	})

	samples, err := client.Query(context.Background(), []metrics.Query{{ID: "cpu", Expr: "up"}})
	require.NoError(t, err)
	assert.InDelta(t, 12.5, samples["cpu"].Value, 0.0001)
	assert.True(t, samples["cpu"].Available)
}

func TestQuery_EmptyResultIsUnavailable(t *testing.T) {
	client := newTestClient(t, func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(t, w, http.StatusOK, `{"status":"success","data":{"resultType":"vector","result":[]}}`)
	})

	samples, err := client.Query(context.Background(), []metrics.Query{{ID: "cpu", Expr: "up"}})
	require.NoError(t, err)
	assert.False(t, samples["cpu"].Available)
}

func TestQuery_AllFailuresReturnError(t *testing.T) {
	client := newTestClient(t, func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(t, w, http.StatusInternalServerError, `boom`)
	})

	samples, err := client.Query(context.Background(), []metrics.Query{{ID: "cpu", Expr: "up"}})
	require.Error(t, err)
	assert.Nil(t, samples)
	assert.Contains(t, err.Error(), "unexpected status 500")
}

func TestQuery_PartialFailureIsTolerated(t *testing.T) {
	client := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("query") == "bad" {
			writeJSON(t, w, http.StatusInternalServerError, "boom")
			return
		}

		writeJSON(t, w, http.StatusOK,
			`{"status":"success","data":{"resultType":"vector","result":[{"metric":{},"value":[1,"7"]}]}}`)
	})

	samples, err := client.Query(context.Background(), []metrics.Query{
		{ID: "good", Expr: "up"},
		{ID: "bad", Expr: "bad"},
	})
	require.NoError(t, err)
	assert.True(t, samples["good"].Available)
	assert.False(t, samples["bad"].Available)
}

func TestQuery_PrometheusErrorStatus(t *testing.T) {
	client := newTestClient(t, func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(t, w, http.StatusOK, `{"status":"error","errorType":"bad_data","error":"parse error"}`)
	})

	samples, err := client.Query(context.Background(), []metrics.Query{{ID: "cpu", Expr: "??"}})
	require.Error(t, err)
	assert.Nil(t, samples)
	assert.Contains(t, err.Error(), "parse error")
}

func TestQuery_InvalidJSON(t *testing.T) {
	client := newTestClient(t, func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(t, w, http.StatusOK, `not-json`)
	})

	_, err := client.Query(context.Background(), []metrics.Query{{ID: "cpu", Expr: "up"}})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "decode response")
}

func TestQuery_NoQueries(t *testing.T) {
	client := newTestClient(t, func(_ http.ResponseWriter, _ *http.Request) {
		t.Fatal("no request expected")
	})

	samples, err := client.Query(context.Background(), nil)
	require.NoError(t, err)
	assert.Empty(t, samples)
}
