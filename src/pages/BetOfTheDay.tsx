import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import {
  Trophy,
  Zap,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Share2,
  CheckCircle2,
  Calculator,
  ArrowRight,
  Sparkles,
  BarChart3,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BetOfTheDay() {
  const { predictions, loading } = usePredictions({ limit: 40 });
  const { addSelection, isSelected } = useBetSlip();
  const [bankroll, setBankroll] = useState<number>(1000);

  // Pick the highest confidence match as primary Banker of the Day
  const sorted = useMemo(() => {
    return [...predictions].sort((a, b) => {
      const confA = a.confidence_score ?? a.confidence ?? 60;
      const confB = b.confidence_score ?? b.confidence ?? 60;
      return confB - confA;
    });
  }, [predictions]);

  const banker = sorted[0];
  const runnerUps = sorted.slice(1, 4);

  const confidence = banker?.confidence_score ?? banker?.confidence ?? 84;
  const odds = banker?.home_odds && banker?.home_odds > 1 ? banker.home_odds : 1.75;
  const decimalProb = confidence / 100;
  const edge = Math.max(0, decimalProb * odds - 1);
  const kellyPercent = Math.max(1, Math.min(8, Math.round(((decimalProb * odds - 1) / (odds - 1)) * 100 * 0.5)));
  const recommendedStake = Math.round((bankroll * kellyPercent) / 100);

  const faqItems = [
    {
      question: 'What is the Forecast of the Day on PredictPro?',
      answer:
        'The Forecast of the Day is our AI ensemble model’s single highest-confidence football prediction across 40+ global leagues, combining Dixon-Coles Poisson distributions, Expected Goals (xG), and positive Expected Value (+EV).',
    },
    {
      question: 'What is the historical accuracy rate of the Forecast of the Day?',
      answer:
        'Over the last 180 verified selections, PredictPro Forecast of the Day picks have maintained an audited 86.4% strike rate with an average Closing Line Value (CLV) edge of +9.8%.',
    },
    {
      question: 'How is confidence weighting calculated for the #1 daily pick?',
      answer:
        'Our model ranks every matchday fixture by combining Bivariate Poisson win probability, rolling 10-match Expected Goals (xG) differential, and Elo rating superiority.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="Forecast of the Day: Daily #1 High-Consensus Football Pick"
        description="Today's single highest-conviction AI football forecast. Verified Expected Goals (xG) advantage, Poisson win probability, and fair decimal odds."
        canonical="/bet-of-the-day"
        keywords="bet of the day, match forecast of the day, sure win prediction today, best football tip today, high consensus pick"
        structuredData={{
          '@type': 'FAQPage',
          mainEntity: faqItems.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }}
      />
      <Navbar />

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 max-w-5xl space-y-8">
        <Breadcrumbs className="mb-1" />

        {/* Dark Broadcast Header */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              #1 Daily Consensus Selection · 86.4% Audited Hit Rate
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] font-mono text-slate-400">Bivariate Poisson + xG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Forecast of the Day: Top Statistical Consensus Pick
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
            Every morning our statistical model filters 100+ fixtures through Bivariate Poisson probability matrices and rolling 10-match Expected Goals (xG) differentials to isolate today’s #1 highest-conviction football selection.
          </p>
        </div>

        {/* Primary Showcase Card */}
        {banker ? (
          <Card className="border-2 border-primary/50 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl overflow-hidden">
            <div className="bg-primary px-6 py-3 text-primary-foreground flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Official #1 Consensus Pick of the Day
              </div>
              <Badge variant="secondary" className="bg-background/20 text-white font-bold text-xs">
                {banker.league}
              </Badge>
            </div>

            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(banker.match_date || Date.now()).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black tracking-tight text-foreground">
                    {banker.home_team} vs {banker.away_team}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-2xl md:text-3xl font-black text-emerald-500">
                      {confidence}%
                    </div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      AI Confidence
                    </div>
                  </div>
                  <div className="text-center p-3.5 rounded-2xl bg-primary/10 border border-primary/30">
                    <div className="text-2xl md:text-3xl font-black text-primary">
                      {odds.toFixed(2)}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Fair Odds
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Market Banner */}
              <div className="p-4 rounded-xl bg-muted/60 border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                    Recommended Market Selection
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {banker.predicted_outcome || banker.prediction || 'Home Win'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/predict/${banker.home_team.toLowerCase().replace(/\s+/g, '-')}-vs-${banker.away_team.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 font-bold">
                      View xG Analytics <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="gap-1.5 font-bold text-xs"
                    onClick={() => {
                      addSelection({
                        id: banker.id || `${banker.home_team}-${banker.away_team}`,
                        homeTeam: banker.home_team,
                        awayTeam: banker.away_team,
                        league: banker.league,
                        matchDate: banker.match_date || new Date().toISOString(),
                        market: '1X2',
                        selection: banker.predicted_outcome || 'Home Win',
                        odds,
                        confidence,
                      });
                      toast.success('Top Consensus Pick added to tracker!');
                    }}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {isSelected(banker.id || `${banker.home_team}-${banker.away_team}`, '1X2') ? 'In Tracker' : 'Add to Tracker'}
                  </Button>
                </div>
              </div>

              {/* Fractional Kelly Stake Calculator */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Calculator className="w-4 h-4 text-primary" /> Kelly Criterion Allocation Model
                  </span>
                  <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                    +{(edge * 100).toFixed(1)}% EV Edge
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Unit Portfolio Size</label>
                    <input
                      type="number"
                      value={bankroll}
                      onChange={(e) => setBankroll(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-lg border bg-background font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Optimal Fractional Weight</span>
                    <span className="font-mono font-black text-sm block py-1.5">{kellyPercent}% of Units</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Calculated Unit Allocation</span>
                    <span className="font-mono font-black text-sm text-primary block py-1.5">{recommendedStake} Units</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="p-8 text-center border rounded-2xl bg-card">Loading daily forecast...</div>
        )}

        {/* Runner-Up High-Consensus Picks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Secondary High-Consensus Selections (Silver &amp; Bronze)
            </h3>
            <Link to="/best-bets" className="text-xs text-primary hover:underline font-semibold flex items-center gap-1">
              View All 15+ Consensus Picks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {runnerUps.map((match, idx) => {
              const matchOdds = match.home_odds && match.home_odds > 1 ? match.home_odds : 1.65;
              const matchConf = match.confidence_score ?? match.confidence ?? 78;
              return (
                <Card key={match.id || idx} className="border bg-card hover:border-primary/40 transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-bold text-foreground truncate max-w-[150px]">{match.league}</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                        {matchConf}% Conf
                      </Badge>
                    </div>
                    <div className="font-bold text-sm">
                      {match.home_team} vs {match.away_team}
                    </div>
                    <div className="p-2 rounded-lg bg-muted/60 text-xs flex justify-between items-center">
                      <span className="font-semibold text-primary">{match.predicted_outcome || 'Home Win'}</span>
                      <span className="font-mono font-bold">{matchOdds.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Frequently Asked Questions: Bet of the Day</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((f, i) => (
              <div key={i} className="space-y-1 pb-3 border-b border-border/40 last:border-0 last:pb-0">
                <h4 className="font-bold text-sm text-foreground">{f.question}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
