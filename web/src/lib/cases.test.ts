import { describe, expect, it } from 'vitest';

import { getCase, getCaseSlugs, getCases, getFeaturedCases } from '@/lib/cases';

describe('case loader', () => {
  it('finds all case studies', () => {
    expect(getCaseSlugs()).toEqual([
      'agentic-tooling',
      'dx-tooling',
      'homelab',
      'planning-poker',
    ]);
  });

  it('parses frontmatter for every locale', () => {
    for (const locale of ['en', 'pt'] as const) {
      const studies = getCases(locale);

      expect(studies).toHaveLength(4);

      for (const study of studies) {
        expect(study.title.length).toBeGreaterThan(0);
        expect(study.summary.length).toBeGreaterThan(0);
        expect(study.stack.length).toBeGreaterThan(0);
        expect(study.isFallback).toBe(false);
      }
    }
  });

  it('orders featured cases by explicit order', () => {
    const featured = getFeaturedCases('en');

    expect(featured.map((study) => study.slug)).toEqual([
      'homelab',
      'planning-poker',
      'agentic-tooling',
    ]);
  });

  it('returns the localized MDX body', () => {
    const study = getCase('pt', 'homelab');

    expect(study.content).toContain('## Contexto');
  });

  it('throws for a missing case', () => {
    expect(() => getCase('en', 'does-not-exist')).toThrow();
  });
});
