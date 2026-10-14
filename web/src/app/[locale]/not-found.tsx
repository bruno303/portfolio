import { getTranslations } from 'next-intl/server';

import { Container } from '@/components/ui/container';
import { Link } from '@/i18n/navigation';

export default async function NotFoundPage() {
  const t = await getTranslations('notFound');

  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="font-mono text-5xl font-semibold text-emerald-600 dark:text-emerald-400">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">{t('description')}</p>
      <Link
        href="/"
        className="mt-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
      >
        {t('back')}
      </Link>
    </Container>
  );
}
