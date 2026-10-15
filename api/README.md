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

The curated scope is compiled into the binary
(`api/config/config.yaml`, loaded from an embedded baseline): which services
are aggregated and which PromQL queries are exposed. Only configuration values
are ever interpolated into PromQL — requests never carry queries.

Every setting can be replaced by an environment variable:

| Env var | Replaces | Values |
|---|---|---|
| `PORT` | `server.port` | integer |
| `LOG_LEVEL` | `server.log_level` | `INFO`, `DEBUG`, `WARN`, `ERROR` |
| `CORS_ALLOWED_ORIGINS` | `server.cors_allowed_origins` | comma-separated origins |
| `PROMETHEUS_URL` | `prometheus.url` | URL |
| `PROMETHEUS_QUERY_TIMEOUT` | `prometheus.query_timeout` | duration (`5s`) |
| `PROMETHEUS_CACHE_TTL` | `prometheus.cache_ttl` | duration (`15s`) |
| `SERVICES` | `services` | JSON array of `{id, name, namespace, pod_regex}` |
| `CUSTOM_METRICS` | `custom_metrics` | JSON array of `{id, label, unit, query}` |

## Development

```bash
make run     # go run ./cmd/api
make test    # go test ./... -race
make lint    # golangci-lint run
make build   # static binary in bin/api
```

The snapshot is cached in-process for `prometheus.cache_ttl` (default 15s), so
public traffic never becomes Prometheus traffic.
