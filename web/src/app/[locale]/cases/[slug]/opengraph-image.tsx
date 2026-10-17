import { routing, type Locale } from '@/i18n/routing';
import { getCase, getCaseSlugs } from '@/lib/cases';
import { OG_SIZE, createOgImage } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return getCaseSlugs().flatMap((slug) =>
    routing.locales.map((locale) => ({ slug, locale })),
  );
}

// Intentional AGENTS.md exception: `og:image:alt` copy lives here rather than in
// web/messages/*.json because the pinned next@15.5.27 only supports static
// string `alt` exports (function exports are serialized into the meta tag).
// EN-only is accepted; keep it a human-readable literal.
export const alt = 'Bruno Oliveira — case study';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const study = getCase(locale as Locale, slug);

  return createOgImage({
    title: study.title,
    summary: study.summary,
    tags: study.stack,
  });
}
