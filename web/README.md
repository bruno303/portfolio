# portfolio-web

Next.js 15 front end of the portfolio: bilingual (EN/PT), statically generated,
with MDX case studies and a small BFF for the live metrics on `/lab`.

## Structure

| Path | What it is |
|---|---|
| `src/app/[locale]/` | pages: home, cases, lab, about, cv |
| `src/app/api/live/` | BFF routes that proxy `portfolio-api` (web -> api) |
| `src/components/` | layout, UI, MDX components (Callout, Mermaid, StatGrid) and live widgets |
| `src/content/cases/{en,pt}/` | case studies as MDX with frontmatter |
| `src/content/profile.ts` | timeline, education, skills, languages (localized) |
| `messages/{en,pt}.json` | UI strings |
| `src/lib/cases.ts` | case loader (frontmatter validation, EN fallback) |

## Commands

```bash
npm run dev        # dev server on :3000 (API_BASE_URL defaults to :8080)
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest
npm run cv:pdf     # generate the CV PDFs from /cv (needs the dev server)
```

## Writing a case study

Create `src/content/cases/en/<slug>.mdx` (and the matching `pt/` version; missing
translations fall back to English and are flagged in the UI):

```mdx
---
title: "..."
summary: "..."
role: "..."
period: "..."
stack: ["Go", "Kubernetes"]
highlights:
  - value: "3"
    label: "replicas in production"
links:
  - label: "Repository"
    url: "https://github.com/bruno303/..."
featured: true
order: 1
---

## Context
...
```

Custom MDX components: `<Callout tone="warning">`, `<StatGrid stats={[...]} />` and
`<Mermaid chart={`graph LR; A-->B`} caption="..." />`.
