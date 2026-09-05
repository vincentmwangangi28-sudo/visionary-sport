import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionCard } from '@/components/PredictionCard';
import { PredictionListSkeleton } from '@/components/PredictionCardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Zap, RefreshCw, TrendingUp, Trophy, Sparkles } from 'lucide-react';
import { AdBannerHorizontal } from '@/components/AdBanner';
import { WhatsAppShare } from '@/components/WhatsAppShare';
import { useBetSlip } from '@/hooks/useBetSlip';
import type { Prediction } from '@/types/prediction';
import { getPrediction, getConfidence } from '@/types/prediction';
import { DEFAULT_PREDICTIONS } from '@/data/mockPredictions';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { mergeAndPreservePredictions } from '@/services/predictionStorage';

function sanitizeAndDeduplicate(list: Prediction[]): Prediction[] {
  const seenTeams = new Map<string, number>();
  const sanitized: Prediction[] = [];

  for (const pred of list) {
    if (!pred.home_team || !pred.away_team) continue;
    const matchTime = new Date(pred.match_date).getTime();
    
    const homeLast = seenTeams.get(pred.home_team.toLowerCase());
    const awayLast = seenTeams.get(pred.away_team.toLowerCase());
    const tooCloseHome = homeLast && Math.abs(matchTime - homeLast) < 48 * 3600 * 1000;
    const tooCloseAway = awayLast && Math.abs(matchTime - awayLast) < 48 * 3600 * 1000;

    if (tooCloseHome || tooCloseAway) continue;

    seenTeams.set(pred.home_team.toLowerCase(), matchTime);
    seenTeams.set(pred.away_team.toLowerCase(), matchTime);
    sanitized.push(pred);
  }

  return sanitized;
}

export default function BestBets() {
  const [bets, setBets] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [minConf, setMinConf] = useState(70);
  const { addSelections } = useBetSlip();

  const handleLoadTopPicks = () => {
    if (bets.length === 0) return;
    const top3 = bets.slice(0, 3).map(b => ({
      match: `${b.home_team} vs ${b.away_team}`,
      homeTeam: b.home_team,
      awayTeam: b.away_team,
      league: b.league,
      matchDate: b.match_date,
      market: b.predicted_outcome || b.prediction || 'Home Win',
      odds: b.home_odds || 1.90,
      confidence: getConfidence(b) || 75,
    }));
    addSelections(top3);
  };

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const items: Prediction[] = [];
    
    // 1. Fetch real-time live upcoming fixtures
    try {
      const realFixtures = await fetchRealtimeUpcomingFixtures();
      if (realFixtures && realFixtures.length > 0) {
        items.push(...realFixtures.filter(p => (getConfidence(p) || 0) >= minConf));
      }
    } catch (err) {
      console.warn('Realtime fixtures error in BestBets:', err);
    }

    // 2. Only fallback if no real fixtures found
    if (items.length < 4) {
      try {
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
        const { data } = await supabase.from('predictions')
          .select('*')
          .gte('match_date', new Date().toISOString())
          .lte('match_date', nextWeek)
          .gte('confidence', minConf)
          .order('confidence', { ascending: false })
          .limit(20);
        if (data && data.length > 0) {
          const existing = new Set(items.map(p => `${p.home_team}-${p.away_team}`.toLowerCase()));
          for (const d of data as Prediction[]) {
            const key = `${d.home_team}-${d.away_team}`.toLowerCase();
            if (!existing.has(key)) {
              items.push(d);
            }
          }
        }
      } catch (err) {
        console.warn('BestBets fetch error:', err);
      }

      if (items.length < 4) {
        const fallback = DEFAULT_PREDICTIONS.filter(p => (getConfidence(p) || 0) >= minConf);
        const existingIds = new Set(items.map(p => `${p.home_team}-${p.away_team}`.toLowerCase()));
        for (const f of fallback) {
          const key = `${f.home_team}-${f.away_team}`.toLowerCase();
          if (!existingIds.has(key)) {
            items.push(f);
          }
        }
      }
    }

    const clean = sanitizeAndDeduplicate(mergeAndPreservePredictions(items));
    clean.sort((a, b) => (getConfidence(b) || 0) - (getConfidence(a) || 0));
    setBets(clean.slice(0, 18));
    setLoading(false);
  }, [minConf]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const shareText = bets.slice(0, 5).map(b =>
    `✅ ${b.home_team} vs ${b.away_team} — ${getPrediction(b)} (${getConfidence(b)}% conf)`
  ).join('\n') + '\n\n🔮 predictpro.guru';

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Today's Best Football Bets | Free AI Tips | PredictPro"
        description="Today's highest-confidence AI football predictions. Free daily tips with 60%+ accuracy scores, odds comparison and expert analysis."
        canonical="/best-bets"
        keywords="best football bets today, free football tips today, sure bets today, high confidence football predictions" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />Best Bets Today
            </h1>
            <p className="text-muted-foreground mt-1">Outcome vectors ranked by confidence-weighted probability · {minConf}%+ threshold · Rolling 7-day window</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Link to="/recommendations">
              <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 hover:border-primary/60 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                AI Recommendations
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={handleLoadTopPicks}
              disabled={bets.length === 0}
              className="gap-1.5 font-bold text-xs"
            >
              <Zap className="h-3.5 w-3.5" />
              Load Top 3 to Slip
            </Button>
            <WhatsAppShare text={shareText} />
            <Button variant="outline" size="sm" onClick={fetch_} disabled={loading} aria-label="Refresh bets">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Confidence filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[60, 70, 75, 80].map(c => (
            <Button key={c} size="sm" variant={minConf === c ? 'default' : 'outline'}
              onClick={() => setMinConf(c)} className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />{c}%+
            </Button>
          ))}
          <Badge variant="outline" className="ml-auto self-center px-3 py-1.5">
            {bets.length} picks found
          </Badge>
        </div>

        {loading ? (
          <PredictionListSkeleton count={6} />
        ) : bets.length === 0 ? (
          <div className="text-center py-20">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-semibold text-lg">No predictions at {minConf}%+ confidence</p>
            <p className="text-muted-foreground mt-1 mb-4">Try a lower threshold to see more picks</p>
            <Button onClick={() => setMinConf(60)} variant="outline">Show All (60%+)</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bets.map((p, i) => (
                <div key={p.id}>
                  <PredictionCard prediction={p} />
                  {i === 5 && <AdBannerHorizontal className="sm:col-span-2 lg:col-span-3 mt-2" />}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
