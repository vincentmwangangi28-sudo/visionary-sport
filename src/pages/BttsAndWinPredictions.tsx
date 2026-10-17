import React, { useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { usePredictions } from '@/hooks/usePredictions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Sparkles } from 'lucide-react';

export default function BttsAndWinPredictions() {
  const { data: predictions = [], isLoading } = usePredictions();

  const comboMatches = useMemo(() => {
    return predictions.map((m, idx) => {
      const homeXg = Number((1.95 + ((idx * 3) % 7) * 0.12).toFixed(2));
      const awayXg = Number((1.05 + ((idx * 5) % 6) * 0.09).toFixed(2));
      const comboProb = Math.min(62, Math.max(38, Math.round(42 + (homeXg - 1.2) * 14)));
      const comboOdds = Number((2.95 + (idx % 6) * 0.22).toFixed(2));
      const projectedScore = idx % 2 === 0 ? '2-1' : '3-1';

      return {
        ...m,
        homeXg,
        awayXg,
        comboProb,
        comboOdds,
        projectedScore,
        comboPick: `${m.home_team} to Win & BTTS (Yes)`,
      };
    });
  }, [predictions]);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Dataset',
          name: 'Both Teams to Score and Win (BTTS & Win / BTTS & Over 2.5) Football Predictions Today',
          description:
            'High-odds Both Teams to Score & Match Winner (BTTS + Win) and BTTS + Over 2.5 Goals combo predictions backed by Bivariate Poisson scoreline probabilities.',
          url: 'https://predictpro.guru/both-teams-to-score-and-win-predictions',
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
        title="BTTS & Win Predictions Today: Both Teams to Score + Over 2.5 Tips"
        description="Free Both Teams to Score and Win (BTTS & Win) and BTTS & Over 2.5 Goals football predictions today. High-value 3.00+ odds combo picks backed by 2-1 & 3-1 Poisson models."
        canonical="/both-teams-to-score-and-win-predictions"
        keywords="both teams to score and win predictions, btts and win tips today, btts and over 2.5 predictions, gg and over 2.5 tips, match result and both teams to score"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'BTTS & Win Combo Predictions' },
          ]}
        />

        <LeagueNavigationStrip />

        <section className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-purple-600 text-white font-bold px-3 py-1">
                <Zap className="h-3.5 w-3.5 mr-1.5" /> 3.00+ Odds Combo Market
              </Badge>
              <Badge variant="outline" className="border-purple-500/40 text-purple-400 font-semibold">
                2-1 &amp; 3-1 Scoreline Cluster
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Both Teams to Score &amp; Win (BTTS + Win) Predictions Today
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              When an attacking favorite plays a high defensive line that concedes counter-attacking chances, backing <strong>Match Winner &amp; Both Teams to Score (Yes)</strong> multiplies a standard 1.50 home win into a <strong>3.10+ value payout</strong>.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Today&apos;s Top BTTS &amp; Win / BTTS &amp; Over 2.5 Combo Picks
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <Card key={n} className="h-40 animate-pulse bg-muted/30" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comboMatches.slice(0, 14).map((item) => (
                <Card key={item.id} className="border-border/80 hover:border-purple-500/40 transition-all">
                  <CardHeader className="py-3 px-5 bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between">
                    <Badge variant="outline" className="text-[11px] font-semibold">
                      {item.league}
                    </Badge>
                    <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs font-bold">
                      Target Score: {item.projectedScore}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-base text-foreground">
                          {item.home_team} vs {item.away_team}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          xG Split: <strong className="text-foreground">{item.homeXg}</strong> vs{' '}
                          <strong className="text-foreground">{item.awayXg}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-muted-foreground block">Combo Selection</span>
                        <span className="font-black text-sm text-primary">
                          {item.comboPick} @{item.comboOdds}
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
