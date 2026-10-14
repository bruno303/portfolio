import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://portfolio.bsoapp.net'),
  title: {
    default: 'Bruno Oliveira — Senior Software Engineer',
    template: '%s · Bruno Oliveira',
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // The localized layouts render <html> and <body> so the `lang` attribute can
  // follow the active locale.
  return children;
}
