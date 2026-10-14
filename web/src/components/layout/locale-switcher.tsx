'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export function LocaleSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div
      className="flex items-center gap-2 font-mono text-xs"
      role="group"
      aria-label={t('changeLanguage')}
    >
      {routing.locales.map((candidate) => (
        <Link
          key={candidate}
          href={pathname}
          locale={candidate}
          aria-current={candidate === locale ? 'true' : undefined}
          className={
            candidate === locale
              ? 'font-semibold text-emerald-600 dark:text-emerald-400'
              : 'text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }
        >
          {candidate.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
