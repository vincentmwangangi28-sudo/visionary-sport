import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PredictionCard } from '@/components/PredictionCard';
import { PredictionListSkeleton } from '@/components/PredictionCardSkeleton';
import { Button } from '@/components/ui/button';
import { Zap, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { Prediction } from '@/types/prediction';

const LEAGUES = ['All', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'KPL', 'AFCON Qualifier', 'MLS'];
const PAGE_SIZE = 9;

async function fetchPredictions(page: number, league?: string) {
  const today = new Date().toISOString().split('T')[0];
  let q = supabase.from('predictions')
    .select('*', { count: 'exact' })
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (league) q = q.eq('league', league);
  const { data, error, count } = await q;
  if (error) throw error;
  return { predictions: (data || []) as Prediction[], total: count || 0 };
}

export const PredictionsDashboard = () => {
  const [page, setPage] = useState(1);
  const [league, setLeague] = useState<string | undefined>(undefined);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['predictions', page, league],
    queryFn: () => fetchPredictions(page, league),
    staleTime: 60_000,
    retry: 2,
  });

  const predictions = data?.predictions || [];
  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handleLeague = (l: string) => {
    setLeague(l === 'All' ? undefined : l);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* League filter */}
      <div className="flex gap-2 flex-wrap">
        {LEAGUES.map(l => (
          <Button key={l} size="sm"
            variant={(league === l || (!league && l === 'All')) ? 'default' : 'outline'}
            onClick={() => handleLeague(l)}
            className="text-xs h-7">
            {l}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching} className="h-7 ml-auto">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}/>
        </Button>
      </div>

      {isLoading ? (
        <PredictionListSkeleton count={6}/>
      ) : predictions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Zap className="h-10 w-10 mx-auto text-muted-foreground mb-3"/>
          <p className="font-semibold text-muted-foreground">No predictions yet for {league || 'today'}</p>
          <p className="text-sm text-muted-foreground mt-1">Our AI generates new picks daily at 6AM EAT.</p>
          {league && (
            <Button variant="outline" className="mt-3" onClick={() => handleLeague('All')}>
              Show All Leagues
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {predictions.map(p => <PredictionCard key={p.id} prediction={p}/>)}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1 || isFetching}>
                <ChevronLeft className="h-4 w-4"/>
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages || isFetching}>
                <ChevronRight className="h-4 w-4"/>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
