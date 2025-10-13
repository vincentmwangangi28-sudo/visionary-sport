import { useState, useEffect } from 'react';
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
}

interface LiveMatchesResponse {
  success: boolean;
  matches: LiveMatch[];
  source: 'live' | 'demo';
  lastUpdated: string;
  error?: string;
}

export const useLiveMatches = () => {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'demo'>('demo');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchLiveMatches = async () => {
    try {
      console.log('🔄 Fetching live matches...');
      
      const { data, error } = await supabase.functions.invoke('fetch-live-matches');

      if (error) {
        console.error('Error fetching live matches:', error);
        return;
      }

      const response = data as LiveMatchesResponse;
      
      if (response.success) {
        setMatches(response.matches);
        setSource(response.source);
        setLastUpdated(response.lastUpdated);
        console.log(`✅ Loaded ${response.matches.length} matches from ${response.source}`);
      }
    } catch (error) {
      console.error('Error fetching live matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMatches();

    // Update every 60 seconds
    const interval = setInterval(fetchLiveMatches, 60000);

    return () => clearInterval(interval);
  }, []);

  return { matches, loading, source, lastUpdated, refresh: fetchLiveMatches };
};
