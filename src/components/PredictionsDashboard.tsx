import { useState } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { PredictionCard } from '@/components/PredictionCard';
import { PredictionListSkeleton } from '@/components/PredictionCardSkeleton';
import { Button } from '@/components/ui/button';
import { Zap, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { AdBannerFluid } from '@/components/AdBanner';

const LEAGUES = ['All','Premier League','La Liga','Champions League','Serie A','Bundesliga','Ligue 1','KPL','AFCON Qualifier','MLS'];

export const PredictionsDashboard = () => {
  const [page, setPage] = useState(1);
  const [league, setLeague] = useState<string|undefined>(undefined);
  const { predictions, isLoading, totalPages, isFetching, refetch } = usePredictions(page, league);

  if (isLoading) return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap mb-4">
        {LEAGUES.slice(0,5).map(l => <div key={l} className="h-7 w-24 bg-muted rounded animate-pulse"/>)}
      </div>
      <PredictionListSkeleton count={6}/>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* League filter */}
      <div className="flex gap-2 flex-wrap">
        {LEAGUES.map(l => (
          <Button key={l} size="sm" variant={(league===l||(l==='All'&&!league))?'default':'outline'}
            onClick={() => { setLeague(l==='All'?undefined:l); setPage(1); }}
            className="text-xs h-7">{l}</Button>
        ))}
        <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isFetching} className="ml-auto">
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching?'animate-spin':''}`}/>
        </Button>
      </div>

      {predictions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground"/>
          <p className="font-semibold">No predictions yet for {league ?? 'upcoming matches'}</p>
          <p className="text-sm text-muted-foreground">Try a different league or check back after 6AM EAT.</p>
          <Button onClick={() => { setLeague(undefined); setPage(1); }} variant="outline" size="sm">Show All Leagues</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {predictions.map((p, i) => (
              <>
                <PredictionCard key={p.id} prediction={p}/>
                {i === 5 && <div key="ad" className="sm:col-span-2 lg:col-span-3"><AdBannerFluid/></div>}
              </>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p=>p-1)} disabled={page<=1||isFetching}>
                <ChevronLeft className="h-4 w-4"/>
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p=>p+1)} disabled={page>=totalPages||isFetching}>
                <ChevronRight className="h-4 w-4"/>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
