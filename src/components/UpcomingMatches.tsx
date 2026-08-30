import { useUpcomingMatches } from '@/hooks/useUpcomingMatches';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Zap, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TeamLogo } from '@/components/TeamLogo';
import { NotifyMeButton } from '@/components/NotifyMeButton';

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
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary"/>Upcoming with AI Tips
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Subscribe to instant push notifications for kickoff reminders & final results.
            </p>
          </div>
          <Link to="/best-bets"><Button size="sm" className="gap-1.5"><Zap className="h-4 w-4"/>Best Bets</Button></Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matches.slice(0,6).map((m) => (
            <Card key={m.id} className="hover:border-primary/40 transition-all h-full relative group">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <Badge variant="outline" className="text-xs font-bold">{m.league}</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(m.match_date).toLocaleDateString('en-KE',{weekday:'short',day:'numeric',month:'short'})}
                      </span>
                      <NotifyMeButton
                        match={{
                          id: m.id,
                          home_team: m.home_team,
                          away_team: m.away_team,
                          league: m.league,
                          match_date: m.match_date,
                          prediction: m.ai_prediction,
                          confidence: m.confidence,
                          home_odds: m.home_odds,
                          draw_odds: m.draw_odds,
                          away_odds: m.away_odds,
                        }}
                        variant="icon"
                      />
                    </div>
                  </div>

                  <Link to="/best-bets" className="block hover:opacity-90 transition-opacity">
                    <div className="flex items-center justify-between gap-2 my-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <TeamLogo team={m.home_team} size="xs" />
                        <span className="font-bold text-sm truncate">{m.home_team}</span>
                      </div>
                      <span className="text-muted-foreground text-xs font-semibold px-1">vs</span>
                      <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                        <span className="font-bold text-sm truncate">{m.away_team}</span>
                        <TeamLogo team={m.away_team} size="xs" />
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="pt-2 mt-2 border-t border-border/40">
                  {m.ai_prediction && (
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`text-xs ${m.ai_prediction==='Home Win'?'bg-green-500':m.ai_prediction==='Away Win'?'bg-red-500':'bg-amber-500'} text-white`}>
                        {m.ai_prediction}
                      </Badge>
                      {m.confidence && <span className="text-xs font-black text-primary">{m.confidence}% Edge</span>}
                    </div>
                  )}
                  {m.home_odds && (
                    <div className="flex justify-between gap-1 text-xs text-muted-foreground bg-muted/30 p-1.5 rounded-lg text-center">
                      <span>1: <b className="text-foreground font-mono">{m.home_odds.toFixed(2)}</b></span>
                      {m.draw_odds && <span>X: <b className="text-foreground font-mono">{m.draw_odds.toFixed(2)}</b></span>}
                      <span>2: <b className="text-foreground font-mono">{m.away_odds?.toFixed(2)}</b></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
