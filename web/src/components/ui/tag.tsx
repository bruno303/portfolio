export function Tag({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 px-2.5 py-0.5 font-mono text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
      {children}
    </span>
  );
}
