import { useState } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { PredictionCard } from '@/components/PredictionCard';
import { PredictionListSkeleton } from '@/components/PredictionCardSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Zap, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const LEAGUES = ['All', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'KPL', 'AFCON Qualifier', 'MLS'];

export const PredictionsDashboard = () => {
  const [page, setPage] = useState(1);
  const [league, setLeague] = useState<string | undefined>(undefined);
  const { predictions, isLoading, totalPages, isFetching } = usePredictions(page, league);

  const handleLeague = (l: string) => { setLeague(l === 'All' ? undefined : l); setPage(1); };

  return (
    <div className="space-y-6">
      {/* League filter */}
      <div className="flex gap-2 flex-wrap">
        {LEAGUES.map(l => (
          <Button key={l} size="sm" variant={(league === l || (!league && l === 'All')) ? 'default' : 'outline'}
            onClick={() => handleLeague(l)} className="text-xs h-7">
            {l}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <PredictionListSkeleton count={6} />
      ) : predictions.length === 0 ? (
        <EmptyState icon={Zap} title="No predictions yet" description="Our AI is analysing today's matches. Check back soon or try a different league." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {predictions.map(p => <PredictionCard key={p.id} prediction={p} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1 || isFetching}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages || isFetching}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
