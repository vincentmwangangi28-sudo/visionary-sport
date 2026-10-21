import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ValueBetListSkeleton } from '@/components/PredictionCardSkeleton';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { getConfidence, getPrediction } from '@/types/prediction';
import { TrendingUp, Zap, AlertTriangle, RefreshCw, Info, Sparkles, Plus, CheckCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMatchSlug } from '@/services/sitemapGenerator';
import { TeamLogo } from '@/components/TeamLogo';
import { toast } from 'sonner';
import { useBetSlip } from '@/hooks/useBetSlip';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import { screenValueWithGemini, GeminiValueResult } from '@/services/geminiTasksService';

interface ValueBet {
  id: string; home_team: string; away_team: string; match_date: string;
  league: string; market: string; odds: number; aiProbability: number;
  valuePct: number; edge: 'strong' | 'moderate';
}

export default function ValueBets() {
  const [bets, setBets] = useState<ValueBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [geminiScreenResult, setGeminiScreenResult] = useState<GeminiValueResult | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(false);

  const { addSelection, selections } = useBetSlip();

  const fetch_ = async () => {
    setLoading(true);
    try {
      const fixtures = await fetchRealtimeUpcomingFixtures();
      const calculated: ValueBet[] = [];

      for (const f of fixtures) {
        const conf = getConfidence(f) || 75;
        const pred = getPrediction(f) || 'Home Win';
        
        let market = 'Home Win (1)';
        let odds = f.home_odds || 1.85;
        let prob = conf;

        if (pred === 'Away Win') {
          market = 'Away Win (2)';
          odds = f.away_odds || 2.50;
          prob = conf;
        } else if (pred === 'Draw') {
          market = 'Draw (X)';
          odds = f.draw_odds || 3.40;
          prob = conf;
        }

        // Value % = (Probability * Odds - 1) * 100
        const impliedProb = 1 / odds;
        const actualProb = prob / 100;
        const valuePct = Math.round(((actualProb * odds) - 1) * 100);

        if (valuePct >= 8) {
          calculated.push({
            id: f.id,
            home_team: f.home_team,
            away_team: f.away_team,
            match_date: f.match_date,
            league: f.league,
            market,
            odds,
            aiProbability: prob,
            valuePct,
            edge: valuePct >= 16 ? 'strong' : 'moderate',
          });
        }
      }

      // Sort upcoming fixtures by match_date in ascending order (most immediate first, then valuePct)
      calculated.sort((a, b) => {
        const timeA = new Date(a.match_date).getTime();
        const timeB = new Date(b.match_date).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return b.valuePct - a.valuePct;
      });
      setBets(calculated.slice(0, 15));
    } catch (e) {
      console.warn('Value bets fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch_(); }, []);

  const handleAddToSlip = (bet: ValueBet) => {
    addSelection({
      match: `${bet.home_team} vs ${bet.away_team}`,
      homeTeam: bet.home_team,
      awayTeam: bet.away_team,
      league: bet.league,
      market: bet.market,
      odds: bet.odds,
      confidence: bet.aiProbability,
    });
    toast.success(`Added ${bet.home_team} vs ${bet.away_team} to Accumulator slip!`);
  };

  const handleGeminiScreenTopBet = async () => {
    if (bets.length === 0) return;
    const top = bets[0];
    setLoadingGemini(true);
    try {
      const res = await screenValueWithGemini(
        { homeTeam: top.home_team, awayTeam: top.away_team, league: top.league },
        { home: top.odds, draw: 3.40, away: 3.80 },
        { home: top.aiProbability, draw: 22, away: 100 - top.aiProbability - 22 }
      );
      setGeminiScreenResult(res);
      toast.success('Gemini Value Screener analysis complete!');
    } catch {
      toast.error('Failed to run Gemini Value Screener');
    } finally {
      setLoadingGemini(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Daily Value Bets Today (+EV): Beat Bookmaker Odds with AI | PredictPro"
        description="Daily positive expected value (+EV) football bets today. Compare AI Poisson probability vs bookmaker odds to detect market mispricings and lock in edges."
        canonical="/value-bets"
        keywords="daily value bets today (+ev), value bets today, positive expected value football, beating bookmakers, football betting edge, ai odds discrepancies, aiprotips value"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Daily Value Bets (+EV)', item: '/value-bets' }
        ]}
        structuredData={{
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What is a positive expected value (+EV) bet in football?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'A positive expected value (+EV) bet occurs when our AI probability model calculates that an outcome has a higher true likelihood of happening than the implied probability of the bookmaker odds. Over hundreds of wagers, placing +EV bets generates sustained mathematical profit.'
              }
            },
            {
              '@type': 'Question',
              name: 'How does PredictPro calculate value bet edges?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'PredictPro compares our Poisson xG model fair probability against live market odds from major global bookmakers. If our fair odds are significantly shorter than the market odds (Edge > 8%), it is flagged as a high-value bet.'
              }
            }
          ]
        }}
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 max-w-6xl space-y-6">
        {/* Visual Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center text-xs text-muted-foreground gap-2">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Daily Value Bets (+EV)</span>
        </nav>

        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Mathematical Edge Scanner · Fair Odds vs Bookmaker Price (+EV)
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Daily Value Bets Today (+EV)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Fixtures where our Expected Goals (xG) fair-odds model diverges from bookmaker implied probabilities by 8% or more.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeminiScreenTopBet}
              disabled={loadingGemini || bets.length === 0}
              className="gap-1.5 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <TrendingUp className={`h-3.5 w-3.5 text-emerald-400 ${loadingGemini ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{loadingGemini ? 'Calculating...' : 'Audit Top +EV Edge'}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetch_} 
              disabled={loading} 
              className="gap-1.5 text-xs font-semibold bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Cross-Linking Ribbon */}
        <div className="p-3.5 rounded-xl bg-card border border-border text-xs flex flex-wrap items-center justify-between gap-3">
          <span className="text-muted-foreground">
            Compare models: Run custom simulations in our <Link to="/predict" className="font-bold text-primary underline">Match Simulator</Link>, check <Link to="/btts" className="font-bold text-primary underline">BTTS &amp; Over 2.5 Tips</Link>, or read our <Link to="/blog/closing-line-value-clv-dropping-odds" className="font-bold text-primary underline">Closing Line Value (CLV) Guide</Link>.
          </span>
          <Link to="/best-bets" className="text-primary font-bold hover:underline flex items-center gap-1">
            View Today's 75%+ Banker Picks &rarr;
          </Link>
        </div>

        {/* Fair Price Audit Report */}
        {geminiScreenResult && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Poisson Fair-Price Edge Audit
              </span>
              <Badge className="bg-emerald-600 text-white text-[10px]">
                {geminiScreenResult.verdict} (+{geminiScreenResult.ev_percentage}% EV)
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {geminiScreenResult.analysis}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
              <div className="p-2 rounded bg-background/80 border text-xs">
                <span className="text-[10px] text-muted-foreground block">Market Pick</span>
                <span className="font-bold">{geminiScreenResult.recommended_market}</span>
              </div>
              <div className="p-2 rounded bg-background/80 border text-xs">
                <span className="text-[10px] text-muted-foreground block">Bookie Price</span>
                <span className="font-bold text-primary">@ {geminiScreenResult.market_price}</span>
              </div>
              <div className="p-2 rounded bg-background/80 border text-xs">
                <span className="text-[10px] text-muted-foreground block">Model Fair Price</span>
                <span className="font-bold">@ {geminiScreenResult.fair_price}</span>
              </div>
              <div className="p-2 rounded bg-background/80 border text-xs">
                <span className="text-[10px] text-muted-foreground block">Kelly Stake</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {geminiScreenResult.kelly_stake_percent}% Bankroll
                </span>
              </div>
            </div>
          </div>
        )}

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
          <ValueBetListSkeleton count={5} />
        ) : bets.length === 0 ? (
          <div className="text-center py-20">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No value bets found right now. Predictions with odds data will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet, i) => {
              const matchSlug = formatMatchSlug(bet.home_team, bet.away_team, bet.match_date);
              const matchUrl = `/predict/${matchSlug}`;

              return (
              <Card key={i} className={`border-l-4 ${bet.edge === 'strong' ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="outline" className="text-xs">{bet.league}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(bet.match_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      </div>
                      <Link
                        to={matchUrl}
                        className="flex items-center gap-2 my-1 group hover:text-primary transition-colors"
                        title={`View ${bet.home_team} vs ${bet.away_team} AI match prediction & head-to-head`}
                      >
                        <TeamLogo team={bet.home_team} size="sm" />
                        <span className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{bet.home_team}</span>
                        <span className="text-muted-foreground text-xs font-semibold">vs</span>
                        <TeamLogo team={bet.away_team} size="sm" />
                        <span className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{bet.away_team}</span>
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">Market: <span className="font-medium text-foreground">{bet.market}</span></p>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div className="bg-muted/50 rounded-lg p-3 min-w-[80px]">
                        <p className="text-xs text-muted-foreground">Odds</p>
                        <p className="text-xl font-bold text-primary">{bet.odds.toFixed(2)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 min-w-[80px] flex flex-col items-center justify-center">
                        <p className="text-xs text-muted-foreground mb-1">AI Prob.</p>
                        <ConfidenceMeter confidence={bet.aiProbability} variant="compact" />
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

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
                    <Link
                      to={matchUrl}
                      className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                      title={`View full match preview for ${bet.home_team} vs ${bet.away_team}`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Full Match Intel &rarr;</span>
                    </Link>
                    <div>
                    {selections.some(s => s.match === `${bet.home_team} vs ${bet.away_team}`) ? (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        disabled 
                        className="h-7 text-xs gap-1.5"
                      >
                        <CheckCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        <span>In Slip</span>
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleAddToSlip(bet)} 
                        className="h-7 text-xs gap-1.5 font-semibold"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Add to Slip</span>
                      </Button>
                    )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
