import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeftRight, Percent, DollarSign } from 'lucide-react';

function gcd(a: number, b: number): number {
  return b < 0.01 ? a : gcd(b, a % b);
}

function decimalToFractional(dec: number): string {
  if (dec <= 1.01) return '1/100';
  const net = dec - 1;
  const denom = 100;
  const num = Math.round(net * denom);
  const divisor = Math.round(gcd(num, denom)) || 1;
  return `${Math.round(num / divisor)}/${Math.round(denom / divisor)}`;
}

function decimalToAmerican(dec: number): string {
  if (dec >= 2.0) {
    return `+${Math.round((dec - 1) * 100)}`;
  }
  if (dec <= 1.01) return '-10000';
  return `${Math.round(-100 / (dec - 1))}`;
}

export default function OddsConverter() {
  const [decimalOdds, setDecimalOdds] = useState<string>('2.10');
  const [wagerStake, setWagerStake] = useState<string>('100');

  const conversions = useMemo(() => {
    const dec = Math.max(1.01, parseFloat(decimalOdds) || 2.0);
    const stake = Math.max(1, parseFloat(wagerStake) || 100);
    const impliedProb = (1 / dec) * 100;
    const fractional = decimalToFractional(dec);
    const american = decimalToAmerican(dec);
    const hongKong = (dec - 1).toFixed(2);
    const totalPayout = (stake * dec).toFixed(2);
    const netProfit = (stake * (dec - 1)).toFixed(2);

    return {
      dec: dec.toFixed(2),
      impliedProb: impliedProb.toFixed(2),
      fractional,
      american,
      hongKong,
      totalPayout,
      netProfit,
    };
  }, [decimalOdds, wagerStake]);

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Betting Odds Converter & Implied Probability Calculator',
      applicationCategory: 'SportsApplication',
      operatingSystem: 'All',
      url: 'https://predictpro.guru/odds-converter',
      description:
        'Convert Decimal, Fractional (UK), American (Moneyline), and Hong Kong betting odds into true Implied Probability (%) and payout returns.',
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
        title="Betting Odds Converter & Implied Probability Calculator (UK/US/EU)"
        description="Free sports betting odds converter and implied probability calculator. Instantly convert Decimal, Fractional (UK), American Moneyline, and implied win percentages."
        canonical="/odds-converter"
        keywords="betting odds converter, implied probability calculator, fractional to decimal odds, american moneyline converter, sports betting payout calculator"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Odds Converter & Implied Probability' },
          ]}
        />

        <div className="space-y-3">
          <Badge className="bg-primary text-primary-foreground font-bold">
            <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" /> Universal Odds Utility
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Betting Odds Converter &amp; Implied Probability Calculator
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
            Instantly translate European Decimal odds, UK Fractional prices, US Moneyline odds, and true Implied Win Probability (%) to compare value across global sportsbooks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Enter Odds &amp; Stake</CardTitle>
              <CardDescription className="text-xs">
                Adjust decimal odds or stake size to view all global formats and exact payouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="dec-input" className="text-xs font-bold">
                  Decimal Odds (EU / Global)
                </Label>
                <Input
                  id="dec-input"
                  type="number"
                  step="0.05"
                  min="1.01"
                  value={decimalOdds}
                  onChange={(e) => setDecimalOdds(e.target.value)}
                  className="font-mono font-bold text-lg"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stake-input" className="text-xs font-bold">
                  Wager Stake ($)
                </Label>
                <Input
                  id="stake-input"
                  type="number"
                  step="10"
                  min="1"
                  value={wagerStake}
                  onChange={(e) => setWagerStake(e.target.value)}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-muted/15">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Converted Formats &amp; Implied Win %</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-background border border-primary/30">
                  <span className="text-[11px] text-muted-foreground block">Implied Probability</span>
                  <span className="text-2xl font-black font-mono text-primary">{conversions.impliedProb}%</span>
                </div>
                <div className="p-3.5 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-muted-foreground block">US Moneyline Odds</span>
                  <span className="text-2xl font-black font-mono text-foreground">{conversions.american}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-muted-foreground block">UK Fractional Odds</span>
                  <span className="text-xl font-black font-mono text-foreground">{conversions.fractional}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-muted-foreground block">Hong Kong Odds</span>
                  <span className="text-xl font-black font-mono text-foreground">{conversions.hongKong}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block">Net Profit</span>
                  <span className="text-xl font-black font-mono text-emerald-500">+${conversions.netProfit}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Total Payout (Incl. Stake)</span>
                  <span className="text-xl font-black font-mono text-foreground">${conversions.totalPayout}</span>
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
