import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Percent, Scale } from 'lucide-react';

export default function MarginCalculator() {
  const [mode, setMode] = useState<'3way' | '2way'>('3way');
  const [homeOdds, setHomeOdds] = useState<string>('1.95');
  const [drawOdds, setDrawOdds] = useState<string>('3.50');
  const [awayOdds, setAwayOdds] = useState<string>('3.80');

  const result = useMemo(() => {
    const o1 = Math.max(1.01, parseFloat(homeOdds) || 2.0);
    const oX = Math.max(1.01, parseFloat(drawOdds) || 3.2);
    const o2 = Math.max(1.01, parseFloat(awayOdds) || 2.0);

    const p1 = 1 / o1;
    const pX = mode === '3way' ? 1 / oX : 0;
    const p2 = 1 / o2;
    const overround = p1 + pX + p2;
    const marginPercent = (overround - 1) * 100;

    // Proportional No-Vig Fair Probabilities & Fair Odds
    const fairP1 = p1 / overround;
    const fairPX = mode === '3way' ? pX / overround : 0;
    const fairP2 = p2 / overround;

    return {
      marginPercent: marginPercent.toFixed(2),
      overroundPercent: (overround * 100).toFixed(2),
      fairProb1: (fairP1 * 100).toFixed(2),
      fairProbX: (fairPX * 100).toFixed(2),
      fairProb2: (fairP2 * 100).toFixed(2),
      fairOdds1: (1 / fairP1).toFixed(2),
      fairOddsX: mode === '3way' ? (1 / fairPX).toFixed(2) : '-',
      fairOdds2: (1 / fairP2).toFixed(2),
    };
  }, [mode, homeOdds, drawOdds, awayOdds]);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Bookmaker Margin, Overround & No-Vig Fair Odds Calculator',
      applicationCategory: 'SportsApplication',
      operatingSystem: 'All',
      url: 'https://predictpro.guru/margin-calculator',
      description:
        'Free sportsbook margin (overround / vig / juice) calculator. Strip bookmaker commission from 2-way and 3-way football odds to reveal true no-vig fair odds.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    }),
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Bookmaker Margin & No-Vig Fair Odds Calculator (Overround Tool)"
        description="Free bookmaker margin, overround, and no-vig fair odds calculator. Remove sportsbook vig from 1X2 and Over/Under lines to find true market probabilities."
        canonical="/margin-calculator"
        keywords="bookmaker margin calculator, no vig fair odds calculator, overround calculator football, sportsbook juice calculator, remove vig calculator"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Bookmaker Margin & No-Vig Calculator' },
          ]}
        />

        <div className="space-y-3">
          <Badge className="bg-primary text-primary-foreground font-bold">
            <Percent className="h-3.5 w-3.5 mr-1.5" /> Sharp Pricing De-Vigger
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Bookmaker Margin (Overround) &amp; No-Vig Fair Odds Calculator
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
            Every sportsbook embeds a hidden commission (Overround or Vig) into their odds. Enter 1X2 or 2-way market prices below to measure the bookmaker&apos;s exact hold percentage and strip out the vig to reveal <strong>True No-Vig Fair Odds</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/80">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Bookmaker Market Odds</CardTitle>
                <CardDescription className="text-xs">Select 3-Way (1X2) or 2-Way (O/U, AH)</CardDescription>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant={mode === '3way' ? 'default' : 'outline'}
                  onClick={() => setMode('3way')}
                  className="text-xs font-bold h-8"
                >
                  3-Way
                </Button>
                <Button
                  size="sm"
                  variant={mode === '2way' ? 'default' : 'outline'}
                  onClick={() => setMode('2way')}
                  className="text-xs font-bold h-8"
                >
                  2-Way
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="m-odds-1" className="text-xs font-semibold">
                    {mode === '3way' ? 'Home (1)' : 'Side A'}
                  </Label>
                  <Input
                    id="m-odds-1"
                    type="number"
                    step="0.02"
                    value={homeOdds}
                    onChange={(e) => setHomeOdds(e.target.value)}
                    className="font-mono"
                  />
                </div>
                {mode === '3way' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="m-odds-x" className="text-xs font-semibold">
                      Draw (X)
                    </Label>
                    <Input
                      id="m-odds-x"
                      type="number"
                      step="0.02"
                      value={drawOdds}
                      onChange={(e) => setDrawOdds(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="m-odds-2" className="text-xs font-semibold">
                    {mode === '3way' ? 'Away (2)' : 'Side B'}
                  </Label>
                  <Input
                    id="m-odds-2"
                    type="number"
                    step="0.02"
                    value={awayOdds}
                    onChange={(e) => setAwayOdds(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-muted/15">
            <CardHeader>
              <CardTitle className="text-lg font-bold">True No-Vig Fair Prices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-background border border-primary/30">
                  <span className="text-[11px] text-muted-foreground block">Bookmaker Margin (Vig)</span>
                  <span className="text-2xl font-black font-mono text-primary">{result.marginPercent}%</span>
                </div>
                <div className="p-3.5 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-muted-foreground block">Total Overround Book</span>
                  <span className="text-2xl font-black font-mono text-foreground">{result.overroundPercent}%</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-background border border-border text-xs">
                <div>
                  <span className="text-muted-foreground block">Fair Home (1)</span>
                  <span className="font-black text-base font-mono text-emerald-500">@{result.fairOdds1}</span>
                  <span className="text-[11px] text-muted-foreground block">{result.fairProb1}%</span>
                </div>
                {mode === '3way' && (
                  <div>
                    <span className="text-muted-foreground block">Fair Draw (X)</span>
                    <span className="font-black text-base font-mono text-emerald-500">@{result.fairOddsX}</span>
                    <span className="text-[11px] text-muted-foreground block">{result.fairProbX}%</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block">Fair Away (2)</span>
                  <span className="font-black text-base font-mono text-emerald-500">@{result.fairOdds2}</span>
                  <span className="text-[11px] text-muted-foreground block">{result.fairProb2}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
