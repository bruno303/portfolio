# ADR 0002 — Bilingual content and theming

- Status: accepted
- Date: 2026-10-13

## Context

The primary goal is an international remote role, and the LinkedIn profile is already in
English. At the same time, the Brazilian audience should not be left behind. Visually,
the site must feel minimalist and readable in both light and dark environments.

## Decision

- **Locales**: `en` (default, served at `/`) and `pt` (served at `/pt`), using
  `next-intl` with `localePrefix: 'as-needed'`.
- **Content**: UI strings live in `web/messages/{en,pt}.json`. Case studies live as MDX
  under `web/src/content/cases/{en,pt}/`. If a Portuguese case is missing, the English
  one is served and flagged as a fallback in the loader.
- **SEO**: every page emits `hreflang` alternates (`en`, `pt`, `x-default`) through
  `generateMetadata`, plus a bilingual sitemap.
- **Theming**: light, dark and system modes via `next-themes` (class strategy on
  `<html>`), toggled from the header. Tailwind v4 with a single accent color and one
  sans/one mono typeface. No theme flash: the preference is applied before paint.

## Consequences

- Translations are additive: missing PT content never breaks a page.
- Print styles for the `/cv` route reuse the same components, so the CV PDF matches the
  site's visual language.
- `next-intl` adds a middleware and a small client provider; both are lightweight and
  well-tested.
