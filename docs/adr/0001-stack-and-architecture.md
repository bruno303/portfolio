# ADR 0001 — Stack and architecture

- Status: accepted
- Date: 2026-10-13

## Context

The portfolio must demonstrate senior backend/platform work, not just claim it. It is
hosted in a self-hosted k3s cluster managed by ArgoCD, published through a Cloudflare
Tunnel, and maintained in personal time — so the architecture must be small enough to
run unattended but real enough to be worth reading about.

## Decision

- **`web/` — Next.js 15 (App Router, TypeScript strict, Tailwind v4).** Static-first:
  case studies are MDX compiled at build time. The only dynamic routes are the BFF
  handlers used by the `/lab` widgets.
- **`api/` — small Go service (`portfolio-api`).** It queries Prometheus and returns a
  curated, cached snapshot. Layering follows the same shape used in production
  projects: `domain` (types and the `Provider` interface) → `application` (snapshot
  use case) → `infra` (Prometheus client, HTTP boundary, wiring).
- **`helm/portfolio/`** — one chart, two deployments (web + api), consumed by ArgoCD.
- **Images** — built in GitHub Actions and pushed to GHCR
  (`ghcr.io/bruno303/portfolio-web`, `ghcr.io/bruno303/portfolio-api`).
- **No database.** Content lives in the repository; live state lives in Prometheus.

## Alternatives considered

- **Fully static Astro site.** Smaller, but leaves no room for the live `/lab` page that
  makes the homelab story verifiable, and less aligned with the Go/Next stack used in
  production projects.
- **Headless CMS.** Extra moving part with no benefit for a single author.
- **Rendering MDX at request time.** Build-time compilation keeps the runtime tiny and
  the pages cacheable.

## Consequences

- Two deployables and one chart to keep in sync; CI publishes both images from `main`.
- The site degrades gracefully: if `portfolio-api` or Prometheus is down, `/lab` shows
  an unavailable state instead of failing the build or the page.
- Content changes ship as normal commits — reviewed, versioned, and deployable.
