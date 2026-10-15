import { getTranslations } from 'next-intl/server';

import { routing } from '@/i18n/routing';
import { OG_SIZE, createOgImage } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function alt({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return t('title');
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return createOgImage({ title: t('title'), summary: t('description') });
}
