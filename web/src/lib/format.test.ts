import { describe, expect, it } from 'vitest';

import { formatBytes, formatCores, formatMetricValue } from '@/lib/format';

describe('formatCores', () => {
  it('renders values of one core or more with two decimals', () => {
    expect(formatCores(1.5)).toBe('1.50 cores');
    expect(formatCores(1)).toBe('1.00 cores');
  });

  it('renders sub-core values as millicores', () => {
    expect(formatCores(0.12)).toBe('120 m');
    expect(formatCores(0.005)).toBe('5 m');
  });
});

describe('formatBytes', () => {
  it('handles zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('scales to binary units', () => {
    expect(formatBytes(1024)).toBe('1.00 KiB');
    expect(formatBytes(1536)).toBe('1.50 KiB');
    expect(formatBytes(512 * 1024 * 1024)).toBe('512 MiB');
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GiB');
  });
});

describe('formatMetricValue', () => {
  it('formats counts with the locale', () => {
    expect(formatMetricValue({ unit: 'count', value: 1234 }, 'en')).toBe('1,234');
  });

  it('delegates cores and bytes', () => {
    expect(formatMetricValue({ unit: 'cores', value: 0.25 }, 'en')).toBe('250 m');
    expect(formatMetricValue({ unit: 'bytes', value: 1024 }, 'en')).toBe('1.00 KiB');
  });
});
