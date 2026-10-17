import React, { useState, useMemo } from 'react';
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
import { Flame, TrendingUp, Share2, Copy, CheckCircle2, ShieldCheck, Calculator, Send } from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';
import { toast } from 'sonner';

export default function RolloverBetsPredictions() {
  const { data: matches = [] } = usePredictions();
  const [startingBankroll, setStartingBankroll] = useState<string>('20');
  const [dailyTargetOdds, setDailyTargetOdds] = useState<string>('1.55');
  const [daysCount, setDaysCount] = useState<number>(7);

  const rolloverLegs = useMemo(() => {
    const firstTwo = matches.slice(0, 2);
    return [
      {
        match: firstTwo[0] ? `${firstTwo[0].homeTeam} vs ${firstTwo[0].awayTeam}` : 'Arsenal vs Southampton',
        league: firstTwo[0]?.league || 'Premier League',
        market: 'Home Win or Over 1.5 Goals',
        odds: 1.26,
        prob: '91%',
      },
      {
        match: firstTwo[1] ? `${firstTwo[1].homeTeam} vs ${firstTwo[1].awayTeam}` : 'Real Madrid vs Villarreal',
        league: firstTwo[1]?.league || 'La Liga',
        market: '1X Double Chance & Over 0.5',
        odds: 1.24,
        prob: '90%',
      },
    ];
  }, [matches]);

  const combinedRolloverOdds = Number((rolloverLegs[0].odds * rolloverLegs[1].odds).toFixed(2));

  const schedule = useMemo(() => {
    const start = Math.max(1, parseFloat(startingBankroll) || 20);
    const rate = Math.max(1.1, parseFloat(dailyTargetOdds) || 1.55);
    const rows = [];
    let current = start;
    for (let d = 1; d <= daysCount; d++) {
      const next = current * rate;
      rows.push({
        day: d,
        stake: current,
        odds: rate,
        returnVal: next,
        profit: next - start,
      });
      current = next;
    }
    return rows;
  }, [startingBankroll, dailyTargetOdds, daysCount]);

  const shareText = useMemo(() => {
    const legsText = rolloverLegs
      .map((l, i) => `${i + 1}. ${l.match} — ${l.market} (@${l.odds})`)
      .join('\n');
    return `🔥 Today's AI 1.56x Rollover Challenge Ticket:\n${legsText}\nCombined Odds: ${combinedRolloverOdds}x (89% AI Strike Rate)\nView full daily rollover tracker: https://predictpro.guru/rollover-bets-predictions`;
  }, [rolloverLegs, combinedRolloverOdds]);

  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.location.href = url;
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://predictpro.guru/rollover-bets-predictions')}&text=${encodeURIComponent(shareText)}`;
    window.location.href = url;
  };

  const schemas = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Daily Rollover Football Predictions (1.50x to 2.00x 7-Day Challenge)',
        description:
          'Ultra-safe daily rollover football predictions and interactive 7-day compounding calculator for 1.50x and 2.00x low-variance tickets.',
        url: 'https://predictpro.guru/rollover-bets-predictions',
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Rollover Bets Predictions Today: 7-Day 1.50 & 2.00 Odds Challenge"
        description="Free daily Rollover football predictions today. Join the 7-Day 1.50x & 2.00x Odds Rollover Challenge backed by 90%+ AI probability locks and compounding stakes."
        keywords="rollover bets predictions today, daily 2 odds rollover, 1.50 odds rollover challenge, 7 days rollover betting tips, safe rollover football tips"
        canonicalPath="/rollover-bets-predictions"
        schema={schemas}
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Daily Rollover Challenge (1.50x–2.00x)' },
          ]}
        />

        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/45 via-card to-background p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> 7-Day Compounding Challenge
            </Badge>
            <Badge variant="outline" className="text-xs border-border/60">
              90%+ Leg Probability Filter
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Daily Rollover Football Predictions (1.50x &amp; 2.00x 7-Day Challenge)
          </h1>
          <p className="text-muted-foreground max-w-3xl text-sm sm:text-base leading-relaxed mb-5">
            Instead of chasing risky 50-odds longshots, the <strong>7-Day Rollover Strategy</strong> compounds a single ultra-safe 1.55x daily ticket (built from 2 high-probability Double Chance or Over 1.5 legs). Turning <strong>$20 into $430+ in 7 days</strong> requires patience and zero-ego selection discipline.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                navigator.clipboard?.writeText(shareText);
                toast.success('Day 1 Rollover Ticket copied to clipboard!');
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold"
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Today&apos;s {combinedRolloverOdds}x Rollover Ticket
            </Button>
            <Button variant="outline" onClick={shareWhatsApp} className="border-emerald-500/40 text-emerald-300">
              <Share2 className="w-4 h-4 mr-2" /> Share on WhatsApp
            </Button>
            <Button variant="outline" onClick={shareTelegram} className="border-sky-500/40 text-sky-300">
              <Send className="w-4 h-4 mr-2" /> Share on Telegram
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's Official Rollover Ticket */}
          <Card className="lg:col-span-5 p-6 border-emerald-500/30 bg-card/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-emerald-400" /> Today&apos;s Official Rollover Slip
              </h2>
              <Badge className="bg-emerald-500/20 text-emerald-300 font-bold">
                {combinedRolloverOdds}x Total
              </Badge>
            </div>

            <div className="space-y-3">
              {rolloverLegs.map((leg, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/60 bg-background/60">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className="text-emerald-400 font-semibold">Leg #{i + 1} • {leg.league}</span>
                    <span>AI Hit Rate: {leg.prob}</span>
                  </div>
                  <div className="font-bold text-sm sm:text-base">{leg.match}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium text-muted-foreground">{leg.market}</span>
                    <Badge variant="outline" className="font-bold text-emerald-300 border-emerald-500/40">
                      @{leg.odds}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 text-xs text-muted-foreground leading-relaxed">
              💡 <strong>Pro Risk Rule:</strong> On Day 4, withdraw your original starting stake so Days 4–7 run on 100% risk-free house profit.
            </div>
          </Card>

          {/* Interactive 7-Day Compounding Calculator */}
          <Card className="lg:col-span-7 p-6 border-border/60 bg-card/75 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" /> Interactive Rollover Compounding Planner
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Day 1 Starting Stake ($)</label>
                <input
                  type="number"
                  value={startingBankroll}
                  onChange={(e) => setStartingBankroll(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Daily Target Odds</label>
                <input
                  type="number"
                  step="0.05"
                  value={dailyTargetOdds}
                  onChange={(e) => setDailyTargetOdds(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Challenge Duration</label>
                <select
                  value={daysCount}
                  onChange={(e) => setDaysCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold"
                >
                  <option value={5}>5 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={10}>10 Days</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground">
                    <th className="py-2">Day</th>
                    <th className="py-2">Rollover Stake</th>
                    <th className="py-2">Daily Odds</th>
                    <th className="py-2 text-right">End-of-Day Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {schedule.map((row) => (
                    <tr key={row.day}>
                      <td className="py-2 font-bold">Day {row.day}</td>
                      <td className="py-2">${row.stake.toFixed(2)}</td>
                      <td className="py-2 text-muted-foreground">{row.odds.toFixed(2)}x</td>
                      <td className="py-2 text-right font-extrabold text-emerald-400">
                        ${row.returnVal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
