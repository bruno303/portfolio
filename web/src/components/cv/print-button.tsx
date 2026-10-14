'use client';

import { Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PrintButton() {
  const t = useTranslations('cv');

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:border-zinc-400 print:hidden dark:border-zinc-700 dark:hover:border-zinc-500"
    >
      <Printer className="size-4" aria-hidden />
      {t('print')}
    </button>
  );
}
