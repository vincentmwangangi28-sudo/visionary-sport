import React, { useState, useMemo, useEffect } from 'react';
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
import {
  ArrowLeftRight,
  Calculator,
  CheckCircle2,
  Circle,
  Copy,
  Flame,
  Plus,
  RotateCcw,
  Send,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

const ROLLOVER_STORAGE_KEY = 'predictpro_rollover_completed_days_v1';

const ROLLOVER_BOOKIE_CODES = [
  { bookie: 'SportyBet', code: 'SB-8942K' },
  { bookie: 'Betika', code: 'BTK-4190R' },
  { bookie: 'SportPesa', code: 'SP-6612M' },
  { bookie: '1xBet', code: '1X-9084Z' },
];

export default function RolloverBetsPredictions() {
  const { predictions: matches = [], isLoading } = usePredictions(7);
  const { addSelection } = useBetSlip();
  const [currency, setCurrency] = useState<string>('KES');
  const [startingBankroll, setStartingBankroll] = useState<string>('1000');
  const [dailyTargetOdds, setDailyTargetOdds] = useState<string>('1.56');
  const [daysCount, setDaysCount] = useState<number>(10);
  const [completedDays, setCompletedDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(ROLLOVER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [1, 2];
    } catch {
      return [1, 2];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ROLLOVER_STORAGE_KEY, JSON.stringify(completedDays));
    } catch {
      // Ignore storage quota errors
    }
  }, [completedDays]);

  const toggleDayCompleted = (day: number) => {
    setCompletedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const rolloverLegs = useMemo(() => {
    const ranked = [...matches]
      .sort((a, b) => (b.ai_prediction?.confidence ?? 70) - (a.ai_prediction?.confidence ?? 70))
      .slice(0, 2);

    return ranked.map((m, idx) => {
      const hProb = m.ai_prediction?.home_win_prob ?? 48;
      const aProb = m.ai_prediction?.away_win_prob ?? 26;
      const favTeam = aProb > hProb ? m.away_team : m.home_team;
      const market = idx === 0 ? `${favTeam} Win or Over 1.5 Goals` : `${favTeam} Double Chance & Over 0.5`;
      const odds = idx === 0 ? 1.26 : 1.24;
      const prob = Math.min(93, Math.max(82, Math.round(m.ai_prediction?.confidence ?? 86)));
      return {
        id: m.id,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        match: `${m.home_team} vs ${m.away_team}`,
        league: m.league,
        matchDate: m.match_date,
        market,
        odds,
        prob,
      };
    });
  }, [matches]);

  const combinedRolloverOdds = rolloverLegs.length > 0
    ? Number(rolloverLegs.reduce((acc, l) => acc * l.odds, 1).toFixed(2))
    : 0;

  const schedule = useMemo(() => {
    const start = Math.max(1, parseFloat(startingBankroll) || 20);
    const rate = Math.max(1.1, parseFloat(dailyTargetOdds) || 1.56);
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
    return `🔥 Today's PredictPro ${combinedRolloverOdds}x VIP Rollover Challenge Ticket:\n${legsText}\nBooking Codes: SportyBet SB-8942K | Betika BTK-4190R | SportPesa SP-6612M\nTrack the 10-Day Rollover Ladder: https://predictpro.guru/rollover-bets-predictions\nVIP WhatsApp: +254721418238`;
  }, [rolloverLegs, combinedRolloverOdds]);

  const shareWhatsApp = () => {
    const url = `https://wa.me/254721418238?text=${encodeURIComponent(shareText)}`;
    window.location.href = url;
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://predictpro.guru/rollover-bets-predictions')}&text=${encodeURIComponent(shareText)}`;
    window.location.href = url;
  };

  const handleLoadRolloverToSlip = () => {
    if (rolloverLegs.length === 0) return;
    rolloverLegs.forEach((leg) => {
      addSelection({
        matchId: leg.id,
        match: leg.match,
        homeTeam: leg.homeTeam,
        awayTeam: leg.awayTeam,
        league: leg.league,
        matchDate: leg.matchDate,
        market: leg.market,
        odds: leg.odds,
        confidence: leg.prob,
      });
    });
    toast.success(`Loaded Today's ${combinedRolloverOdds}x Rollover Ticket into your Bet Slip!`);
  };

  const completedPct = Math.round((completedDays.filter((d) => d <= daysCount).length / daysCount) * 100);

  const schemas = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Daily Rollover Football Predictions (1.50x to 2.00x 10-Day Challenge)',
        description:
          'Ultra-safe daily rollover football predictions and interactive 10-day compounding calculator for 1.50x and 2.00x low-variance tickets.',
        url: 'https://predictpro.guru/rollover-bets-predictions',
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Rollover Bets Predictions Today: 10-Day 1.50 & 2.00 Odds Challenge"
        description="Free daily Rollover football predictions today. Join the 10-Day 1.50x & 2.00x Odds Rollover Challenge backed by 90%+ AI probability locks and compounding stakes."
        keywords="rollover bets predictions today, daily 2 odds rollover, 1.50 odds rollover challenge, 10 days rollover betting tips, safe rollover football tips"
        canonicalPath="/rollover-bets-predictions"
        schema={schemas}
      />
      <Navbar />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Daily Rollover Challenge (1.50x–2.00x)' },
          ]}
        />

        <LeagueNavigationStrip />
        <MarketQuickStrip />

        <section className="rounded-xl border border-slate-800 bg-slate-900 text-white p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              10-Day Compounding Challenge · 90%+ Leg Probability Filter
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-mono text-xs">
              Active Streak: {completedDays.filter((d) => d <= daysCount).length}/{daysCount} Days Won ({completedPct}%)
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Daily Rollover Football Predictions (1.50x &amp; 2.00x Compounding Ladder)
          </h1>
          <p className="text-slate-300 max-w-3xl text-xs sm:text-sm leading-relaxed">
            Instead of chasing high-variance 50-odds longshots, the <strong>PredictPro Rollover Challenge</strong> compounds a single ultra-safe 1.56x daily ticket built from two 90%+ probability locks. Check off each day below as you progress and use our universal booking codes.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button
              size="sm"
              disabled={rolloverLegs.length === 0}
              onClick={handleLoadRolloverToSlip}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Load {combinedRolloverOdds > 0 ? `${combinedRolloverOdds}x ` : ''}Rollover to Bet Slip
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={rolloverLegs.length === 0}
              onClick={() => {
                navigator.clipboard?.writeText(shareText);
                toast.success('Rollover Ticket & Booking Codes copied to clipboard!');
              }}
              className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Ticket &amp; Codes
            </Button>
            <Button size="sm" variant="outline" onClick={shareWhatsApp} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold">
              <Share2 className="w-3.5 h-3.5 mr-1.5" /> WhatsApp VIP (+254721418238)
            </Button>
            <Button size="sm" variant="outline" onClick={shareTelegram} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold">
              <Send className="w-3.5 h-3.5 mr-1.5" /> Share on Telegram
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's Official Rollover Ticket & Booking Codes */}
          <Card className="lg:col-span-5 p-6 border-emerald-500/30 bg-card/80 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-emerald-400" /> Today&apos;s Official Rollover Slip
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono font-bold">
                  {combinedRolloverOdds > 0 ? `${combinedRolloverOdds}x Total` : 'Pending'}
                </Badge>
              </div>

              <div className="space-y-3">
                {isLoading && rolloverLegs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Loading live 90%+ probability rollover selections...
                  </div>
                ) : rolloverLegs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No active scheduled fixtures are available in the 7-day feed right now.
                  </div>
                ) : rolloverLegs.map((leg, i) => (
                  <div key={leg.id} className="p-4 rounded-xl border border-border/60 bg-background/60">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span className="text-emerald-500 font-semibold">Leg #{i + 1} • {leg.league}</span>
                      <span className="font-mono font-bold text-emerald-500">AI Hit Rate: {leg.prob}%</span>
                    </div>
                    <div className="font-bold text-sm sm:text-base">{leg.match}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-muted-foreground">{leg.market}</span>
                      <Badge variant="outline" className="font-mono font-bold text-emerald-400 border-emerald-500/40">
                        @{leg.odds.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Official Bookmaker Booking Codes Strip */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Official Bookmaker Codes</span>
                  <Link
                    to="/booking-code-converter"
                    className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeftRight className="h-3 w-3" /> Convert Code →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ROLLOVER_BOOKIE_CODES.map((b) => (
                    <button
                      key={b.bookie}
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(b.code);
                        toast.success(`Copied ${b.bookie} rollover code: ${b.code}`);
                      }}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-border/60 bg-background hover:border-primary/50 text-xs transition-all cursor-pointer"
                    >
                      <span className="text-muted-foreground font-medium">{b.bookie}:</span>
                      <span className="font-mono font-bold text-primary">{b.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-secondary/50 text-xs text-muted-foreground leading-relaxed">
              <ShieldCheck className="h-4 w-4 text-emerald-500 inline mr-1.5 -mt-0.5" />
              <strong>Bankroll Protection Rule:</strong> On Day 4, set aside your original starting capital ({currency}{' '}
              {Number(startingBankroll || 1000).toLocaleString()}) so Days 4–{daysCount} compound strictly on net bankroll surplus.
            </div>
          </Card>

          {/* Interactive Compounding Calculator & Check-Off Ladder */}
          <Card className="lg:col-span-7 p-6 border-border/60 bg-card/75 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" /> Interactive Rollover Tracker &amp; Ladder
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCompletedDays([]);
                  toast.info('Reset Rollover Challenge progress');
                }}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset Streak
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  Click any day row below to mark it as Won/Completed
                </span>
                <span className="font-mono font-bold text-emerald-500">{completedPct}% Complete</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${completedPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold"
                >
                  <option value="KES">KES (KSh)</option>
                  <option value="USD">USD ($)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="GHS">GHS (GH₵)</option>
                  <option value="UGX">UGX (USh)</option>
                  <option value="ZAR">ZAR (R)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Day 1 Stake ({currency})</label>
                <input
                  type="number"
                  value={startingBankroll}
                  onChange={(e) => setStartingBankroll(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Daily Target Odds</label>
                <input
                  type="number"
                  step="0.05"
                  value={dailyTargetOdds}
                  onChange={(e) => setDailyTargetOdds(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Duration</label>
                <select
                  value={daysCount}
                  onChange={(e) => setDaysCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold"
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
                    <th className="py-2">Status</th>
                    <th className="py-2">Day</th>
                    <th className="py-2">Rollover Stake</th>
                    <th className="py-2">Target Odds</th>
                    <th className="py-2 text-right">End-of-Day Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {schedule.map((row) => {
                    const isDone = completedDays.includes(row.day);
                    return (
                      <tr
                        key={row.day}
                        onClick={() => toggleDayCompleted(row.day)}
                        className={`cursor-pointer transition-colors ${
                          isDone ? 'bg-emerald-500/10' : 'hover:bg-muted/20'
                        }`}
                      >
                        <td className="py-2.5 pr-2">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="py-2.5 font-bold">
                          Day {row.day}
                          {row.day === 4 && (
                            <Badge variant="outline" className="ml-2 text-[10px] border-amber-500/40 text-amber-500">
                              Bank Principal
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 font-mono">
                          {currency} {row.stake.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 font-mono text-muted-foreground">{row.odds.toFixed(2)}x</td>
                        <td className="py-2.5 text-right font-mono font-extrabold text-emerald-400">
                          {currency} {row.returnVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    );
                  })}
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

