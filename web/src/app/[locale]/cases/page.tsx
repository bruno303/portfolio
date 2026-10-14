import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CaseCard } from '@/components/ui/case-card';
import { Container } from '@/components/ui/container';
import type { Locale } from '@/i18n/routing';
import { getCases } from '@/lib/cases';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cases' });

  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: locale === 'en' ? '/cases' : '/pt/cases',
      languages: {
        en: '/cases',
        pt: '/pt/cases',
        'x-default': '/cases',
      },
    },
  };
}

export default async function CasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('cases');
  const studies = getCases(locale as Locale);

  return (
    <Container className="py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          {t('subtitle')}
        </p>
      </header>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {studies.map((study) => (
          <CaseCard key={study.slug} study={study} />
        ))}
      </div>
    </Container>
  );
}
