import { useFootballData } from '@/hooks/useFootballData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, RefreshCw, Radio, Zap, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LiveMatches = () => {
  const { 
    liveFixtures: matches, 
    isLiveLoading: loading, 
    isLiveFetching, 
    refetchLive: refresh,
    isServiceUnavailable,
    serviceUnavailableMessage,
    hasAuthError,
  } = useFootballData({
    livePollInterval: 15_000,
  });

  const live = matches.filter(m => m.status === 'live' || m.status === 'halftime');

  if (loading) return (
    <section className="py-12 bg-muted/20 border-y border-border/40">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-3 mb-5"><Skeleton className="h-7 w-48"/></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-28 rounded-xl"/>)}
        </div>
      </div>
    </section>
  );

  if (isServiceUnavailable && hasAuthError) {
    return (
      <section className="py-8 bg-amber-500/5 border-y border-amber-500/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Service Temporarily Unavailable</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{serviceUnavailableMessage}</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => refresh()} 
              disabled={isLiveFetching}
              className="text-xs h-8 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLiveFetching ? 'animate-spin' : ''}`} />
              Retry Connection
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!live.length) return null;

  return (
    <section className="py-12 bg-muted/20 border-y border-border/40">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500 animate-pulse"/>
              Live Now ({live.length})
            </h2>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={isLiveFetching}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLiveFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </Button>
            <Link to="/live">
              <Button size="sm" className="text-xs h-8">
                All Scores
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {live.slice(0, 6).map((m) => (
            <Link to="/live" key={m.id}>
              <Card className="border-red-500/30 bg-red-500/5 hover:border-red-500/50 transition-all cursor-pointer h-full shadow-sm">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[11px] font-medium truncate max-w-[180px]">
                      {m.league}
                    </Badge>
                    <span className="text-[11px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                      {m.status === 'halftime' ? 'HT' : `${m.minute ?? 45}'`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between my-2 gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {m.home_logo && (
                        <img
                          src={m.home_logo}
                          alt=""
                          className="w-4 h-4 object-contain flex-shrink-0"
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      )}
                      <span className="font-bold text-sm truncate">{m.home_team}</span>
                    </div>
                    <span className="text-xl font-black px-2 tabular-nums">
                      {m.home_score ?? 0} – {m.away_score ?? 0}
                    </span>
                    <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                      <span className="font-bold text-sm truncate">{m.away_team}</span>
                      {m.away_logo && (
                        <img
                          src={m.away_logo}
                          alt=""
                          className="w-4 h-4 object-contain flex-shrink-0"
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      )}
                    </div>
                  </div>
                  {m.prediction && (
                    <div className="pt-2 mt-1 border-t border-red-500/10 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" /> AI Tip: <b className="text-foreground">{m.prediction}</b>
                      </span>
                      {m.confidence && (
                        <span className="text-primary font-bold">{m.confidence}%</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};


