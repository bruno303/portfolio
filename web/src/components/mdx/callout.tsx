import type { ReactNode } from 'react';

export function Callout({
  title,
  children,
  tone = 'info',
}: {
  title?: string;
  children: ReactNode;
  tone?: 'info' | 'warning';
}) {
  const border =
    tone === 'warning'
      ? 'border-amber-500/50 bg-amber-500/5'
      : 'border-emerald-500/40 bg-emerald-500/5';

  return (
    <aside className={`my-6 rounded-lg border-l-4 px-4 py-3 text-sm ${border}`}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
    </aside>
  );
}
