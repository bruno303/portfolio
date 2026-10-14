import type { MetadataRoute } from 'next';

import { getCaseSlugs } from '@/lib/cases';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/cases', '/lab', '/about', '/cv', ...getCaseSlugs().map((slug) => `/cases/${slug}`)];

  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date();

  for (const path of paths) {
    const en = `${site.url}${path || '/'}`;
    const pt = `${site.url}/pt${path}`;

    const alternates = { languages: { en, pt } };

    entries.push({
      url: en,
      lastModified,
      changeFrequency: 'monthly',
      priority: path === '' ? 1 : 0.7,
      alternates,
    });

    entries.push({
      url: pt,
      lastModified,
      changeFrequency: 'monthly',
      priority: path === '' ? 0.9 : 0.6,
      alternates,
    });
  }

  return entries;
}
