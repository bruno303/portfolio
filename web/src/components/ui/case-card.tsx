import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import type { CaseMeta } from '@/lib/cases';

import { Tag } from './tag';

export function CaseCard({ study }: { study: CaseMeta }) {
  return (
    <Link
      href={`/cases/${study.slug}`}
      className="group flex h-full flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-emerald-500/60 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-400/60"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight">{study.title}</h3>
        <ArrowUpRight
          className="mt-0.5 size-4 shrink-0 text-zinc-400 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
          aria-hidden
        />
      </div>

      <p className="flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {study.summary}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {study.stack.slice(0, 4).map((item) => (
          <Tag key={item}>{item}</Tag>
        ))}
      </div>
    </Link>
  );
}
