export type ServiceMetric = {
  id: string;
  name: string;
  cpuCores: number;
  cpuAvailable: boolean;
  memoryBytes: number;
  memoryAvailable: boolean;
};

export type CustomMetricEntry = {
  id: string;
  label: string;
  unit: 'cores' | 'bytes' | 'count';
  value: number;
  available: boolean;
};

export type ServicesPayload = {
  available: boolean;
  generatedAt: string | null;
  services: ServiceMetric[];
};

export type MetricsPayload = {
  available: boolean;
  generatedAt: string | null;
  metrics: CustomMetricEntry[];
};

const EMPTY_SERVICES: ServicesPayload = {
  available: false,
  generatedAt: null,
  services: [],
};

const EMPTY_METRICS: MetricsPayload = {
  available: false,
  generatedAt: null,
  metrics: [],
};

async function fetchPayload<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path, { cache: 'no-store' });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export function fetchServices(): Promise<ServicesPayload> {
  return fetchPayload('/api/live/services', EMPTY_SERVICES);
}

export function fetchMetrics(): Promise<MetricsPayload> {
  return fetchPayload('/api/live/metrics', EMPTY_METRICS);
}
