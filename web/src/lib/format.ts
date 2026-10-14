export function formatCores(value: number): string {
  if (value >= 1) {
    return `${value.toFixed(2)} cores`;
  }

  return `${Math.round(value * 1000)} m`;
}

export function formatBytes(value: number): string {
  if (value <= 0) {
    return '0 B';
  }

  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const scaled = value / 1024 ** exponent;
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;

  return `${scaled.toFixed(digits)} ${units[exponent]}`;
}

export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatMetricValue(
  entry: { unit: 'cores' | 'bytes' | 'count'; value: number },
  locale: string,
): string {
  switch (entry.unit) {
    case 'cores':
      return formatCores(entry.value);
    case 'bytes':
      return formatBytes(entry.value);
    default:
      return formatCount(entry.value, locale);
  }
}

export function formatClockTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso));
}
