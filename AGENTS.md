# AGENTS.md

Repository guide for coding agents working in `portfolio`.

## Scope

- Web: Next.js 15 app in `web/` (App Router, TypeScript strict, Tailwind v4, next-intl, MDX case studies).
- API: Go 1.25 service in `api/` (`portfolio-api`) that turns curated PromQL into JSON.
- Deploy: Helm chart in `helm/portfolio/`, consumed by ArgoCD in the homelab.
- Bilingual content: English (default) + Portuguese, with an English fallback for
  missing translations.

## Quick Paths

- Web pages: `web/src/app/[locale]/`
- Live widgets: `web/src/components/lab/`; BFF routes: `web/src/app/api/live/`
- Case studies: `web/src/content/cases/{en,pt}/`
- Profile data (timeline, skills): `web/src/content/profile.ts`
- UI strings: `web/messages/{en,pt}.json`
- API wiring: `api/internal/setup/container.go`
- Curated metric scope: `api/config/config.yaml` and `docs/adr/0003-live-metrics-scope.md`

## Verified Commands

Run from the repository root.

### Setup

- `make init` - install web (npm) and api (go) dependencies.

### Run

- `make web` - Next.js dev server on :3000.
- `make api` - API on :8080. Live data needs `PROMETHEUS_URL` (env overrides the config file).

### Build and quality

- `make build` - production builds for both components.
- `make check` - typecheck + unit tests (web) and go vet/test (api).
- `make lint` - eslint + golangci-lint.
- `make helm-lint` - `helm lint` for the chart.

### Single commands

- Single web test: `cd web && npx vitest run src/lib/cases.test.ts`
- Single Go test: `cd api && go test ./internal/application/... -run TestSnapshot`
- CV PDFs: `cd web && npm run cv:pdf` (dev server running; needs Chromium, or run inside
  the Playwright Docker image).

## Web Conventions

- TypeScript strict; avoid `any`.
- Imports use the `@/*` alias (maps to `web/src`).
- All user-visible strings live in `web/messages/*.json` (next-intl). Do not hardcode
  copy in components.
- Case studies: keep EN and PT in sync. A missing PT file falls back to EN and the UI
  shows a notice automatically.
- `/lab` data always flows through the BFF routes (`/api/live/*`); the browser never
  talks to `portfolio-api` directly.
- Reuse the existing primitives (`components/ui`, MDX `Callout`, `Mermaid`, `StatGrid`)
  instead of introducing new ones.

## API Conventions

- Layering: `domain` (types + `Provider` interface) -> `application` (snapshot use case
  and caching) -> `infra` (Prometheus client, HTTP boundary) -> `setup` (wiring). Depend
  inward only.
- PromQL is built exclusively from `config/config.yaml`; request data must never reach a
  query string.
- Empty query results are `"available": false`, not errors. The API returns `502` only
  when every query fails.
- New endpoints: handler + route in `infra/boundaries/http`, with tests beside them.
- Before pushing: `go test ./... -race` and `golangci-lint run` must be clean.

## Content Rules

- Never invent numbers. Metrics in case studies must come from the repositories or from
  observable reality.
- Keep the live-metrics scope small (ADR 0003): no per-pod, per-node or financial data.

## Deploy Notes

- CI builds `ghcr.io/bruno303/portfolio-web` and `-api` on pushes to `main` that touch
  `web/**` or `api/**`.
- ArgoCD (configured in `bruno303/study-topics`) syncs `helm/portfolio`; step-by-step in
  `docs/deploy.md`.
- Image bumps are one-line changes in the production values file.

## Working Style for Agents

- Read existing files before editing; mirror established patterns.
- Prefer minimal, targeted changes over broad refactors.
- Keep documentation ASCII-only unless the file already uses Unicode.
