export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-700 dark:text-emerald-400">
      <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden />
      live
    </span>
  );
}
