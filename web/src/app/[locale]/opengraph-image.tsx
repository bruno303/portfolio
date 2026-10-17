import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { OG_SIZE, createOgImage } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Intentional AGENTS.md exception: `og:image:alt` copy lives here rather than in
// web/messages/*.json because the pinned next@15.5.27 only supports static
// string `alt` exports (function exports are serialized into the meta tag).
// EN-only is accepted; keep it a human-readable literal.
export const alt = 'Bruno Oliveira — Senior Software Engineer';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return createOgImage({ title: t('title'), summary: t('description') });
}
