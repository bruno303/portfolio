import type { Metadata } from 'next';
import Link from 'next/link';

import { ThemeProvider } from '@/components/theme-provider';
import { inter, jetBrainsMono } from '@/lib/fonts';

import en from '../../messages/en.json';
import './globals.css';

// Unmatched URLs render outside the [locale] segment, so there is no locale
// context to translate with: this page is intentionally EN-only. The copy still
// comes from the message catalog to keep strings in one place; the localized
// [locale]/not-found.tsx covers in-segment notFound() calls.
export const metadata: Metadata = {
  title: { absolute: `${en.notFound.title} · Bruno Oliveira` },
  description: en.notFound.description,
};

export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <ThemeProvider>
          <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:px-6">
            <p className="font-mono text-5xl font-semibold text-emerald-600 dark:text-emerald-400">
              404
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{en.notFound.title}</h1>
            <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              {en.notFound.description}
            </p>
            <Link
              href="/"
              className="mt-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              {en.notFound.back}
            </Link>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
