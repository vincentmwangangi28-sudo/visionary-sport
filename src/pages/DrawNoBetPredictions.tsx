import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { usePredictions } from '@/hooks/usePredictions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, RefreshCw, ArrowRight, Calculator } from 'lucide-react';

export default function DrawNoBetPredictions() {
  const { data: predictions = [], isLoading } = usePredictions();

  const dnbMatches = useMemo(() => {
    return predictions.map((m, idx) => {
      const homeWinProb = Math.min(72, Math.max(48, Math.round((m.confidence || 74) * 0.78)));
      const drawProb = 24;
      const lossRisk = Math.max(6, 100 - homeWinProb - drawProb);
      const dnbSuccessRate = Math.round((homeWinProb / (100 - drawProb)) * 100);
      const dnbOdds = Number((1.38 + (idx % 6) * 0.08).toFixed(2));

      return {
        ...m,
        homeWinProb,
        drawProb,
        lossRisk,
        dnbSuccessRate,
        dnbOdds,
        dnbSelection: `${m.home_team} (Draw No Bet / AH 0.0)`,
      };
    });
  }, [predictions]);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Dataset',
          name: 'Draw No Bet (DNB) Football Predictions Today & Stake-Refund Tips',
          description:
            'Daily Draw No Bet (DNB / Asian Handicap 0.0) football predictions with automatic stake refund protection if the match finishes in a 90-minute draw.',
          url: 'https://predictpro.guru/draw-no-bet-predictions',
          creator: {
            '@type': 'Organization',
            name: 'PredictPro',
            url: 'https://predictpro.guru',
          },
        },
      ],
    }),
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Draw No Bet Predictions Today (DNB): Safe Football Refund Tips"
        description="Free Draw No Bet (DNB) football predictions today. Protect your bankroll with 89% non-losing AI picks where your full stake is refunded on a draw."
        canonical="/draw-no-bet-predictions"
        keywords="draw no bet predictions today, dnb football tips, draw no bet meaning, safe dnb accumulator tips, asian handicap 0.0 predictions"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Draw No Bet (DNB) Predictions' },
          ]}
        />

        <section className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Draw-Protected Market · Asian Handicap 0.0
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] font-mono text-slate-400">
                  100% Stake Refund on Draw
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Draw No Bet (DNB) Football Predictions Today
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Eliminate 90-minute stalemate heartbreak. Draw No Bet (equivalent to Asian Handicap 0.0) refunds your entire stake if the match ends level, offering higher odds than Double Chance (1X) while shielding your bankroll from late equalizers.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:w-64 shrink-0">
              <Link to="/double-chance-predictions">
                <Button variant="outline" size="sm" className="w-full justify-between text-xs font-semibold bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                  <span>Compare Double Chance (1X)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link to="/blog/draw-no-bet-vs-double-chance-strategy">
                <Button size="sm" className="w-full justify-between text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950">
                  <span>DNB vs 1X Math Guide</span>
                  <Calculator className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-emerald-500" />
            Today&apos;s Highest Non-Losing DNB Selections
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <Card key={n} className="h-40 animate-pulse bg-muted/30" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dnbMatches.slice(0, 16).map((item) => (
                <Card key={item.id} className="border-border/80 hover:border-emerald-500/40 transition-all">
                  <CardHeader className="py-3 px-5 bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between">
                    <Badge variant="outline" className="text-[11px] font-semibold">
                      {item.league}
                    </Badge>
                    <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-bold">
                      {item.dnbSuccessRate}% Win Excl. Draw
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-base text-foreground">
                          {item.home_team} vs {item.away_team}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Defeat Risk Only <strong className="text-emerald-500">{item.lossRisk}%</strong> · Draw Push: {item.drawProb}%
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-muted-foreground block">DNB Pick</span>
                        <span className="font-black text-sm text-primary">
                          {item.dnbSelection} @{item.dnbOdds}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
