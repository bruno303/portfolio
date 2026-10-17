/**
 * Verifies the rendered title/OG/Twitter metadata of every route against the
 * repo sources, so a broken metadata template cannot silently ship.
 *
 * Usage:
 *
 *   1. npm run build
 *   2. npm run start          (in another terminal)
 *   3. npm run verify:metadata
 *
 * The base URL comes from the first argument, then VERIFY_BASE_URL, then
 * http://localhost:3000. Expectations are read from web/messages/*.json and the
 * case frontmatter — no strings are duplicated here.
 */
import fs from 'node:fs';

import matter from 'gray-matter';

const TITLE_SUFFIX = ' · Bruno Oliveira';
const MESSAGES_DIR = new URL('../messages/', import.meta.url);
const CASES_DIR = new URL('../src/content/cases/', import.meta.url);

const baseUrl = (
  process.argv[2] ??
  process.env.VERIFY_BASE_URL ??
  'http://localhost:3000'
).replace(/\/+$/u, '');

function readJson(name) {
  return JSON.parse(fs.readFileSync(new URL(name, MESSAGES_DIR), 'utf8'));
}

function caseFile(locale, slug) {
  return new URL(`${locale}/${slug}.mdx`, CASES_DIR);
}

function caseSlugs() {
  return fs
    .readdirSync(new URL('en/', CASES_DIR))
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/u, ''))
    .sort();
}

// Frontmatter for a case, mirroring the site fallback: a missing PT file falls
// back to the EN title/summary.
function caseFrontmatter(slug, locale) {
  const localized = caseFile(locale, slug);

  if (fs.existsSync(localized)) {
    const { data } = matter(fs.readFileSync(localized, 'utf8'));
    return { title: data.title, summary: data.summary };
  }

  const fallback = caseFile('en', slug);
  const { data } = matter(fs.readFileSync(fallback, 'utf8'));
  return { title: data.title, summary: data.summary };
}

function buildExpectations() {
  const messages = { en: readJson('en.json'), pt: readJson('pt.json') };

  const routes = [];

  for (const locale of ['en', 'pt']) {
    const t = messages[locale];
    const home = locale === 'en' ? '/' : '/pt';

    routes.push({ path: home, title: t.meta.title, description: t.meta.description });
    routes.push({
      path: `${home === '/' ? '' : home}/about`,
      title: `${t.about.title}${TITLE_SUFFIX}`,
      description: t.about.subtitle,
    });
    routes.push({
      path: `${home === '/' ? '' : home}/cv`,
      title: `${t.cv.summaryTitle}${TITLE_SUFFIX}`,
      description: t.cv.description,
    });
    routes.push({
      path: `${home === '/' ? '' : home}/lab`,
      title: `${t.lab.title}${TITLE_SUFFIX}`,
      description: t.lab.subtitle,
    });
    routes.push({
      path: `${home === '/' ? '' : home}/cases`,
      title: `${t.cases.title}${TITLE_SUFFIX}`,
      description: t.cases.subtitle,
    });
  }

  for (const slug of caseSlugs()) {
    for (const locale of ['en', 'pt']) {
      const { title, summary } = caseFrontmatter(slug, locale);
      const prefix = locale === 'en' ? '' : '/pt';

      routes.push({
        path: `${prefix}/cases/${slug}`,
        title: `${title}${TITLE_SUFFIX}`,
        description: summary,
      });
    }
  }

  return routes;
}

function decodeEntities(value) {
  return value
    .replace(/&#x27;/gu, "'")
    .replace(/&quot;/gu, '"')
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&amp;/gu, '&');
}

function titleTags(html) {
  return [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/giu)].map((match) =>
    decodeEntities(match[1].trim()),
  );
}

function metaTags(html) {
  const tags = new Map();

  for (const match of html.matchAll(/<meta\b[^>]*>/giu)) {
    const attributes = {};

    for (const attribute of match[0].matchAll(/([\w:-]+)="([^"]*)"/gu)) {
      attributes[attribute[1].toLowerCase()] = attribute[2];
    }

    const key = attributes.property ?? attributes.name;

    if (key) {
      tags.set(key, decodeEntities(attributes.content ?? ''));
    }
  }

  return tags;
}

