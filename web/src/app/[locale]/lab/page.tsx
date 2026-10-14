import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CustomMetrics } from '@/components/lab/custom-metrics';
import { ServiceMetrics } from '@/components/lab/service-metrics';
import { Container } from '@/components/ui/container';
import { LiveBadge } from '@/components/ui/live-badge';
import { SectionHeading } from '@/components/ui/section-heading';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'lab' });

  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: locale === 'en' ? '/lab' : '/pt/lab',
      languages: {
        en: '/lab',
        pt: '/pt/lab',
        'x-default': '/lab',
      },
    },
  };
}

export default async function LabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('lab');

  return (
    <Container className="py-12 sm:py-16">
      <header className="max-w-2xl">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
          <LiveBadge />
        </div>

        <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          {t('subtitle')}
        </p>
        <p className="mt-3 font-mono text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {t('scope')}
        </p>
      </header>

      <section className="mt-12 space-y-5">
        <SectionHeading title={t('servicesTitle')} subtitle={t('servicesSubtitle')} />
        <ServiceMetrics />
      </section>

      <section className="mt-14 space-y-5">
        <SectionHeading title={t('metricsTitle')} subtitle={t('metricsSubtitle')} />
        <CustomMetrics />
      </section>
    </Container>
  );
}
