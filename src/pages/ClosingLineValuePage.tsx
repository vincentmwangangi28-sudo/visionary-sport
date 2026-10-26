import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  ArrowDownRight,
  Calculator,
  Check,
  Copy,
  Flame,
  Plus,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  getClvSteamSignals,
  calculateNoVigClv,
  ClvSteamSignal,
} from '@/services/clvAndCopulaService';
import { ADMIN_SYNC_EVENT } from '@/services/adminOverrideSyncService';
import { syncSlipToBankroll } from '@/services/socialCardPngGenerator';
import { useAppLocale } from '@/services/i18nLocalizationService';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

export const ClosingLineValuePage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const { t } = useAppLocale();
  const [signals, setSignals] = useState<ClvSteamSignal[]>(() => getClvSteamSignals());
  const [filterTag, setFilterTag] = useState<string>('ALL');

  // Interactive No-Vig CLV Calculator state
  const [betOddsTaken, setBetOddsTaken] = useState<number>(2.05);
  const [closingOddsSideA, setClosingOddsSideA] = useState<number>(1.82);
  const [closingOddsSideB, setClosingOddsSideB] = useState<number>(2.04);
  const [stakeAmount, setStakeAmount] = useState<number>(50);

  useEffect(() => {
    const syncHandler = () => {
      setSignals(getClvSteamSignals());
    };
    window.addEventListener(ADMIN_SYNC_EVENT, syncHandler);
    return () => window.removeEventListener(ADMIN_SYNC_EVENT, syncHandler);
  }, []);

  const filteredSignals = useMemo(() => {
    return signals.filter((s) => {
      if (filterTag === 'ALL') return true;
      if (filterTag === 'AFRICA') return s.region === 'Africa / CAF';
      return s.movementTag === filterTag;
    });
  }, [signals, filterTag]);

  const clvCalcResult = useMemo(() => {
    return calculateNoVigClv({
      betOddsTaken,
      closingOddsSideA,
      closingOddsSideB,
      stakeAmount,
    });
  }, [betOddsTaken, closingOddsSideA, closingOddsSideB, stakeAmount]);

  const handleAddClvPlayToSlip = (item: ClvSteamSignal) => {
    addSelection({
      id: `${item.id}-${Date.now()}`,
      matchId: item.id,
      match: `${item.homeTeam} vs ${item.awayTeam}`,
      homeTeam: item.homeTeam,
      awayTeam: item.awayTeam,
      league: item.league,
      kickoff: item.kickoffLabel,
      market: item.market,
      selection: item.market,
      odds: item.currentBookieOdds,
      confidence: Math.round(item.modelProbabilityPct),
    });
    toast.success(
      `Added +${item.clvBeatPct}% CLV Play (${item.homeTeam} vs ${item.awayTeam}) to Bet Slip!`
    );
  };

  const handleSyncClvToBankroll = (item: ClvSteamSignal) => {
    syncSlipToBankroll({
      source: 'CLV_SCANNER',
      bookmaker: 'Pinnacle / SportyBet / 1xBet',
      bookingCode: `CLV-${Math.floor(1000 + Math.random() * 9000)}`,
      totalOdds: item.currentBookieOdds,
      suggestedStake: 25,
      kellyPct: 2.5,
      legs: [
        {
          match: `${item.homeTeam} vs ${item.awayTeam}`,
          market: item.market,
          odds: item.currentBookieOdds,
        },
      ],
    });
    toast.success(`Logged ${item.market} (+${item.clvBeatPct}% CLV) to Bankroll Portfolio!`);
  };

  const handleLoadTop3ClvAcca = () => {
    const top3 = [...signals].sort((a, b) => b.clvBeatPct - a.clvBeatPct).slice(0, 3);
    top3.forEach((item) => {
      addSelection({
        id: `${item.id}-acca`,
        matchId: item.id,
        match: `${item.homeTeam} vs ${item.awayTeam}`,
        homeTeam: item.homeTeam,
        awayTeam: item.awayTeam,
        league: item.league,
        kickoff: item.kickoffLabel,
        market: item.market,
        selection: item.market,
        odds: item.currentBookieOdds,
        confidence: Math.round(item.modelProbabilityPct),
      });
    });
    toast.success('Loaded Top 3 Positive-CLV Syndicate Steam Picks into Bet Slip!');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Closing Line Value (CLV) & Sharp Syndicate Steam Scanner | PredictPro"
        description="Track Opening vs. Current vs. Pinnacle No-Vig Sharp Odds, Reverse Line Movement (RLM), and Positive Closing Line Value (CLV) edges across global football."
      />
      <Navbar />

      <main
        id="main-content"
        className="flex-1 container mx-auto max-w-7xl px-4 pt-6 pb-24 space-y-6"
      >
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Dropping Odds', href: '/dropping-odds' },
            { label: 'Closing Line Value (CLV) & Steam Scanner' },
          ]}
        />

        {/* Hero Header */}
        <section className="rounded-2xl border border-emerald-500/30 bg-slate-950 text-white p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-[11px]">
                  100% FREE INSTITUTIONAL CLV TERMINAL
                </Badge>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  30-Day Model CLV Beat Rate: 84.2% (+6.8% Avg Closing Edge)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {t.clvScannerTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Beating the <strong>No-Vig Closing Line</strong> is the single gold-standard metric of long-term sports betting profitability. This scanner detects fixtures where Asian syndicates and Pinnacle sharp action have steamed the true line, while recreational bookmakers (SportyBet, 1xBet, Bet9ja, Betway) are still hanging stale, high-value prices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={handleLoadTop3ClvAcca}
                className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-9"
              >
                <Zap className="h-4 w-4" />
                Load Top 3 +CLV Treble
              </Button>
              <Link to="/sgp-builder">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs font-semibold bg-slate-900 border-slate-700 text-white hover:bg-slate-800 h-9"
                >
                  <Activity className="h-4 w-4 text-emerald-400" />
                  SGP Copula Builder &rarr;
                </Button>
              </Link>
            </div>
          </div>

          {/* Filter Strip */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
            {[
              { id: 'ALL', label: `All Sharp CLV Plays (${signals.length})` },
              { id: 'SYNDICATE STEAM', label: 'Syndicate Steam (>14% Drop)' },
              { id: 'REVERSE LINE (RLM)', label: 'Reverse Line Movement (RLM)' },
              { id: 'POISSON CLV EDGE', label: 'Poisson Fair-Line Discrepancy' },
              { id: 'AFRICA', label: 'Africa / CAF / FKF Sharp Lines' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTag(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterTag === tab.id
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Live CLV & Steam Signal Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSignals.map((item) => (
            <Card
              key={item.id}
              className="border-border hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono text-emerald-500 border-emerald-500/30"
                    >
                      {item.movementTag}
                    </Badge>
                    <span>{item.league}</span>
                    <span>·</span>
                    <span className="font-mono">{item.kickoffLabel}</span>
                  </div>
                  <span className="font-mono tabular-nums font-black text-emerald-500 text-xs">
                    +{item.clvBeatPct.toFixed(1)}% CLV EDGE
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TeamLogo team={item.homeTeam} size="sm" />
                    <span className="font-black text-base text-foreground truncate">
                      {item.homeTeam}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold">vs</span>
                    <TeamLogo team={item.awayTeam} size="sm" />
                    <span className="font-black text-base text-foreground truncate">
                      {item.awayTeam}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">{item.market}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 pt-0">
                {/* 4-Column Opening vs Soft Bookie vs Sharp Pinnacle vs Poisson Fair Line */}
                <div className="grid grid-cols-4 gap-2 text-center bg-muted/40 p-2.5 rounded-xl border border-border/60 font-mono tabular-nums">
                  <div>
                    <span className="text-[10px] font-sans text-muted-foreground block">
                      Opening Line
                    </span>
                    <span className="text-sm font-bold text-muted-foreground line-through">
                      {item.openingOdds.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-emerald-500 font-semibold block">
                      Soft Bookie Now
                    </span>
                    <span className="text-sm font-black text-emerald-500">
                      {item.currentBookieOdds.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-muted-foreground block">
                      Sharp No-Vig
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {item.sharpPinnacleNoVigOdds.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans text-primary font-semibold block">
                      Poisson Fair
                    </span>
                    <span className="text-sm font-black text-primary">
                      {item.modelFairOdds.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Sharp Money vs Public Ticket Split Bar */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[11px] font-mono tabular-nums">
                    <span className="text-emerald-500 font-bold">
                      Sharp Syndicate Money: {item.sharpMoneyVolumePct}%
                    </span>
                    <span className="text-amber-500 font-semibold flex items-center gap-1">
                      <ArrowDownRight className="h-3.5 w-3.5" />
                      Steam Drop: -{item.steamDropPct}%
                    </span>
                    <span className="text-muted-foreground">
                      Public Tickets: {item.publicTicketsPct}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${item.sharpMoneyVolumePct}%` }}
                    />
                    <div
                      className="bg-slate-600 h-full"
                      style={{ width: `${100 - item.sharpMoneyVolumePct}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.tacticalNote}
                </p>

                <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono tabular-nums text-muted-foreground">
                    True Win Prob: <strong className="text-foreground">{item.modelProbabilityPct}%</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSyncClvToBankroll(item)}
                      className="h-8 text-xs gap-1"
                    >
                      <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                      Log CLV
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAddClvPlayToSlip(item)}
                      className="h-8 text-xs font-bold gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Bet @ {item.currentBookieOdds.toFixed(2)}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Interactive No-Vig Closing Line Value (CLV) Calculator */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Interactive No-Vig Closing Line Value (CLV) &amp; Expected ROI Calculator
            </CardTitle>
            <CardDescription className="text-xs">
              Strip out bookmaker overround (vig) from any 2-way closing market to verify your true mathematical edge.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Odds You Took</label>
                <input
                  type="number"
                  step="0.01"
                  value={betOddsTaken}
                  onChange={(e) => setBetOddsTaken(Number(e.target.value) || 1.5)}
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border font-mono tabular-nums text-xs text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Closing Odds (Your Side)</label>
                <input
                  type="number"
                  step="0.01"
                  value={closingOddsSideA}
                  onChange={(e) => setClosingOddsSideA(Number(e.target.value) || 1.5)}
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border font-mono tabular-nums text-xs text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Closing Odds (Other Side)</label>
                <input
                  type="number"
                  step="0.01"
                  value={closingOddsSideB}
                  onChange={(e) => setClosingOddsSideB(Number(e.target.value) || 1.5)}
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border font-mono tabular-nums text-xs text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Stake ($ / KES)</label>
                <input
                  type="number"
                  step="5"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value) || 10)}
                  className="w-full h-9 px-3 rounded-lg bg-muted/50 border border-border font-mono tabular-nums text-xs text-foreground"
                />
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-3 gap-2.5 text-center font-mono tabular-nums p-3.5 rounded-xl bg-muted/40 border border-border">
              <div>
                <span className="text-[10px] font-sans text-muted-foreground block">
                  No-Vig Fair Odds
                </span>
                <span className="text-base font-black text-foreground">
                  {clvCalcResult.trueNoVigFairOdds.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  ({clvCalcResult.trueNoVigProbPct}%)
                </span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-muted-foreground block">
                  True CLV Edge
                </span>
                <span
                  className={`text-base font-black ${
                    clvCalcResult.isPositiveClv ? 'text-emerald-500' : 'text-rose-500'
                  }`}
                >
                  {clvCalcResult.clvEdgePct >= 0 ? '+' : ''}
                  {clvCalcResult.clvEdgePct}%
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Vig: {clvCalcResult.bookieMarginPct}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-muted-foreground block">
                  Expected EV Profit
                </span>
                <span
                  className={`text-base font-black ${
                    clvCalcResult.expectedLongTermProfitPerBet >= 0
                      ? 'text-emerald-500'
                      : 'text-rose-500'
                  }`}
                >
                  {clvCalcResult.expectedLongTermProfitPerBet >= 0 ? '+' : ''}
                  {clvCalcResult.expectedLongTermProfitPerBet}
                </span>
                <span className="text-[10px] text-muted-foreground block">Per Bet</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ClosingLineValuePage;
