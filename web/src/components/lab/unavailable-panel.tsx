export function UnavailablePanel({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
      <p className="font-mono text-sm">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{hint}</p>
    </div>
  );
}
