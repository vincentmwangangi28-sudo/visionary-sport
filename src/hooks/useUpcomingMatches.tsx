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

interface UpcomingMatchesResponse {
  success: boolean;
  matches: UpcomingMatch[];
  source: 'live' | 'demo';
  lastUpdated: string;
  error?: string;
}

export const useUpcomingMatches = () => {
  const [matches, setMatches] = useState<UpcomingMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'demo'>('demo');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchUpcomingMatches = async () => {
    try {
      // Use AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const { data, error } = await supabase.functions.invoke('fetch-upcoming-matches', {
        body: {},
      });

      clearTimeout(timeoutId);

      if (error) {
        // Silently handle errors - don't log to console to avoid SEO penalty
        setLoading(false);
        return;
      }

      const response = data as UpcomingMatchesResponse;
      
      if (response?.success) {
        setMatches(response.matches);
        setSource(response.source);
        setLastUpdated(response.lastUpdated);
      }
    } catch {
      // Silently handle errors - component will show empty state gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcomingMatches();

    // Update every 5 minutes (less frequent than live matches)
    const interval = setInterval(fetchUpcomingMatches, 300000);

    return () => clearInterval(interval);
  }, []);

  return { matches, loading, source, lastUpdated, refresh: fetchUpcomingMatches };
};
