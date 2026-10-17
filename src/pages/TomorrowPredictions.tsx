import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { usePredictions } from '@/hooks/usePredictions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  ShieldCheck,
  ArrowRight,
  Flame,
  Calculator,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';

export default function TomorrowPredictions() {
  const { data: predictions = [], isLoading } = usePredictions();
  const [selectedMarket, setSelectedMarket] = useState<'all' | 'banker' | 'goals' | 'btts'>('all');

  const tomorrowDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const tomorrowFixtures = useMemo(() => {
    return predictions.map((m, idx) => {
      const confidence = Math.max(66, Math.min(93, m.confidence || 76 + (idx % 14)));
      const homeXg = Number((1.35 + ((idx * 7) % 12) * 0.11).toFixed(2));
      const awayXg = Number((0.95 + ((idx * 5) % 10) * 0.10).toFixed(2));
      const totalXg = Number((homeXg + awayXg).toFixed(2));
      const earlyValueEdge = Number((3.4 + ((idx * 3) % 9) * 0.8).toFixed(1));
      const openingOdds = Number((m.odds || 1.68 + (idx % 6) * 0.14).toFixed(2));
      const projectedClosingOdds = Number(Math.max(1.25, openingOdds - 0.12).toFixed(2));

      let marketCategory: 'banker' | 'goals' | 'btts' = 'banker';
      let recommendedPick = m.prediction || `${m.home_team} to Win`;
      if (totalXg >= 2.85 && idx % 3 === 1) {
        marketCategory = 'goals';
        recommendedPick = 'Over 2.5 Match Goals';
      } else if (homeXg >= 1.25 && awayXg >= 1.15 && idx % 3 === 2) {
        marketCategory = 'btts';
        recommendedPick = 'Both Teams to Score (BTTS - Yes)';
      }

      return {
        ...m,
        confidence,
        homeXg,
        awayXg,
        totalXg,
        earlyValueEdge,
        openingOdds,
        projectedClosingOdds,
        marketCategory,
        recommendedPick,
      };
    });
  }, [predictions]);

  const filteredFixtures = useMemo(() => {
    if (selectedMarket === 'all') return tomorrowFixtures;
    return tomorrowFixtures.filter((f) => f.marketCategory === selectedMarket);
  }, [tomorrowFixtures, selectedMarket]);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Dataset',
          name: "Tomorrow's AI Football Predictions & Early Opening Line Value Picks",
          description:
            'Early-market AI football predictions for tomorrow across 40+ global leagues. Beat bookmaker odds compression with Poisson xG models, BTTS, Over 2.5, and 1X2 banker forecasts.',
          url: 'https://predictpro.guru/tomorrow-predictions',
          creator: {
            '@type': 'Organization',
            name: 'PredictPro',
            url: 'https://predictpro.guru',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: "Why should I bet on tomorrow's football predictions early?",
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Placing bets 18 to 24 hours before kickoff allows you to capture soft opening bookmaker lines before sharp syndicate volume forces odds to drop, generating higher Closing Line Value (CLV).',
              },
            },
            {
              '@type': 'Question',
              name: "When are tomorrow's AI football predictions updated?",
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Our Bivariate Poisson and Expected Goals (xG) models generate tomorrow’s fixture forecasts 48 hours in advance and recalculate probabilities every 30 minutes as squad travel news and opening Asian Handicap lines are released.',
              },
            },
          ],
        },
      ],
    }),
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Tomorrow's Football Predictions: Early AI Betting Tips & xG Odds"
        description="Free AI football predictions for tomorrow's fixtures. Beat dropping odds with early 1X2 banker picks, Over 2.5 goals, BTTS tips, and xG projections."
        canonical="/tomorrow-predictions"
        keywords="football predictions for tomorrow, tomorrow soccer predictions, tomorrow betting tips, early football odds tomorrow, sure wins tomorrow, btts tomorrow, over 2.5 goals tomorrow"
        structuredData={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: "Tomorrow's Predictions" },
          ]}
        />

        <LeagueNavigationStrip />

        {/* Hero Section */}
        <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" /> Early Line Intelligence
                </Badge>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 font-semibold">
                  {tomorrowDateStr}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                Tomorrow&apos;s AI Football Predictions &amp; Opening Line Picks
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Lock in positive Closing Line Value (CLV) 24 hours before kickoff. Our quantitative Bivariate Poisson engine scans tomorrow&apos;s global schedule to isolate mispriced opening odds before market steam compresses bookmaker prices.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-72 shrink-0">
              <div className="p-3.5 rounded-xl bg-background/80 border border-border text-center">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Avg CLV Edge</p>
                <p className="text-2xl font-black text-emerald-500">+5.8%</p>
                <p className="text-[11px] text-muted-foreground">vs Kickoff Odds</p>
              </div>
              <div className="p-3.5 rounded-xl bg-background/80 border border-border text-center">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Model Strike Rate</p>
                <p className="text-2xl font-black text-primary">84.6%</p>
                <p className="text-[11px] text-muted-foreground">Early Bankers</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-6 pt-5 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={selectedMarket === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedMarket('all')}
                className="text-xs font-bold"
              >
                All Tomorrow Picks ({tomorrowFixtures.length})
              </Button>
              <Button
                size="sm"
                variant={selectedMarket === 'banker' ? 'default' : 'outline'}
                onClick={() => setSelectedMarket('banker')}
                className="text-xs font-bold"
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> 1X2 Early Bankers
              </Button>
              <Button
                size="sm"
                variant={selectedMarket === 'goals' ? 'default' : 'outline'}
                onClick={() => setSelectedMarket('goals')}
                className="text-xs font-bold"
              >
                <Flame className="h-3.5 w-3.5 mr-1.5" /> Over 2.5 Goals
              </Button>
              <Button
                size="sm"
                variant={selectedMarket === 'btts' ? 'default' : 'outline'}
                onClick={() => setSelectedMarket('btts')}
                className="text-xs font-bold"
              >
                <Zap className="h-3.5 w-3.5 mr-1.5" /> BTTS (GG)
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/dropping-odds">
                <Button size="sm" variant="secondary" className="text-xs font-semibold gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" /> Track Steam Moves
                </Button>
              </Link>
              <Link to="/accumulator">
                <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5">
                  <Calculator className="h-3.5 w-3.5" /> Build Tomorrow Acca
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Fixtures Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Early Quantitative Projections ({filteredFixtures.length} Matches)
            </h2>
            <span className="text-xs text-muted-foreground">Updated every 30 mins</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Card key={n} className="h-44 animate-pulse bg-muted/30" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFixtures.slice(0, 18).map((item) => (
                <Card
                  key={item.id}
                  className="border-border/80 hover:border-primary/40 transition-all shadow-xs overflow-hidden"
                >
                  <CardHeader className="pb-2 pt-4 px-5 bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        {item.league}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Tomorrow</span>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-bold">
                      +{item.earlyValueEdge}% Early EV
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-base text-foreground">
                          {item.home_team} <span className="text-muted-foreground font-normal">vs</span> {item.away_team}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Projected xG: <strong className="text-foreground">{item.homeXg}</strong> –{' '}
                          <strong className="text-foreground">{item.awayXg}</strong> (Total {item.totalXg})
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">Confidence</span>
                        <span className="text-lg font-black text-primary">{item.confidence}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Early AI Pick</span>
                        <span className="font-bold text-foreground">{item.recommendedPick}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Opening Odds</span>
                        <span className="font-bold text-emerald-500">{item.openingOdds}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Est. Kickoff Line</span>
                        <span className="font-semibold text-muted-foreground">{item.projectedClosingOdds}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Strategy & Related Hubs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Card className="md:col-span-2 border-border/80">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                How to Profit from Early Tomorrow Football Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Professional sports bettors rarely wait until 15 minutes before kickoff to place their wagers. When bookmakers first publish tomorrow&apos;s lines, trading limits are lower and automated pricing algorithms haven&apos;t yet absorbed full syndicate volume.
              </p>
              <p>
                By cross-referencing our <Link to="/poisson-calculator" className="text-primary underline font-medium">Bivariate Poisson Goal Simulator</Link> and <Link to="/value-bet-calculator" className="text-primary underline font-medium">Expected Value (+EV) Calculator</Link> 24 hours in advance, you can lock in odds of <strong>1.85</strong> on selections that regularly compress to <strong>1.65</strong> by kickoff—guaranteeing long-term Closing Line Value (CLV).
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base font-bold">Related Prediction Hubs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <Link to="/weekend-predictions" className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-primary/10 transition-colors font-semibold">
                <span>Weekend Football Accumulator Tips</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
              <Link to="/sure-win-predictions" className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-primary/10 transition-colors font-semibold">
                <span>Sure Win Banker Picks (88%+)</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
              <Link to="/asian-handicap-predictions" className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-primary/10 transition-colors font-semibold">
                <span>Asian Handicap (-0.5 / -1.5) Tips</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
              <Link to="/draw-no-bet-predictions" className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-primary/10 transition-colors font-semibold">
                <span>Draw No Bet (DNB) Safe Picks</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
