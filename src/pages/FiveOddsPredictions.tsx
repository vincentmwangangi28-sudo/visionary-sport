import React, { useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { usePredictions } from '@/hooks/usePredictions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Copy, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function FiveOddsPredictions() {
  const { data: predictions = [] } = usePredictions();

  const multiSlips = useMemo(() => {
    const sorted = [...predictions].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    return [
      {
        title: 'Daily 5.20 Odds 4-Fold Acca',
        badge: '5.20x Combined Odds',
        legs: sorted.slice(0, 4),
      },
      {
        title: 'Daily 10.40 Odds 5-Fold Value Acca',
        badge: '10.40x Combined Odds',
        legs: sorted.slice(1, 6),
      },
    ];
  }, [predictions]);

  const copyAcca = (title: string, legs: typeof predictions) => {
    const text = `${title}\n` + legs.map((m, i) => `${i + 1}. ${m.home_team} vs ${m.away_team} — ${m.prediction}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`${title} copied!`);
  };

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Dataset',
          name: 'Sure 5 Odds & 10 Odds Daily Football Accumulator Predictions',
          description:
            'Daily 5.00 Odds 4-fold and 10.00 Odds 5-fold football accumulator predictions built with uncorrelated league selections and Poisson goal probabilities.',
          url: 'https://predictpro.guru/5-odds-predictions',
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
        title="Sure 5 Odds & 10 Odds Predictions Today: Daily Acca Slips"
        description="Free Sure 5 Odds and 10 Odds football accumulator predictions today. Curated 4-fold and 5-fold multi-bet tickets with high AI confidence."
        canonical="/5-odds-predictions"
        keywords="sure 5 odds predictions today, daily 5 odds tips, sure 10 odds predictions, 5 odds accumulator tips, 10 odds banker slip today"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Sure 5 Odds & 10 Odds Accumulators' },
          ]}
        />

        <LeagueNavigationStrip />

        <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                <Layers className="h-3.5 w-3.5 mr-1.5" /> Mid-Range Acca Sweet Spot
              </Badge>
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 font-semibold">
                4-Fold (5.20x) &amp; 5-Fold (10.40x)
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Sure 5 Odds &amp; 10 Odds Football Predictions Today
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Built for bettors seeking 5x to 10x returns without the extreme variance of 20-leg tickets. Our algorithm selects 4 to 5 uncorrelated fixtures across different kickoff windows so you can hedge or cash out the final leg for guaranteed profit.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {multiSlips.map((slip) => (
            <Card key={slip.title} className="border-border/80">
              <CardHeader className="bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold">{slip.title}</CardTitle>
                <Badge className="bg-primary text-primary-foreground font-black">{slip.badge}</Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {slip.legs.map((m, idx) => (
                  <div key={m.id || idx} className="p-3 rounded-lg bg-muted/30 border border-border/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-foreground">{m.home_team} vs {m.away_team}</p>
                      <p className="text-muted-foreground">{m.league}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-primary block">{m.prediction}</span>
                      <span className="text-[10px] text-emerald-500 font-bold">{m.confidence}% AI Conf</span>
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  onClick={() => copyAcca(slip.title, slip.legs)}
                  className="w-full text-xs font-bold gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy {slip.badge} Ticket
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
