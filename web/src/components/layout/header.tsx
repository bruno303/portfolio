import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

import { LocaleSwitcher } from './locale-switcher';
import { ThemeToggle } from './theme-toggle';

export async function Header() {
  const t = await getTranslations('nav');

  const items = [
    { href: '/cases', label: t('cases') },
    { href: '/lab', label: t('lab') },
    { href: '/about', label: t('about') },
    { href: '/cv', label: t('cv') },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-zinc-50/80 backdrop-blur print:hidden dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="font-mono text-sm font-semibold tracking-tight whitespace-nowrap">
          <span className="text-emerald-600 dark:text-emerald-400">~</span>/bruno303
        </Link>

        <nav className="flex items-center gap-3 overflow-x-auto text-sm sm:gap-6">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
