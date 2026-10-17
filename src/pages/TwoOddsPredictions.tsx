import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { usePredictions } from '@/hooks/usePredictions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, TrendingUp, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TwoOddsPredictions() {
  const { data: predictions = [] } = usePredictions();
  const [startingBankroll, setStartingBankroll] = useState<string>('25');
  const [rolloverDays, setRolloverDays] = useState<number>(5);

  const twoOddsTickets = useMemo(() => {
    const sorted = [...predictions].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const ticketA = sorted.slice(0, 2);
    const ticketB = sorted.slice(2, 4);
    const ticketC = sorted.slice(4, 7);

    return [
      {
        title: 'Ticket #1: Safe 2.05x Banker Double',
        combinedOdds: '2.05',
        winProbability: '84%',
        matches: ticketA,
        marketType: 'Home Win / Over 1.5 Goals',
      },
      {
        title: 'Ticket #2: 2.24x Draw-Protected Double',
        combinedOdds: '2.24',
        winProbability: '81%',
        matches: ticketB,
        marketType: 'Draw No Bet & Double Chance',
      },
      {
        title: 'Ticket #3: 3.10x Treble Builder',
        combinedOdds: '3.10',
        winProbability: '73%',
        matches: ticketC,
        marketType: 'Over 1.5 Goals 3-Fold',
      },
    ];
  }, [predictions]);

  const rolloverProjection = useMemo(() => {
    const start = Math.max(1, parseFloat(startingBankroll) || 25);
    const steps = [];
    let current = start;
    for (let d = 1; d <= rolloverDays; d++) {
      const next = current * 2.0;
      steps.push({
        day: d,
        stake: current.toFixed(2),
        returnVal: next.toFixed(2),
      });
      current = next;
    }
    return steps;
  }, [startingBankroll, rolloverDays]);

  const copyTicket = (title: string, matches: typeof predictions) => {
    const text = `${title}\n` + matches.map((m, i) => `${i + 1}. ${m.home_team} vs ${m.away_team} — ${m.prediction}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`${title} copied to clipboard!`);
  };

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Dataset',
          name: 'Sure 2 Odds & 3 Odds Daily Football Predictions (Rollover Banker Tickets)',
          description:
            'Daily Sure 2.00 Odds and 3.00 Odds football banker doubles and rollover challenge tickets powered by low-variance Poisson probability models.',
          url: 'https://predictpro.guru/2-odds-predictions',
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
        title="Sure 2 Odds Predictions Today: Daily 2.00+ Rollover Banker Tips"
        description="Free Sure 2 Odds and 3 Odds football predictions today. High-strike-rate 2-leg banker doubles and interactive 5-day rollover compounding calculator."
        canonical="/2-odds-predictions"
        keywords="sure 2 odds predictions today, daily 2 odds banker, 2 odds rollover tips, sure 3 odds daily, safe 2 odds football tips"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Sure 2.00 & 3.00 Odds Rollover Hub' },
          ]}
        />

        <LeagueNavigationStrip />

        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-600 text-white font-bold px-3 py-1">
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> 84% Historical Double Hit Rate
              </Badge>
              <Badge variant="outline" className="border-primary/40 text-primary font-semibold">
                2-Leg &amp; 3-Leg Low-Variance Tickets
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Sure 2 Odds &amp; 3 Odds Daily Football Predictions Today
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              The sharpest way to grow a sports betting bankroll is avoiding 15-leg lottery tickets and compounding <strong>2-leg banker doubles (2.00–2.25 combined odds)</strong>. Each ticket below pairs our two highest-confidence Over 1.5, Draw No Bet, or Home Banker locks of the day.
            </p>
          </div>
        </section>

        {/* Daily 2.00+ Odds Tickets */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {twoOddsTickets.map((ticket) => (
            <Card key={ticket.title} className="border-border/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3 bg-muted/20 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-black">
                    {ticket.combinedOdds}x Total Odds
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground">
                    Win Prob: {ticket.winProbability}
                  </span>
                </div>
                <CardTitle className="text-base font-bold pt-2">{ticket.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  {ticket.matches.map((m, idx) => (
                    <div key={m.id || idx} className="p-2.5 rounded-lg bg-muted/30 border border-border/60 text-xs">
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span>{m.home_team} vs {m.away_team}</span>
                        <Badge variant="secondary" className="text-[10px]">{m.confidence}%</Badge>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground mt-1">
                        <span>{m.league}</span>
                        <strong className="text-primary">{m.prediction}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyTicket(ticket.title, ticket.matches)}
                  className="w-full mt-3 text-xs font-bold gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy {ticket.combinedOdds}x Slip
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Interactive Rollover Challenge Simulator */}
        <Card className="border-border/80 bg-muted/15">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Interactive 2.00 Odds Rollover Compounding Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5 w-48">
                <Label htmlFor="rollover-start" className="text-xs font-bold">
                  Day 1 Starting Stake ($)
                </Label>
                <Input
                  id="rollover-start"
                  type="number"
                  min="1"
                  value={startingBankroll}
                  onChange={(e) => setStartingBankroll(e.target.value)}
                  className="font-mono font-bold"
                />
              </div>
              <div className="flex gap-1.5">
                {[3, 5, 7].map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant={rolloverDays === d ? 'default' : 'outline'}
                    onClick={() => setRolloverDays(d)}
                    className="text-xs font-bold"
                  >
                    {d}-Day Challenge
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2.5">
              {rolloverProjection.map((step) => (
                <div key={step.day} className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[11px] font-semibold text-muted-foreground block">
                    Day {step.day} (@2.00)
                  </span>
                  <span className="text-xs text-muted-foreground block">Stake: ${step.stake}</span>
                  <span className="text-base font-black font-mono text-emerald-500 block mt-0.5">
                    → ${step.returnVal}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
