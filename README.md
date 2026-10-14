# portfolio

Personal portfolio for Bruno Oliveira — senior software engineer, backend & platform.

The site is more than a resume. It is deployed the same way production software is
shipped here: container images, a Helm chart, ArgoCD GitOps and OpenTelemetry inside a
self-hosted k3s cluster. The `/lab` page renders live CPU and memory numbers read from
Prometheus through a small Go API.

## Why this repo exists

- **Dogfooding** — the portfolio runs on the same platform stack it talks about.
- **Bilingual** — English (default) and Portuguese content, generated statically.
- **Live by default** — curated live metrics with honest empty states when the lab is
  unreachable.

## Repository layout

| Path | What it is |
|---|---|
| `web/` | Next.js 15 app — App Router, TypeScript strict, Tailwind v4, MDX case studies, next-intl |
| `api/` | Go service (`portfolio-api`) that queries Prometheus and exposes curated JSON for `/lab` |
| `helm/portfolio/` | Helm chart used by ArgoCD to deploy both services |
| `docs/` | ADRs and deployment notes |

## Quickstart

Prerequisites: Node 24+, Go 1.25+, Docker (optional), Helm 3 (for chart lint).

```bash
make init   # install web deps and go modules
make api    # run portfolio-api on :8080
make web    # run the site on :3000 (uses API_BASE_URL=http://localhost:8080)
```

The live widgets show an "unavailable" state unless the API can reach a Prometheus:

```bash
PROMETHEUS_URL=https://prometheus.example.net make api
```

## Quality checks

```bash
make check      # typecheck + unit tests (web) + go vet/test (api)
make lint       # eslint + golangci-lint
make helm-lint  # helm lint helm/portfolio
make cv-pdf     # regenerate the CV PDF (requires `npx playwright install chromium`)
```

## Deployment

See [docs/deploy.md](docs/deploy.md). Short version: CI builds
`ghcr.io/bruno303/portfolio-web` and `ghcr.io/bruno303/portfolio-api` on every push to
`main`; ArgoCD in the homelab syncs `helm/portfolio`; Cloudflare Tunnel publishes
`portfolio.bsoapp.net`.

## Roadmap

- [x] v0 — scaffold: web + api + helm chart + CI
- [ ] v1 — content pass (review the 4 case studies), CV PDF generated, OG images
- [ ] v1.1 — deploy to the homelab: ArgoCD app, DNS, Cloudflare Tunnel
- [ ] v2 — notes/blog (restore drills, ArgoCD tuning), "view a real trace of this page"
- [ ] v2.1 — planning-poker live demo embedded in its case study

## Decisions

- [ADR 0001 — Stack and architecture](docs/adr/0001-stack-and-architecture.md)
- [ADR 0002 — Bilingual content and theming](docs/adr/0002-bilingual-and-theming.md)
- [ADR 0003 — Live metrics scope](docs/adr/0003-live-metrics-scope.md)

## License

MIT
