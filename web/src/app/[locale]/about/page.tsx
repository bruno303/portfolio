import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Container } from '@/components/ui/container';
import { SectionHeading } from '@/components/ui/section-heading';
import { Tag } from '@/components/ui/tag';
import type { Locale } from '@/i18n/routing';
import { education, languages, skillGroups, timeline } from '@/content/profile';
import { site } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: locale === 'en' ? '/about' : '/pt/about',
      languages: {
        en: '/about',
        pt: '/pt/about',
        'x-default': '/about',
      },
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('about');
  const activeLocale = locale as Locale;

  return (
    <Container className="py-12 sm:py-16">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          {t('subtitle')}
        </p>
      </header>

      <section className="mt-14">
        <SectionHeading title={t('timelineTitle')} />

        <ol className="mt-8 space-y-10 border-l border-zinc-200 dark:border-zinc-800">
          {timeline.map((entry) => (
            <li key={entry.company} className="relative pl-6">
              <span
                className="absolute top-1.5 -left-[4.5px] size-2 rounded-full bg-emerald-500"
                aria-hidden
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-semibold tracking-tight">
                  {entry.role[activeLocale]} · {entry.company}
                </h3>
                <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {entry.period[activeLocale]} · {entry.location[activeLocale]}
                </p>
              </div>

              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {entry.summary[activeLocale].map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">–</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {entry.stack.map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 grid gap-10 sm:grid-cols-2">
        <div>
          <SectionHeading title={t('educationTitle')} />
          <ul className="mt-6 space-y-4">
            {education.map((entry) => (
              <li key={entry.school}>
                <p className="text-sm font-medium">{entry.school}</p>
                <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {entry.detail[activeLocale]}
                </p>
                <p className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {entry.period}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <SectionHeading title={t('languagesTitle')} />
            <ul className="mt-6 space-y-2 text-sm">
              {languages.map((language) => (
                <li key={language.name.en} className="flex items-baseline gap-2">
                  <span className="font-medium">{language.name[activeLocale]}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {language.level[activeLocale]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <SectionHeading title={t('skillsTitle')} />
          <div className="mt-6 space-y-5">
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
        </div>
      </section>

      <section className="mt-14">
        <SectionHeading title={t('elsewhere')} />
        <ul className="mt-6 grid gap-3 font-mono text-sm sm:grid-cols-2">
          {[
            { label: 'GitHub', url: site.github },
            { label: 'LinkedIn', url: site.linkedin },
            { label: 'planning-poker', url: site.planningPoker.repo },
            { label: 'study-topics (homelab)', url: site.homelab },
            { label: 'go-toolkit', url: site.goToolkit },
            { label: 'ai-orchestrator', url: site.aiOrchestrator },
          ].map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {link.label}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
