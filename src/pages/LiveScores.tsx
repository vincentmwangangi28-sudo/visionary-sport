import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, RefreshCw, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface LiveMatch {
  id: string; home_team: string; away_team: string; home_score?: number;
  away_score?: number; status: string; minute?: number; league: string;
  match_date: string; events?: { type: string; minute: number; team: string; player?: string }[];
}

const statusColor: Record<string, string> = {
  live: 'bg-red-500 animate-pulse',
  halftime: 'bg-amber-500',
  finished: 'bg-green-600',
  upcoming: 'bg-blue-500',
};

export default function LiveScores() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMatches = async () => {
    try {
      const { data } = await supabase.functions.invoke('fetch-live-matches');
      if (data?.matches) { setMatches(data.matches); setLastUpdated(new Date()); }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 30_000);
    return () => clearInterval(interval);
  }, []);

  const liveMatches = matches.filter(m => m.status === 'live' || m.status === 'halftime');
  const todayMatches = matches.filter(m => m.status === 'upcoming' || m.status === 'finished');

  const MatchCard = ({ match }: { match: LiveMatch }) => {
    const expanded = expandedId === match.id;
    return (
      <Card className={`${match.status === 'live' ? 'border-red-500/30 bg-red-500/5' : ''} transition-all`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{match.league}</Badge>
              <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${statusColor[match.status] ?? 'bg-gray-500'}`}>
                {match.status === 'live' ? `${match.minute ?? 0}'` : match.status === 'halftime' ? 'HT' : match.status === 'finished' ? 'FT' : new Date(match.match_date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button onClick={() => setExpandedId(expanded ? null : match.id)} className="text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 text-left">
              <p className={`font-bold text-lg ${match.home_score !== undefined && match.away_score !== undefined && match.home_score > match.away_score ? 'text-primary' : ''}`}>{match.home_team}</p>
            </div>
            <div className="mx-4 text-center">
              {match.home_score !== undefined && match.away_score !== undefined ? (
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black">{match.home_score}</span>
                  <span className="text-muted-foreground font-bold">—</span>
                  <span className="text-3xl font-black">{match.away_score}</span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">vs</span>
              )}
            </div>
            <div className="flex-1 text-right">
              <p className={`font-bold text-lg ${match.home_score !== undefined && match.away_score !== undefined && match.away_score > match.home_score ? 'text-primary' : ''}`}>{match.away_team}</p>
            </div>
          </div>

          {expanded && match.events && match.events.length > 0 && (
            <div className="mt-4 pt-3 border-t space-y-1.5">
              {match.events.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground w-8">{e.minute}'</span>
                  <span>{e.type === 'goal' ? '⚽' : e.type === 'yellow_card' ? '🟨' : e.type === 'red_card' ? '🟥' : e.type === 'substitution' ? '🔄' : '📌'}</span>
                  <span className="font-medium">{e.player ?? e.team}</span>
                  <span className="text-muted-foreground text-xs ml-auto">{e.team}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Live Scores | PredictPro" description="Real-time football scores, match events and live updates. Follow all matches live." />
      <Navbar />
      <main className="container mx-auto px-4 py-24 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Activity className="h-8 w-8 text-red-500" />Live Scores</h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />Auto-refreshes every 30s • Last: {lastUpdated.toLocaleTimeString('en-KE')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMatches} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
        ) : (
          <>
            {liveMatches.length > 0 && (
              <div className="mb-6">
                <h2 className="font-semibold text-sm uppercase tracking-wide text-red-500 flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />Live Now ({liveMatches.length})
                </h2>
                <div className="space-y-3">{liveMatches.map(m => <MatchCard key={m.id} match={m} />)}</div>
              </div>
            )}
            {todayMatches.length > 0 && (
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Today's Matches ({todayMatches.length})</h2>
                <div className="space-y-3">{todayMatches.map(m => <MatchCard key={m.id} match={m} />)}</div>
              </div>
            )}
            {matches.length === 0 && (
              <div className="text-center py-20">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No matches available right now. Check back later.</p>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
