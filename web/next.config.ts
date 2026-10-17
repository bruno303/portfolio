import type { NextConfig } from 'next';
import path from 'node:path';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Pin the tracing root to this package. Without it, a lockfile in a parent
// directory (for example ~/dev/projects/package-lock.json) makes Next.js infer
// a different workspace root and nest the standalone output.
const root = process.cwd();

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(root),
  turbopack: {
    root: path.resolve(root),
  },
  experimental: {
    // Unmatched URLs render app/global-not-found.tsx (with its own <html>/
    // <body>) instead of Next's built-in 404, so those responses carry a
    // single intentional <title> instead of the built-in plus root layout
    // titles. In-segment notFound() calls still use [locale]/not-found.tsx.
    globalNotFound: true,
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
