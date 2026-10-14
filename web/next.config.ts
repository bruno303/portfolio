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
  reactStrictMode: true,
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
