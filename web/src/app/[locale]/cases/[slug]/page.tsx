import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Callout, mdxComponents, StatGrid } from '@/components/mdx';
import { Container } from '@/components/ui/container';
import { Tag } from '@/components/ui/tag';
import { Link } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { getCase, getCaseSlugs } from '@/lib/cases';
import { caseMdxOptions } from '@/lib/mdx';

export function generateStaticParams() {
  return getCaseSlugs().flatMap((slug) =>
    routing.locales.map((locale) => ({ slug, locale })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const study = getCase(locale as Locale, slug);
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;

  return {
    title: study.title,
    description: study.summary,
    alternates: {
      canonical: `${prefix}/cases/${slug}`,
      languages: {
        en: `/cases/${slug}`,
        pt: `/pt/cases/${slug}`,
        'x-default': `/cases/${slug}`,
      },
    },
  };
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('cases');
  const study = getCase(locale as Locale, slug);

  return (
    <Container className="py-12 sm:py-16">
      <Link
        href="/cases"
        className="inline-flex items-center gap-1 font-mono text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('back')}
      </Link>

      <header className="mt-8">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {study.title}
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {study.summary}
        </p>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div>
            <dt className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{t('role')}</dt>
            <dd className="mt-0.5">{study.role}</dd>
          </div>
          <div>
            <dt className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{t('period')}</dt>
            <dd className="mt-0.5">{study.period}</dd>
          </div>
          {study.links.length > 0 ? (
            <div>
              <dt className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{t('links')}</dt>
              <dd className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1">
                {study.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {link.label} →
                  </a>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {study.stack.map((item) => (
            <Tag key={item}>{item}</Tag>
          ))}
        </div>
      </header>

      {study.isFallback && locale !== routing.defaultLocale ? (
        <Callout tone="warning">{t('fallback')}</Callout>
      ) : null}

      {study.highlights.length > 0 ? <StatGrid stats={study.highlights} /> : null}

      <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:tracking-tight prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-code:font-mono prose-pre:bg-zinc-900">
        <MDXRemote
          source={study.content}
          components={mdxComponents}
          options={caseMdxOptions}
        />
      </div>
    </Container>
  );
}
