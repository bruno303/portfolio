import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PrintButton } from '@/components/cv/print-button';
import { Container } from '@/components/ui/container';
import { Tag } from '@/components/ui/tag';
import { education, languages, skillGroups, timeline } from '@/content/profile';
import type { Locale } from '@/i18n/routing';
import { site } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cv' });

  return {
    title: t('summaryTitle'),
    description: t('description'),
    alternates: {
      canonical: locale === 'en' ? '/cv' : '/pt/cv',
      languages: {
        en: '/cv',
        pt: '/pt/cv',
        'x-default': '/cv',
      },
    },
  };
}

export default async function CvPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('cv');
  const activeLocale = locale as Locale;

  return (
    <Container className="py-12 sm:py-16 print:max-w-none print:px-0 print:py-0">
      <header className="flex flex-col gap-6 border-b border-zinc-200 pb-8 sm:flex-row sm:items-start sm:justify-between dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Bruno Oliveira</h1>
          <p className="mt-2 font-mono text-sm text-emerald-600 dark:text-emerald-400">
            Senior Software Engineer · Backend &amp; Platform
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Bauru, São Paulo, Brazil
          </p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
            <a href={`mailto:${site.email}`} className="hover:underline">
              {site.email}
            </a>
            <a href={site.github} target="_blank" rel="noreferrer" className="hover:underline">
              github.com/bruno303
            </a>
            <a href={site.linkedin} target="_blank" rel="noreferrer" className="hover:underline">
              linkedin.com/in/bruno-oliveira-516a05113
            </a>
            <span>{site.url.replace('https://', '')}</span>
          </p>
        </div>

        <PrintButton />
      </header>

      <section className="mt-10">
        <h2 className="font-mono text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {t('summaryTitle')}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed">{t('summaryText')}</p>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          {t('experienceTitle')}
        </h2>

        <ol className="mt-5 space-y-7">
          {timeline.map((entry) => (
            <li key={entry.company}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-sm font-semibold tracking-tight">
                  {entry.role[activeLocale]} — {entry.company}
                </h3>
                <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {entry.period[activeLocale]} · {entry.location[activeLocale]}
                </p>
              </div>

              <ul className="mt-2 space-y-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {entry.summary[activeLocale].map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">–</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-10 grid gap-10 sm:grid-cols-2">
        <section>
          <h2 className="font-mono text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {t('educationTitle')}
          </h2>
          <ul className="mt-4 space-y-3">
            {education.map((entry) => (
              <li key={entry.school}>
                <p className="text-sm font-medium">{entry.school}</p>
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {entry.detail[activeLocale]} · {entry.period}
                </p>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-mono text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {t('languagesTitle')}
          </h2>
          <ul className="mt-4 space-y-1.5 text-sm">
            {languages.map((language) => (
              <li key={language.name.en}>
                <span className="font-medium">{language.name[activeLocale]}</span>{' '}
                <span className="text-zinc-600 dark:text-zinc-400">
                  — {language.level[activeLocale]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-mono text-xs tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            {t('skillsTitle')}
          </h2>
          <div className="mt-4 space-y-4">
            {skillGroups.map((group) => (
              <div key={group.label.en}>
                <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {group.label[activeLocale]}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-12 font-mono text-xs text-zinc-400 print:hidden dark:text-zinc-500">
        {activeLocale === 'en' ? 'English' : 'Português'} · {site.url}
      </p>
    </Container>
  );
}
