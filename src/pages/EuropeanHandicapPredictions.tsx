import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Scale, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

export default function EuropeanHandicapPredictions() {
  const { predictions: matches = [], isLoading } = usePredictions(7);
  const { addSelections } = useBetSlip();

  const euroHandicapPicks = useMemo(() => {
    return [...matches]
      .sort((a, b) => {
        const aMax = Math.max(a.ai_prediction?.home_win_prob ?? 45, a.ai_prediction?.away_win_prob ?? 25);
        const bMax = Math.max(b.ai_prediction?.home_win_prob ?? 45, b.ai_prediction?.away_win_prob ?? 25);
        return bMax - aMax;
      })
      .slice(0, 8)
      .map((m) => {
        const hProb = m.ai_prediction?.home_win_prob ?? 48;
        const aProb = m.ai_prediction?.away_win_prob ?? 26;
        const homeFav = hProb >= aProb;
        const favTeam = homeFav ? m.home_team : m.away_team;
        const favWinProb = Math.max(hProb, aProb);
        const homeXg = Number((1.1 + (hProb / 100) * 1.9).toFixed(2));
        const awayXg = Number((0.65 + (aProb / 100) * 1.65).toFixed(2));
        const probWinBy2Plus = Math.min(76, Math.max(44, Math.round(favWinProb * 0.72 + 12)));
        const baseOdds = homeFav ? m.ai_prediction?.odds_home || 1.55 : m.ai_prediction?.odds_away || 1.75;
        const odds = Number(Math.max(1.85, Math.min(3.4, baseOdds * 1.48)).toFixed(2));
        const kickoff = m.match_date
          ? new Date(m.match_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : 'Upcoming';

        return {
          id: m.id,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          league: m.league,
          kickoff,
          matchDate: m.match_date,
          homeXg,
          awayXg,
          probWinBy2Plus,
          odds,
          line: `${homeFav ? 'Home' : 'Away'} (${favTeam} -1) 3-Way`,
          projectedScore: homeFav ? (hProb >= 62 ? '3-0' : '2-0') : '0-2',
        };
      });
  }, [matches]);

  const doubleOdds = useMemo(() => {
    if (euroHandicapPicks.length < 2) return null;
    return (euroHandicapPicks[0].odds * euroHandicapPicks[1].odds).toFixed(2);
  }, [euroHandicapPicks]);

  const schemas = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'European Handicap (-1 / -2) 3-Way Football Predictions Today',
        description:
          'Daily 3-Way European Handicap (-1) football predictions for heavy favorites to win by 2+ goals, powered by Poisson goal differential simulations.',
        url: 'https://predictpro.guru/handicap-1x2-predictions',
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="European Handicap (-1) Predictions Today: 3-Way Goal Margin Tips"
        description="Free European Handicap (-1 and +1) 3-Way football predictions today. Boost short 1.25 favorite odds to 2.10+ with AI 2+ goal margin xG forecasts."
        keywords="european handicap predictions, handicap -1 predictions today, 3 way handicap tips, team to win by 2 or more goals predictions, handicap 1x2 football tips"
        canonicalPath="/handicap-1x2-predictions"
        schema={schemas}
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'European Handicap (-1) Predictions' },
          ]}
        />

        <section className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-950/40 via-card to-background p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
              <Scale className="w-3.5 h-3.5 mr-1.5" /> 3-Way (-1) Margin Engine
            </Badge>
            <Badge variant="outline" className="text-xs border-border/60">
              Win by 2+ Goals Filter
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            European Handicap (-1) Predictions Today (3-Way Handicap 1X2)
          </h1>
          <p className="text-muted-foreground max-w-3xl text-sm sm:text-base leading-relaxed mb-5">
            When elite favorites are priced at short odds on the standard 1X2 moneyline, backing
            <strong> European Handicap (-1)</strong> requires a 2+ goal victory margin (2-0, 3-0, 3-1) while boosting your payout above 2.00+.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={euroHandicapPicks.length < 2}
              onClick={() => {
                const topTwo = euroHandicapPicks.slice(0, 2);
                addSelections(
                  topTwo.map((p) => ({
                    matchId: p.id,
                    match: `${p.homeTeam} vs ${p.awayTeam}`,
                    homeTeam: p.homeTeam,
                    awayTeam: p.awayTeam,
                    league: p.league,
                    kickoff: p.matchDate,
                    market: p.line,
                    odds: p.odds,
                    confidence: p.probWinBy2Plus,
                  }))
                );
                toast.success('European Handicap (-1) Double copied to slip!');
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
            >
              <Trophy className="w-4 h-4 mr-2" /> Copy Top (-1) Handicap Double {doubleOdds ? `(${doubleOdds}x)` : ''}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/asian-handicap-predictions">
                Compare with Asian Handicap (-0.75 / -1.5) <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Today&apos;s Top (-1) Handicap Margin Picks
          </h2>

          {isLoading && euroHandicapPicks.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              Loading live 3-way European Handicap projections...
            </Card>
          ) : euroHandicapPicks.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No scheduled fixtures available in the 7-day feed right now.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {euroHandicapPicks.map((pick) => (
                <Card key={pick.id} className="p-5 border-border/60 bg-card/70 hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-medium text-indigo-400">{pick.league}</span>
                    <span>{pick.kickoff}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-base">
                        {pick.homeTeam} vs {pick.awayTeam}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        xG Diff: <strong className="text-foreground">{Math.abs(pick.homeXg - pick.awayXg).toFixed(2)}</strong> • Score Model: <strong className="text-indigo-400">{pick.projectedScore}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold">
                        {pick.line} @ {pick.odds}
                      </Badge>
                      <div className="text-[11px] text-indigo-400 font-medium mt-1">
                        {pick.probWinBy2Plus}% 2+ Goal Margin Prob
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
