import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
  time: string;
  prediction?: string;
  confidence?: number;
}

export const useUpcomingMatches = () => {
  const [matches, setMatches] = useState<UpcomingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'cache' | 'live' | 'demo'>('cache');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // First, try to load from cache (instant)
  const fetchFromCache = async (): Promise<boolean> => {
    try {
      console.log('⚡ Loading from cache...');
      const { data, error } = await supabase
        .from('upcoming_matches_cache')
        .select('*')
        .gte('match_date', new Date().toISOString())
        .order('match_date', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Cache error:', error);
        return false;
      }

      if (data && data.length > 0) {
        const cachedMatches: UpcomingMatch[] = data.map((m: any) => ({
          id: m.match_id,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          league: m.league,
          date: m.match_date.split('T')[0],
          time: m.match_time,
          prediction: m.prediction,
          confidence: m.confidence,
        }));
        
        setMatches(cachedMatches);
        setSource('cache');
        setLastUpdated(data[0]?.updated_at || new Date().toISOString());
        console.log(`✅ Loaded ${cachedMatches.length} matches from cache`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cache fetch error:', error);
      return false;
    }
  };

  // Fallback to API if cache is empty
  const fetchFromAPI = async () => {
    try {
      console.log('🔄 Fetching from API...');
      const { data, error } = await supabase.functions.invoke('fetch-upcoming-matches');

      if (error) {
        console.error('API error:', error);
        return;
      }

      if (data?.success) {
        setMatches(data.matches);
        setSource(data.source === 'live' ? 'live' : 'demo');
        setLastUpdated(data.lastUpdated);
        console.log(`✅ Loaded ${data.matches.length} matches from API`);
      }
    } catch (error) {
      console.error('API fetch error:', error);
    }
  };

  const fetchUpcomingMatches = async () => {
    setLoading(true);
    
    // Try cache first for instant loading
    const hasCache = await fetchFromCache();
    setLoading(false);
    
    // If no cache, fallback to API
    if (!hasCache) {
      await fetchFromAPI();
    }
  };

  const refresh = async () => {
    setLoading(true);
    await fetchFromAPI();
    setLoading(false);
  };

  useEffect(() => {
    fetchUpcomingMatches();
  }, []);

  return { matches, loading, source, lastUpdated, refresh };
};
