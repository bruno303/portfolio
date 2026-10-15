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

export async function alt({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const study = getCase(locale as Locale, slug);

  return study.title;
}

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
