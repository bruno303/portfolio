'use client';

import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

export function Mermaid({ chart, caption }: { chart: string; caption?: string }) {
  const t = useTranslations('common');
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const { svg } = await mermaid.render(id, chart);

        if (!cancelled && container.current) {
          container.current.innerHTML = svg;
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (failed) {
    return (
      <figure className="my-6 overflow-x-auto rounded-lg border border-zinc-200 p-4 font-mono text-xs whitespace-pre dark:border-zinc-800">
        {chart}
      </figure>
    );
  }

  return (
    <figure className="my-6 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div ref={container} className="flex justify-center overflow-x-auto" aria-busy="true">
        <span className="text-sm text-zinc-400">{t('loading')}</span>
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
