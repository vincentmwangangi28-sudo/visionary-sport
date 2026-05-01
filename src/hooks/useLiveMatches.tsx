import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  time: string;
  league: string;
  date: string;
  prediction?: string;
  confidence?: number;
}

interface LiveMatchesResponse {
  success: boolean;
  matches: LiveMatch[];
  source: 'live' | 'demo';
  lastUpdated: string;
  error?: string;
}

const CACHE_KEY = 'live_matches_cache';
const CACHE_TTL = 60_000; // 1 minute

interface CachedData {
  matches: LiveMatch[];
  source: 'live' | 'demo';
  lastUpdated: string;
  cachedAt: number;
}

function getCache(): CachedData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedData = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL) return null;
    return parsed;
  } catch { return null; }
}

function setCache(data: Omit<CachedData, 'cachedAt'>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, cachedAt: Date.now() }));
  } catch {}
}

export const useLiveMatches = () => {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'demo'>('demo');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const mounted = useRef(true);

  const applyData = (m: LiveMatch[], s: 'live' | 'demo', lu: string) => {
    if (!mounted.current) return;
    setMatches(m);
    setSource(s);
    setLastUpdated(lu);
  };

  const fetchLiveMatches = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const { data, error } = await supabase.functions.invoke('fetch-live-matches', {
        body: {},
      });

      clearTimeout(timeout);
      if (error) { console.warn('Live matches unavailable:', error?.message || error); return; }

      const response = data as LiveMatchesResponse;
      if (response.success) {
        applyData(response.matches, response.source, response.lastUpdated);
        setCache({ matches: response.matches, source: response.source, lastUpdated: response.lastUpdated });
      }
    } catch (error: any) {
      console.warn('Live matches unavailable:', error?.message || error);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;

    // Serve cached data instantly
    const cached = getCache();
    if (cached) {
      applyData(cached.matches, cached.source, cached.lastUpdated);
      setLoading(false);
    }

    // Always fetch fresh data (stale-while-revalidate)
    fetchLiveMatches();

    const interval = setInterval(fetchLiveMatches, 60000);
    return () => { mounted.current = false; clearInterval(interval); };
  }, []);

  return { matches, loading, source, lastUpdated, refresh: fetchLiveMatches };
};
