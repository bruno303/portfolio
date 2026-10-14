'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { UnavailablePanel } from '@/components/lab/unavailable-panel';
import { fetchMetrics, type MetricsPayload } from '@/lib/api';
import { formatClockTime, formatMetricValue } from '@/lib/format';

const REFRESH_MS = 30_000;

export function CustomMetrics() {
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [payload, setPayload] = useState<MetricsPayload | null>(null);

  const load = useCallback(async () => {
    setPayload(await fetchMetrics());
  }, []);

  useEffect(() => {
    load();

    const timer = setInterval(load, REFRESH_MS);

    return () => clearInterval(timer);
  }, [load]);

  if (payload === null) {
    return <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">{tCommon('loading')}</p>;
  }

  if (!payload.available || payload.metrics.length === 0) {
    return <UnavailablePanel title={tCommon('unavailable')} hint={tCommon('unavailableHint')} />;
  }

  return (
    <div className="space-y-3">
      {payload.generatedAt ? (
        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {tCommon('updated', { time: formatClockTime(payload.generatedAt, locale) })}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {payload.metrics.map((metric) => (
          <article
            key={metric.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{metric.label}</p>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
              {metric.available ? formatMetricValue(metric, locale) : '—'}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
