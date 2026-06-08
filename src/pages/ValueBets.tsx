import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Zap, AlertTriangle, RefreshCw, Info } from 'lucide-react';

interface ValueBet {
  id: string; home_team: string; away_team: string; match_date: string;
  league: string; market: string; odds: number; aiProbability: number;
  valuePct: number; edge: 'strong' | 'moderate';
}

export default function ValueBets() {
  const [bets, setBets] = useState<ValueBet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('find-value-bets');
      if (data?.valueBets) setBets(data.valueBets);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Football Value Bets | Statistical Edge Finder | PredictPro" description="Find value bets where AI probability exceeds bookmaker odds. Statistical edge calculator for Premier League, La Liga, Bundesliga. Beat the bookmakers with data." keywords="football value bets, value betting football, beating bookmakers, positive expected value bets, football betting edge" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3"><TrendingUp className="h-8 w-8 text-primary" />Value Bets</h1>
          <Button variant="outline" size="sm" onClick={fetch} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>
        <p className="text-muted-foreground mb-6">Matches where our AI probability exceeds the bookmaker's implied probability — giving you a statistical edge.</p>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">Value betting requires bankroll management. Never stake more than 2-5% per bet. Past AI accuracy does not guarantee future results. Gamble responsibly.</p>
        </div>

        {/* How it works */}
        <Card className="mb-6 bg-muted/30">
          <CardContent className="p-4 flex gap-4 items-start">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">How value is calculated</p>
              <p className="text-muted-foreground">Value % = (AI probability × bookmaker odds − 1) × 100. A positive value means you have an edge. <span className="text-green-600 font-medium">Strong edge (&gt;15%)</span> is the best opportunity.</p>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
        ) : bets.length === 0 ? (
          <div className="text-center py-20">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No value bets found right now. Predictions with odds data will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet, i) => (
              <Card key={i} className={`border-l-4 ${bet.edge === 'strong' ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{bet.league}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(bet.match_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      </div>
                      <p className="font-bold text-lg">{bet.home_team} vs {bet.away_team}</p>
                      <p className="text-sm text-muted-foreground mt-1">Market: <span className="font-medium text-foreground">{bet.market}</span></p>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div className="bg-muted/50 rounded-lg p-3 min-w-[80px]">
                        <p className="text-xs text-muted-foreground">Odds</p>
                        <p className="text-xl font-bold text-primary">{bet.odds.toFixed(2)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 min-w-[80px]">
                        <p className="text-xs text-muted-foreground">AI Prob.</p>
                        <p className="text-xl font-bold">{bet.aiProbability}%</p>
                      </div>
                      <div className={`rounded-lg p-3 min-w-[80px] ${bet.edge === 'strong' ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className={`text-xl font-bold flex items-center gap-1 ${bet.edge === 'strong' ? 'text-green-600' : 'text-amber-600'}`}>
                          +{bet.valuePct}%
                          {bet.edge === 'strong' && <Zap className="h-4 w-4" />}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
