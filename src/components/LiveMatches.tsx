import { useLiveMatches } from '@/hooks/useLiveMatches';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, RefreshCw, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LiveMatches = () => {
  const { matches, loading, source, refresh } = useLiveMatches();
  const live = matches.filter((m: {status:string}) => m.status === 'live' || m.status === 'halftime');
  if (loading) return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-3 mb-5"><Skeleton className="h-7 w-48"/></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-28 rounded-xl"/>)}</div>
      </div>
    </section>
  );
  if (!live.length) return null;
  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"/>
            <Activity className="h-6 w-6 text-red-500"/>Live Now
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="h-4 w-4"/></Button>
            <Link to="/live"><Button size="sm">All Scores</Button></Link>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {live.slice(0,6).map((m:{id:string;home_team:string;away_team:string;home_score?:number;away_score?:number;minute?:number;league:string}) => (
            <Card key={m.id} className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">{m.league}</Badge>
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium animate-pulse">{m.minute ?? 0}'</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm flex-1">{m.home_team}</span>
                  <span className="text-2xl font-black px-3">{m.home_score ?? 0} – {m.away_score ?? 0}</span>
                  <span className="font-bold text-sm flex-1 text-right">{m.away_team}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
