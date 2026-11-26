import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface LiveOverlayMatchRecord {
  id: string;
  home_team: string;
  away_team: string;
  league?: string;
  status: 'live' | 'halftime' | 'finished' | 'upcoming';
  minute?: string | number | null;
  home_score?: number | null;
  away_score?: number | null;
  confidence?: number;
  prediction?: string;
  match_events?: unknown[];
  match_stats?: unknown;
}

async function fetchLiveOverlayMatches(): Promise<LiveOverlayMatchRecord[]> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return [];
  }

  let json: { offline?: boolean; matches?: LiveOverlayMatchRecord[] } | null = null;
  try {
    const r = await fetch('/api/football?type=live', {
      headers: { Accept: 'application/json' },
    });
    if (r.ok && (r.headers.get('content-type') || '').includes('application/json')) {
      json = await r.json();
    }
  } catch {
    // Fall back to direct handler on static hosts
  }

  if (json?.offline || !Array.isArray(json?.matches) || json.matches.length === 0) {
    const { handleFootballRequest } = await import('@/server/footballHandler');
    json = (await handleFootballRequest({ type: 'live' })) as {
      offline?: boolean;
      matches?: LiveOverlayMatchRecord[];
    };
  }

  return Array.isArray(json?.matches) ? json.matches : [];
}

/**
 * Shared React Query hook for live score overlay on the homepage ribbon & dashboard.
 * Coalesces duplicate `/api/football?type=live` calls into a single cached request and
 * yields briefly to critical FCP/LCP hydration work on initial mount.
 */
export function useLiveFixturesOverlay() {
  const [enabled, setEnabled] = useState(() => import.meta.env.MODE === 'test');

  useEffect(() => {
    if (enabled) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === 'function') {
      const idleId = w.requestIdleCallback(() => setEnabled(true), { timeout: 650 });
      return () => w.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(() => setEnabled(true), 450);
    return () => window.clearTimeout(timer);
  }, [enabled]);

  return useQuery({
    queryKey: ['live-fixtures', 'overlay'],
    queryFn: fetchLiveOverlayMatches,
    enabled,
    staleTime: 45_000,
    gcTime: 180_000,
    refetchOnWindowFocus: false,
    retry: 0,
  });
}
