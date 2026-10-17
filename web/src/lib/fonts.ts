import { Inter, JetBrains_Mono } from 'next/font/google';

// Shared font instances: importing the same module from multiple routes keeps
// one generated font/CSS pair instead of duplicating next/font instances.
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});
