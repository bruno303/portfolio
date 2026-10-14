import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'pt'],
  defaultLocale: 'en',
  // English (default) is served at `/`, Portuguese at `/pt/...`.
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
