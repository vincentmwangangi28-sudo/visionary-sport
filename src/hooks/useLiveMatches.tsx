import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface LiveMatch {
  id: string; homeTeam: string; awayTeam: string;
  homeScore: number | null; awayScore: number | null;
  status: string; time: string; league: string; date: string;
  prediction?: string; confidence?: number;
}
interface LiveMatchesResponse {
  success: boolean; matches: LiveMatch[];
  source: 'live' | 'demo'; lastUpdated: string; error?: string;
}
const fetchLiveMatches = async (): Promise<LiveMatchesResponse> => {
  const { data, error } = await supabase.functions.invoke('fetch-live-matches');
  if (error) throw error;
  return data as LiveMatchesResponse;
};
export const useLiveMatches = () => {
  const { data, isLoading, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: queryKeys.liveMatches.all,
    queryFn: fetchLiveMatches,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  return {
    matches: data?.matches ?? [],
    loading: isLoading,
    source: data?.source ?? 'demo',
    lastUpdated: data?.lastUpdated ?? '',
    error: error ? String(error) : null,
    refresh: refetch,
    dataUpdatedAt,
  };
};