async function waitForServer() {
  const attempts = 20;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(5000) });

      if (response.ok) {
        return;
      }
    } catch {
      // Not up yet — retry below.
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`server not reachable at ${baseUrl} after ${attempts} attempts`);
}

function assertEqual(failures, path, label, expected, actual) {
  if (actual !== expected) {
    failures.push({ path, label, expected, actual });
  }
}

function assertTruthy(failures, path, label, actual, expected) {
  if (!actual) {
    failures.push({ path, label, expected, actual });
  }
}

async function verifyRoute(route, failures) {
  const url = `${baseUrl}${route.path}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

  if (response.status !== 200) {
    failures.push({
      path: route.path,
      label: 'status',
      expected: '200',
      actual: String(response.status),
    });
    return;
  }

  const html = await response.text();
  const titles = titleTags(html);
  const meta = metaTags(html);

  if (titles.length !== 1) {
    failures.push({
      path: route.path,
      label: 'number of <title> tags',
      expected: '1',
      actual: String(titles.length),
    });
    return;
  }

  assertEqual(failures, route.path, '<title>', route.title, titles[0]);
  assertEqual(failures, route.path, 'og:title', route.title, meta.get('og:title') ?? '');
  assertEqual(
    failures,
    route.path,
    'og:description',
    route.description,
    meta.get('og:description') ?? '',
  );
  assertEqual(
    failures,
    route.path,
    'twitter:title',
    meta.get('og:title') ?? '',
    meta.get('twitter:title') ?? '',
  );

  const image = meta.get('og:image') ?? '';
  assertTruthy(failures, route.path, 'og:image', image, 'non-empty URL');

  const alt = meta.get('og:image:alt') ?? '';
  assertTruthy(failures, route.path, 'og:image:alt', alt, 'non-empty static string');

  if (alt && (/function/u.test(alt) || alt.includes('=>'))) {
    failures.push({
      path: route.path,
      label: 'og:image:alt',
      expected: 'static human-readable text',
      actual: alt,
    });
  }
}

// Unmatched URLs are served by app/global-not-found.tsx
// (experimental.globalNotFound), which is EN-only because there is no locale
// context outside the [locale] segment. The localized [locale]/not-found.tsx
// copy only applies to in-segment notFound() calls, so these checks pin the
// global 404: status, a single <title>, and the EN not-found title.
async function verifyNotFound(path, failures) {
  const { notFound } = readJson('en.json');
  const response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(5000) });

  if (response.status !== 404) {
    failures.push({
      path,
      label: 'status',
      expected: '404',
      actual: String(response.status),
    });
    return;
  }

  const titles = titleTags(await response.text());

  if (titles.length !== 1) {
    failures.push({
      path,
      label: 'number of <title> tags',
      expected: '1',
      actual: String(titles.length),
    });
    return;
  }

  assertEqual(failures, path, '<title>', `${notFound.title}${TITLE_SUFFIX}`, titles[0]);
}

async function main() {
  console.log(`Verifying metadata at ${baseUrl}`);
  await waitForServer();

  const routes = buildExpectations();
  const failures = [];

  for (const route of routes) {
    await verifyRoute(route, failures);

    if (!failures.some((failure) => failure.path === route.path)) {
      console.log(`OK  ${route.path}`);
    }
  }

  await verifyNotFound('/this-page-does-not-exist', failures);
  await verifyNotFound('/pt/this-page-does-not-exist', failures);

  if (failures.length > 0) {
    console.error(`\n${failures.length} metadata failure(s):`);

    for (const failure of failures) {
      console.error(
        `FAIL ${failure.path} — ${failure.label}\n  expected: ${failure.expected}\n  actual:   ${failure.actual}`,
      );
    }

    process.exit(1);
  }

  console.log(`\nVerified ${routes.length} routes and 2 not-found URLs — all metadata OK.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
