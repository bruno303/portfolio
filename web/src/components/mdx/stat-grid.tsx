type Stat = { value: string; label: string };

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <dt className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</dt>
          <dd className="mt-1 font-mono text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
