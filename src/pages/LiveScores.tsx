import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Activity, RefreshCw, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface Match {
  id: string; home_team: string; away_team: string;
  home_score?: number; away_score?: number;
  status: string; minute?: number; league: string; match_date: string;
  ai_prediction?: string; confidence?: number;
}

export default function LiveScores() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchMatches = async () => {
    try {
      const { data } = await supabase.functions.invoke('fetch-live-matches');
      if (data?.matches?.length > 0) {
        setMatches(data.matches);
        setLastUpdated(new Date());
      }
    } catch (e) {
      console.error('fetch-live-matches error', e);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMatches();
    const iv = setInterval(fetchMatches, 30_000);
    return () => clearInterval(iv);
  }, []);

  const live = matches.filter(m => m.status === 'live' || m.status === 'halftime');
  const upcoming = matches.filter(m => m.status === 'upcoming');
  const finished = matches.filter(m => m.status === 'finished');

  const statusBadge = (m: Match) => {
    if (m.status === 'live') return <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium animate-pulse">{m.minute ?? 0}'</span>;
    if (m.status === 'halftime') return <span className="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-medium">HT</span>;
    if (m.status === 'finished') return <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">FT</span>;
    return <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full font-medium">{new Date(m.match_date).toLocaleTimeString('en-KE',{hour:'2-digit',minute:'2-digit'})}</span>;
  };

  const MatchCard = ({ m }: { m: Match }) => (
    <Card className={`${m.status==='live'?'border-red-500/30 bg-red-500/5':''} transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{m.league}</Badge>
            {statusBadge(m)}
          </div>
          <button onClick={() => setExpandedId(expandedId===m.id?null:m.id)}>
            {expandedId===m.id?<ChevronUp className="h-4 w-4 text-muted-foreground"/>:<ChevronDown className="h-4 w-4 text-muted-foreground"/>}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`font-bold flex-1 ${m.home_score!=null&&m.away_score!=null&&m.home_score>m.away_score?'text-primary':''}`}>{m.home_team}</p>
          <div className="text-center px-3">
            {m.home_score!=null&&m.away_score!=null
              ? <span className="text-2xl font-black">{m.home_score} – {m.away_score}</span>
              : <span className="text-muted-foreground font-semibold">vs</span>}
          </div>
          <p className={`font-bold flex-1 text-right ${m.home_score!=null&&m.away_score!=null&&m.away_score>m.home_score?'text-primary':''}`}>{m.away_team}</p>
        </div>
        {expandedId===m.id && m.ai_prediction && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary flex-shrink-0"/>
            <span className="text-muted-foreground">AI Prediction:</span>
            <Badge className="bg-primary/10 text-primary border-primary/20">{m.ai_prediction}</Badge>
            {m.confidence && <span className="text-primary font-semibold">{m.confidence}%</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Live Football Scores Today | Real-Time Updates | PredictPro" description="Live football scores updating every 30 seconds. Follow matches live with goals, events and final scores across all major leagues." canonical="/live" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Activity className="h-8 w-8 text-red-500"/>Live Scores</h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3"/>Auto-refreshes every 30s · {lastUpdated.toLocaleTimeString('en-KE')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMatches} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
        ) : (
          <div className="space-y-6">
            {live.length>0 && (
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide text-red-500 flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>Live Now ({live.length})
                </h2>
                <div className="space-y-3">{live.map(m=><MatchCard key={m.id} m={m}/>)}</div>
              </div>
            )}
            {upcoming.length>0 && (
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide text-blue-500 mb-3">Upcoming with AI Predictions ({upcoming.length})</h2>
                <div className="space-y-3">{upcoming.map(m=><MatchCard key={m.id} m={m}/>)}</div>
              </div>
            )}
            {finished.length>0 && (
              <div>
                <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">Results ({finished.length})</h2>
                <div className="space-y-3">{finished.map(m=><MatchCard key={m.id} m={m}/>)}</div>
              </div>
            )}
            {matches.length===0 && (
              <div className="text-center py-20">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                <p className="text-muted-foreground font-medium">No matches at the moment</p>
                <p className="text-sm text-muted-foreground mt-1">Check back during match hours or view our <a href="/best-bets" className="text-primary hover:underline">upcoming predictions</a>.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
