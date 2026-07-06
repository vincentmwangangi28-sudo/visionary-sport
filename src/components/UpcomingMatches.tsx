import { useUpcomingMatches } from '@/hooks/useUpcomingMatches';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UpcomingMatches = () => {
  const { matches, loading } = useUpcomingMatches();
  if (loading) return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <Skeleton className="h-7 w-52 mb-5"/>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-32 rounded-xl"/>)}</div>
      </div>
    </section>
  );
  if (!matches.length) return null;
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6 text-primary"/>Upcoming with AI Tips</h2>
          <Link to="/best-bets"><Button size="sm" className="gap-1.5"><Zap className="h-4 w-4"/>Best Bets</Button></Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matches.slice(0,6).map((m) => (
            <Link to="/best-bets" key={m.id}>
              <Card className="hover:border-primary/30 transition-all h-full cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">{m.league}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.match_date).toLocaleDateString('en-KE',{weekday:'short',day:'numeric',month:'short'})}
                    </span>
                  </div>
                  <p className="font-bold text-sm mb-2">{m.home_team} <span className="text-muted-foreground font-normal">vs</span> {m.away_team}</p>
                  {m.ai_prediction && (
                    <div className="flex items-center justify-between">
                      <Badge className={`text-xs ${m.ai_prediction==='Home Win'?'bg-green-500':m.ai_prediction==='Away Win'?'bg-red-500':'bg-amber-500'} text-white`}>
                        {m.ai_prediction}
                      </Badge>
                      {m.confidence && <span className="text-xs font-bold text-primary">{m.confidence}%</span>}
                    </div>
                  )}
                  {m.home_odds && (
                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                      <span>1: <b className="text-foreground">{m.home_odds.toFixed(2)}</b></span>
                      {m.draw_odds && <span>X: <b className="text-foreground">{m.draw_odds.toFixed(2)}</b></span>}
                      <span>2: <b className="text-foreground">{m.away_odds?.toFixed(2)}</b></span>
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
