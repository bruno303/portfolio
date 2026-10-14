# ADR 0003 — Live metrics scope

- Status: accepted
- Date: 2026-10-13

## Context

`/lab` can read anything Prometheus knows about the homelab. Exposing everything would
leak operational details (hosts, internal names, traffic patterns) and turn a portfolio
into an attack surface. The page needs to be impressive *and* boring from a security
standpoint.

## Decision

Publish only a curated, low-cardinality, aggregated set of metrics:

- **CPU and memory per selected service** (aggregated over pods; no pod names, no
  nodes, no IPs) for a short list of deployments, mainly the planning-poker stack.
- **A few application counters** from planning-poker (`planning_poker_active_users`,
  `planning_poker_active_rooms`, `planning_poker_users_total`) once they are exported as
  gauges.
- Nothing financial, nothing per-user, nothing that identifies infrastructure.

Implementation rules:

- The Go API only executes PromQL from its config file — never from the request.
- Results are cached in-process (default 15s) and the API is reachable only inside the
  cluster; the browser talks to the web BFF routes instead.
- Unknown or empty query results render as "unavailable" instead of errors.

## Follow-ups

- `planning_poker_active_*` are currently monotonic counters incremented/decremented by
  the app, which makes "current active" imprecise. Switching them to OTel gauges in the
  planning-poker repo is tracked as a follow-up improvement.
- If the service list grows, add per-service opt-in in the Helm values instead of
  editing the default config.
