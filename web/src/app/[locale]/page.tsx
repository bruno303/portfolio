import { Activity, ArrowRight, GitBranch, Server } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CaseCard } from '@/components/ui/case-card';
import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getFeaturedCases } from '@/lib/cases';
import { site } from '@/lib/site';

const platformCards = [
  { key: 'gitops', Icon: GitBranch },
  { key: 'live', Icon: Activity },
  { key: 'open', Icon: Server },
] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const studies = getFeaturedCases(locale as Locale);

  const stats = [
    { value: t('stats.years.value'), label: t('stats.years.label') },
    { value: t('stats.languages.value'), label: t('stats.languages.label') },
    { value: t('stats.platform.value'), label: t('stats.platform.label') },
  ];

  return (
    <>
      <section className="border-b border-zinc-200/70 dark:border-zinc-800/70">
        <Container className="py-16 sm:py-24">
          <p className="font-mono text-xs tracking-wide text-emerald-600 uppercase dark:text-emerald-400">
            {t('eyebrow')}
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Bruno Oliveira
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
            {t('lede')}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/cases"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {t('cases.title')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href={site.github}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              GitHub
            </a>
            <a
              href={site.linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              LinkedIn
            </a>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</dt>
                <dd className="mt-1 font-mono text-lg font-semibold tracking-tight sm:text-xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="border-b border-zinc-200/70 dark:border-zinc-800/70">
        <Container className="py-16">
          <SectionHeading
            title={t('cases.title')}
            subtitle={t('cases.subtitle')}
            action={
              <Link
                href="/cases"
                className="inline-flex items-center gap-1 font-mono text-sm text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {t('cases.all')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {studies.map((study) => (
              <CaseCard key={study.slug} study={study} />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-zinc-200/70 dark:border-zinc-800/70">
        <Container className="py-16">
          <SectionHeading title={t('platform.title')} subtitle={t('platform.subtitle')} />

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {platformCards.map(({ key, Icon }) => (
              <article
                key={key}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <Icon className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <h3 className="mt-3 font-semibold tracking-tight">{t(`platform.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {t(`platform.${key}.description`)}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
            <a
              href={site.repo}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {t('platform.repo')} →
            </a>
            <Link
              href="/lab"
              className="text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {t('platform.lab')} →
            </Link>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{t('contact.title')}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {t('contact.description')}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={site.github}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
              >
                {t('contact.github')}
              </a>
              <a
                href={site.linkedin}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
              >
                {t('contact.linkedin')}
              </a>
              <Link
                href="/cv"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
              >
                {t('contact.cv')}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
