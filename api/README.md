# portfolio-api

Small Go service that turns a curated Prometheus slice into JSON for the
`/lab` page of the portfolio site.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/healthz` | liveness probe |
| `GET` | `/api/v1/services` | aggregated CPU and memory per configured service |
| `GET` | `/api/v1/metrics` | curated application metrics (planning-poker counters) |

Empty query results are reported as `"available": false` instead of errors. The
endpoints return `502` only when every query fails (Prometheus unreachable).

## Configuration

`config/config.yaml` (path overridable via `CONFIG_PATH`) defines the curated
scope: which services are aggregated and which PromQL queries are exposed. Only
configuration values are ever interpolated into PromQL — requests never carry
queries.

Environment overrides: `PORT`, `PROMETHEUS_URL`, `LOG_LEVEL`, `CONFIG_PATH`.

## Development

```bash
make run     # go run ./cmd/api
make test    # go test ./... -race
make lint    # golangci-lint run
make build   # static binary in bin/api
```

The snapshot is cached in-process for `prometheus.cache_ttl` (default 15s), so
public traffic never becomes Prometheus traffic.
