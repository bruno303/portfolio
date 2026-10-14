import { getTranslations } from 'next-intl/server';

import { site } from '@/lib/site';

export async function Footer() {
  const t = await getTranslations('footer');

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200/70 print:hidden dark:border-zinc-800/70">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-zinc-400">
        <p className="font-mono text-xs">
          © {year} Bruno Oliveira · {t('built')}
        </p>

        <div className="flex items-center gap-4 font-mono text-xs">
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            GitHub
          </a>
          <a
            href={site.linkedin}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            LinkedIn
          </a>
          <a
            href={site.repo}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {t('source')}
          </a>
        </div>
      </div>
    </footer>
  );
}
