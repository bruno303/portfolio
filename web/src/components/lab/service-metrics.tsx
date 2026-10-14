'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { UnavailablePanel } from '@/components/lab/unavailable-panel';
import { fetchServices, type ServicesPayload } from '@/lib/api';
import { formatBytes, formatClockTime, formatCores } from '@/lib/format';

const REFRESH_MS = 30_000;

export function ServiceMetrics() {
  const t = useTranslations('lab');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [payload, setPayload] = useState<ServicesPayload | null>(null);

  const load = useCallback(async () => {
    setPayload(await fetchServices());
  }, []);

  useEffect(() => {
    load();

    const timer = setInterval(load, REFRESH_MS);

    return () => clearInterval(timer);
  }, [load]);

  if (payload === null) {
    return <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">{tCommon('loading')}</p>;
  }

  if (!payload.available || payload.services.length === 0) {
    return <UnavailablePanel title={tCommon('unavailable')} hint={tCommon('unavailableHint')} />;
  }

  const maxCpu = Math.max(...payload.services.map((service) => service.cpuCores), 0.001);
  const maxMemory = Math.max(...payload.services.map((service) => service.memoryBytes), 1);

  return (
    <div className="space-y-3">
      {payload.generatedAt ? (
        <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {tCommon('updated', { time: formatClockTime(payload.generatedAt, locale) })}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {payload.services.map((service) => (
          <article
            key={service.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <h3 className="font-semibold tracking-tight">{service.name}</h3>

            <div className="mt-4 space-y-4">
              <MetricBar
                label={t('cpu')}
                value={service.cpuAvailable ? formatCores(service.cpuCores) : '—'}
                ratio={service.cpuAvailable ? service.cpuCores / maxCpu : 0}
              />
              <MetricBar
                label={t('memory')}
                value={service.memoryAvailable ? formatBytes(service.memoryBytes) : '—'}
                ratio={service.memoryAvailable ? service.memoryBytes / maxMemory : 0}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MetricBar({ label, value, ratio }: { label: string; value: string; ratio: number }) {
  const width = Math.min(Math.max(ratio * 100, 2), 100);

  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
