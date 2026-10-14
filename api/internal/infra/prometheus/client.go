// Package prometheus is a minimal Prometheus HTTP API client implementing the
// metrics provider contract.
package prometheus

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/bruno303/portfolio/api/internal/domain/metrics"
)

const maxResponseBytes = 1 << 20

// Client queries an instant-query endpoint (`/api/v1/query`).
type Client struct {
	baseURL string
	http    *http.Client
	timeout time.Duration
	logger  *slog.Logger
}

// New builds a client for the given Prometheus base URL.
func New(baseURL string, timeout time.Duration, logger *slog.Logger) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		http:    &http.Client{},
		timeout: timeout,
		logger:  logger,
	}
}

// Query implements metrics.Provider. Queries run sequentially on purpose:
// the snapshot is cached, and a handful of instant queries does not justify
// more concurrency against a small homelab Prometheus.
func (c *Client) Query(ctx context.Context, queries []metrics.Query) (map[string]metrics.Sample, error) {
	if len(queries) == 0 {
		return map[string]metrics.Sample{}, nil
	}

	samples := make(map[string]metrics.Sample, len(queries))

	var failures []error

	for _, query := range queries {
		value, available, err := c.queryOne(ctx, query.Expr)
		if err != nil {
			failures = append(failures, fmt.Errorf("query %q: %w", query.ID, err))
			samples[query.ID] = metrics.Sample{}
			continue
		}

		samples[query.ID] = metrics.Sample{Value: value, Available: available}
	}

	if len(failures) == len(queries) {
		return nil, errors.Join(failures...)
	}

	if len(failures) > 0 {
		c.logger.Warn("partial metric query failures",
			"failures", len(failures),
			"total", len(queries),
		)
	}

	return samples, nil
}

func (c *Client) queryOne(ctx context.Context, expr string) (value float64, available bool, err error) {
	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	endpoint := c.baseURL + "/api/v1/query?" + url.Values{"query": {expr}}.Encode()

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return 0, false, fmt.Errorf("build request: %w", err)
	}

	response, err := c.http.Do(request)
	if err != nil {
		return 0, false, fmt.Errorf("request: %w", err)
	}
	defer func() {
		_ = response.Body.Close()
	}()

	body, err := io.ReadAll(io.LimitReader(response.Body, maxResponseBytes))
	if err != nil {
		return 0, false, fmt.Errorf("read body: %w", err)
	}

	if response.StatusCode != http.StatusOK {
		return 0, false, fmt.Errorf("unexpected status %d: %s", response.StatusCode, truncate(string(body), 200))
	}

	var payload queryResponse
	if err := json.Unmarshal(body, &payload); err != nil {
		return 0, false, fmt.Errorf("decode response: %w", err)
	}

	if payload.Status != "success" {
		return 0, false, fmt.Errorf("prometheus error %s: %s", payload.ErrorType, payload.Error)
	}

	if len(payload.Data.Result) == 0 {
		return 0, false, nil
	}

	value, err = payload.Data.Result[0].Value.parse()
	if err != nil {
		return 0, false, fmt.Errorf("parse sample value: %w", err)
	}

	return value, true, nil
}

type queryResponse struct {
	Status    string `json:"status"`
	ErrorType string `json:"errorType"`
	Error     string `json:"error"`
	Data      struct {
		Result []struct {
			Value sampleValue `json:"value"`
		} `json:"result"`
	} `json:"data"`
}

// sampleValue is the Prometheus `[<timestamp>, "<value>"]` pair.
type sampleValue [2]json.RawMessage

func (v sampleValue) parse() (float64, error) {
	var raw string
	if err := json.Unmarshal(v[1], &raw); err != nil {
		return 0, err
	}

	return strconv.ParseFloat(raw, 64)
}

func truncate(value string, limit int) string {
	if len(value) <= limit {
		return value
	}

	return value[:limit] + "..."
}
