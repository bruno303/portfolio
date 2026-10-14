import fs from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';

import { routing, type Locale } from '@/i18n/routing';

const CASES_ROOT = path.join(process.cwd(), 'src/content/cases');

export type CaseHighlight = { value: string; label: string };
export type CaseLink = { label: string; url: string };

export type CaseFrontmatter = {
  title: string;
  summary: string;
  role: string;
  period: string;
  stack: string[];
  highlights: CaseHighlight[];
  links: CaseLink[];
  featured: boolean;
  order: number;
};

export type CaseMeta = CaseFrontmatter & {
  slug: string;
  locale: Locale;
  isFallback: boolean;
};

export type CaseStudy = CaseMeta & { content: string };

function directory(locale: Locale): string {
  return path.join(CASES_ROOT, locale);
}

export function getCaseSlugs(): string[] {
  return fs
    .readdirSync(directory(routing.defaultLocale))
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/u, ''))
    .sort();
}

export function getCase(locale: Locale, slug: string): CaseStudy {
  const { frontmatter, content, isFallback } = readCaseFile(locale, slug);

  return { ...frontmatter, slug, locale, isFallback, content };
}

export function getCases(locale: Locale): CaseMeta[] {
  return getCaseSlugs()
    .map((slug) => {
      const { frontmatter, isFallback } = readCaseFile(locale, slug);

      return { ...frontmatter, slug, locale, isFallback };
    })
    .sort((a, b) => a.order - b.order);
}

export function getFeaturedCases(locale: Locale, limit = 4): CaseMeta[] {
  return getCases(locale)
    .filter((study) => study.featured)
    .slice(0, limit);
}

function readCaseFile(
  locale: Locale,
  slug: string,
): { frontmatter: CaseFrontmatter; content: string; isFallback: boolean } {
  const localized = path.join(directory(locale), `${slug}.mdx`);

  let file = localized;
  let isFallback = false;

  if (!fs.existsSync(localized)) {
    file = path.join(directory(routing.defaultLocale), `${slug}.mdx`);
    isFallback = true;
  }

  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);

  return {
    frontmatter: parseFrontmatter(slug, data),
    content,
    isFallback,
  };
}

function parseFrontmatter(slug: string, data: Record<string, unknown>): CaseFrontmatter {
  return {
    title: requiredString(slug, data, 'title'),
    summary: requiredString(slug, data, 'summary'),
    role: requiredString(slug, data, 'role'),
    period: requiredString(slug, data, 'period'),
    stack: stringArray(slug, data, 'stack'),
    highlights: highlights(slug, data),
    links: links(slug, data),
    featured: data.featured === true,
    order: typeof data.order === 'number' ? data.order : 100,
  };
}

function requiredString(slug: string, data: Record<string, unknown>, key: string): string {
  const value = data[key];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`case "${slug}": frontmatter "${key}" is required`);
  }

  return value;
}

function stringArray(slug: string, data: Record<string, unknown>, key: string): string[] {
  const value = data[key];

  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`case "${slug}": frontmatter "${key}" must be a list of strings`);
  }

  return value as string[];
}

function highlights(slug: string, data: Record<string, unknown>): CaseHighlight[] {
  const value = data.highlights;

  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`case "${slug}": frontmatter "highlights" must be a list`);
  }

  return value.map((item, index) => {
    const entry = item as Record<string, unknown>;

    if (typeof entry.value !== 'string' || typeof entry.label !== 'string') {
      throw new Error(`case "${slug}": highlights[${index}] needs "value" and "label"`);
    }

    return { value: entry.value, label: entry.label };
  });
}

function links(slug: string, data: Record<string, unknown>): CaseLink[] {
  const value = data.links;

  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`case "${slug}": frontmatter "links" must be a list`);
  }

  return value.map((item, index) => {
    const entry = item as Record<string, unknown>;

    if (typeof entry.label !== 'string' || typeof entry.url !== 'string') {
      throw new Error(`case "${slug}": links[${index}] needs "label" and "url"`);
    }

    return { label: entry.label, url: entry.url };
  });
}
