import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8080';

const UNAVAILABLE = { available: false, generatedAt: null, metrics: [] };

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/metrics`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json(UNAVAILABLE);
    }

    const data = (await response.json()) as Record<string, unknown>;

    return NextResponse.json({ available: true, ...data });
  } catch {
    return NextResponse.json(UNAVAILABLE);
  }
}
