import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ArrowDownRight,
  BarChart3,
  Calculator,
  Flame,
  Plus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

interface SharpSplitFixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  region: 'Europe' | 'Africa / CAF' | 'Americas';
  kickoff: string;
  marketAnalyzed: string;
  publicSideLabel: string;
  sharpSideLabel: string;
  publicTicketsPct: number; // % of total bet slips on public side
  sharpMoneyHandlePct: number; // % of total cash volume on sharp side
  openingSharpOdds: number;
  currentSharpOdds: number;
  signalType: 'RLM TRAP ALERT' | 'SYNDICATE STEAM' | 'CONTRA VALUE';
  aiConfidence: number;
  sharpAnalysis: string;
}

const SHARP_SPLITS_DATA: SharpSplitFixture[] = [
  {
    id: 'sharp-che-ars',
    homeTeam: 'Chelsea',
    awayTeam: 'Arsenal',
    league: 'Premier League',
    region: 'Europe',
    kickoff: 'Sun 16:30',
    marketAnalyzed: 'Match Winner / Asian Handicap',
    publicSideLabel: 'Chelsea +0.5 (74% Public Tickets)',
    sharpSideLabel: 'Arsenal To Win (2)',
    publicTicketsPct: 74,
    sharpMoneyHandlePct: 81,
    openingSharpOdds: 2.28,
    currentSharpOdds: 1.96,
    signalType: 'RLM TRAP ALERT',
    aiConfidence: 87,
    sharpAnalysis:
      '74% of retail bet slips are backing Chelsea at home, yet Arsenal’s odds have tumbled from 2.28 to 1.96 due to 81% of institutional syndicate volume hitting Arsenal.',
  },
  {
    id: 'sharp-bvb-bay',
    homeTeam: 'Borussia Dortmund',
    awayTeam: 'Bayern Munich',
    league: 'Bundesliga',
    region: 'Europe',
    kickoff: 'Sat 17:30',
    marketAnalyzed: 'Total Goals (Over/Under 3.5)',
    publicSideLabel: 'Over 3.5 Goals (79% Public Tickets)',
    sharpSideLabel: 'Under 3.5 Goals',
    publicTicketsPct: 79,
    sharpMoneyHandlePct: 73,
    openingSharpOdds: 1.92,
    currentSharpOdds: 1.74,
    signalType: 'RLM TRAP ALERT',
    aiConfidence: 84,
    sharpAnalysis:
      'Public bettors automatically bet Over 3.5 in Der Klassiker, but sharp syndicates have hammered Under 3.5 Goals based on both managers deploying double-pivot midfield blocks.',
  },
  {
    id: 'sharp-gor-afc',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    league: 'FKF Premier League',
    region: 'Africa / CAF',
    kickoff: 'Sun 15:00',
    marketAnalyzed: '1X2 & Under 2.5 Correlated',
    publicSideLabel: 'BTTS — Yes (68% Public Tickets)',
    sharpSideLabel: 'Gor Mahia Win & Under 3.5 Goals',
    publicTicketsPct: 68,
    sharpMoneyHandlePct: 78,
    openingSharpOdds: 2.15,
    currentSharpOdds: 1.88,
    signalType: 'SYNDICATE STEAM',
    aiConfidence: 86,
    sharpAnalysis:
      'Heavy Nairobi high-roller handle is backing Gor Mahia’s defensive structure (0.58 xGA/90) to shut down AFC Leopards in a controlled 1-0 or 2-0 victory.',
  },
  {
    id: 'sharp-simba-yanga',
    homeTeam: 'Simba SC',
    awayTeam: 'Young Africans',
    league: 'Tanzania NBC Premier League',
    region: 'Africa / CAF',
    kickoff: 'Sat 16:00',
    marketAnalyzed: 'Draw No Bet (DNB)',
    publicSideLabel: 'Simba SC Home Win (71% Public Tickets)',
    sharpSideLabel: 'Young Africans Draw No Bet (2 DNB)',
    publicTicketsPct: 71,
    sharpMoneyHandlePct: 76,
    openingSharpOdds: 1.95,
    currentSharpOdds: 1.72,
    signalType: 'RLM TRAP ALERT',
    aiConfidence: 85,
    sharpAnalysis:
      'Despite 71% of public accumulator tickets taking Simba SC, Young Africans (Yanga) have received 76% of the cash handle on the Draw No Bet line.',
  },
  {
    id: 'sharp-kc-op',
    homeTeam: 'Kaizer Chiefs',
    awayTeam: 'Orlando Pirates',
    league: 'South Africa PSL',
    region: 'Africa / CAF',
    kickoff: 'Sat 15:30',
    marketAnalyzed: 'Double Chance / Match Result',
    publicSideLabel: 'Kaizer Chiefs 1X (69% Public Tickets)',
    sharpSideLabel: 'Orlando Pirates Draw No Bet (2 DNB)',
    publicTicketsPct: 69,
    sharpMoneyHandlePct: 79,
    openingSharpOdds: 1.84,
    currentSharpOdds: 1.66,
    signalType: 'SYNDICATE STEAM',
    aiConfidence: 84,
    sharpAnalysis:
      'Soweto Derby sentiment inflates Kaizer Chiefs ticket counts, while quantitative models and sharp money back Pirates’ +0.62 net xG/90 superiority.',
  },
  {
    id: 'sharp-int-juv',
    homeTeam: 'Inter Milan',
    awayTeam: 'Juventus',
    league: 'Serie A',
    region: 'Europe',
    kickoff: 'Sun 19:45',
    marketAnalyzed: 'First Half Total Goals',
    publicSideLabel: '1H Over 1.5 Goals (76% Public Tickets)',
    sharpSideLabel: 'First Half Under 1.0 / Draw HT',
    publicTicketsPct: 76,
    sharpMoneyHandlePct: 74,
    openingSharpOdds: 2.05,
    currentSharpOdds: 1.82,
    signalType: 'CONTRA VALUE',
    aiConfidence: 82,
    sharpAnalysis:
      'Derby d’Italia first halves average just 0.68 xG over the last 6 meetings; sharp syndicates are fading the public’s early-goal expectation.',
  },
];

export const SharpMoneySplitsPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [filterSignal, setFilterSignal] = useState<string>('ALL');
  const [simPublicPct, setSimPublicPct] = useState<number>(75);
  const [simMoneyPct, setSimMoneyPct] = useState<number>(28); // money on the public side (meaning 72% sharp money is on the opposite side!)
  const [simOpenOdds, setSimOpenOdds] = useState<number>(2.15);
  const [simCurrOdds, setSimCurrOdds] = useState<number>(1.88);

  const filteredSplits = useMemo(() => {
    if (filterSignal === 'ALL') return SHARP_SPLITS_DATA;
    if (filterSignal === 'AFRICA') return SHARP_SPLITS_DATA.filter((f) => f.region === 'Africa / CAF');
    return SHARP_SPLITS_DATA.filter((f) => f.signalType === filterSignal);
  }, [filterSignal]);

  // Interactive RLM & Sharp Discrepancy Calculator
  const rlmCalculation = useMemo(() => {
    const contraSharpHandlePct = 100 - simMoneyPct;
    const handleGap = simPublicPct - simMoneyPct; // e.g., 75% tickets - 28% money = +47% sharp divergence
    const impliedOpen = (1 / simOpenOdds) * 100;
    const impliedCurr = (1 / simCurrOdds) * 100;
    const steamShiftPct = Math.max(0, impliedCurr - impliedOpen);
    const rlmScore = Math.min(99, Math.max(15, Math.round(handleGap * 1.15 + steamShiftPct * 2.8)));

    let verdict = 'NEUTRAL MARKET FLOW';
    if (rlmScore >= 75) verdict = 'EXTREME RLM TRAP — FADE PUBLIC IMMEDIATELY';
    else if (rlmScore >= 55) verdict = 'MODERATE SHARP DIVERGENCE — CONTRARIAN EDGE';

    return {
      contraSharpHandlePct,
      handleGap,
      steamShiftPct: steamShiftPct.toFixed(1),
      rlmScore,
      verdict,
    };
  }, [simPublicPct, simMoneyPct, simOpenOdds, simCurrOdds]);

  const handleLoadSharpAcca = () => {
    SHARP_SPLITS_DATA.slice(0, 3).forEach((item) => {
      addSelection({
        matchId: item.id,
        match: `${item.homeTeam} vs ${item.awayTeam}`,
        homeTeam: item.homeTeam,
        awayTeam: item.awayTeam,
        league: item.league,
        matchDate: new Date().toISOString(),
        market: item.sharpSideLabel,
        odds: item.currentSharpOdds,
        confidence: item.aiConfidence,
      });
    });
    toast.success('Loaded Top 3 Sharp Syndicate & RLM Picks into your Bet Slip!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Sharp Money, Public Betting Splits & Reverse Line Movement (RLM) Scanner | PredictPro"
        description="Track Public Ticket % vs Sharp Money Handle % across European and African football. Spot Reverse Line Movement (RLM) traps and ride institutional syndicate steam."
        canonicalUrl="https://predictpro.guru/sharp-money-splits"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Dropping Odds Radar', href: '/dropping-odds' },
            { label: 'Sharp Money & Public Betting Splits' },
          ]}
        />

        <LeagueNavigationStrip />
        <MarketQuickStrip />

        {/* Hero Section */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span>Public Tickets % vs Cash Handle %</span>
                <span aria-hidden="true">·</span>
                <span>Reverse Line Movement (RLM)</span>
                <span aria-hidden="true">·</span>
                <span>Syndicate Steam Detector</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Sharp Money, Public Betting Splits &amp; Reverse Line Movement Scanner
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                When <strong>75% of public bet slips</strong> back a popular team, yet the bookmaker <strong>lowers the odds on the opponent</strong>, that is <strong>Reverse Line Movement (RLM)</strong>—proof that high-stakes syndicate money is heavily on the other side.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleLoadSharpAcca} className="gap-1.5 text-xs font-bold">
                <Zap className="h-3.5 w-3.5" />
                Load 3-Leg Sharp Syndicate Acca
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {[
              { id: 'ALL', label: `All Sharp Signals (${SHARP_SPLITS_DATA.length})` },
              { id: 'RLM TRAP ALERT', label: 'Reverse Line Movement (RLM Traps)' },
              { id: 'SYNDICATE STEAM', label: 'Syndicate Steam Moves' },
              { id: 'AFRICA', label: 'African & CAF Splits' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterSignal(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  filterSignal === tab.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted text-foreground border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Interactive RLM & Handle Divergence Simulator */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Interactive Public Ticket % vs Money Handle % RLM Simulator
            </CardTitle>
            <CardDescription className="text-xs">
              Input the Public Ticket % vs actual Cash Money % on the public favorite to measure the Sharp Contrarian Signal strength.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="pub-tickets-slider" className="font-semibold text-muted-foreground">
                    Public Tickets % on Favorite:
                  </label>
                  <span className="font-mono font-bold text-foreground">{simPublicPct}% Tickets</span>
                </div>
                <input
                  id="pub-tickets-slider"
                  type="range"
                  min={50}
                  max={92}
                  value={simPublicPct}
                  onChange={(e) => setSimPublicPct(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="pub-money-slider" className="font-semibold text-muted-foreground">
                    Actual Cash Handle % on Public Side:
                  </label>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {simMoneyPct}% Cash ({100 - simMoneyPct}% on Sharp Side)
                  </span>
                </div>
                <input
                  id="pub-money-slider"
                  type="range"
                  min={15}
                  max={80}
                  value={simMoneyPct}
                  onChange={(e) => setSimMoneyPct(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <label htmlFor="sharp-open-odds" className="block text-[11px] text-muted-foreground mb-1">
                  Sharp Side Opening Odds
                </label>
                <input
                  id="sharp-open-odds"
                  type="number"
                  step="0.05"
                  min="1.20"
                  max="6.00"
                  value={simOpenOdds}
                  onChange={(e) => setSimOpenOdds(parseFloat(e.target.value) || 2.0)}
                  className="w-full h-9 px-2.5 rounded-md border border-border bg-background font-mono font-bold"
                />
              </div>
              <div>
                <label htmlFor="sharp-curr-odds" className="block text-[11px] text-muted-foreground mb-1">
                  Sharp Side Current Odds
                </label>
                <input
                  id="sharp-curr-odds"
                  type="number"
                  step="0.05"
                  min="1.15"
                  max="6.00"
                  value={simCurrOdds}
                  onChange={(e) => setSimCurrOdds(parseFloat(e.target.value) || 1.85)}
                  className="w-full h-9 px-2.5 rounded-md border border-border bg-background font-mono font-bold text-primary"
                />
              </div>
              <div className="col-span-2 p-2.5 rounded-lg bg-background border border-border flex items-center justify-between">
                <span className="text-muted-foreground">Ticket-to-Cash Divergence:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{rlmCalculation.handleGap}% Sharp Gap · +{rlmCalculation.steamShiftPct}% Steam
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-background border border-primary/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">RLM Signal Index</span>
                <span className="font-mono font-black text-lg text-primary">
                  {rlmCalculation.rlmScore}/100
                </span>
              </div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {rlmCalculation.verdict}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {rlmCalculation.contraSharpHandlePct}% of total money is backing the contrarian side despite {simPublicPct}% of public slips on the favorite.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sharp Money Splits Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSplits.map((item) => {
            const oddsDropPct = Math.round(
              ((item.openingSharpOdds - item.currentSharpOdds) / item.openingSharpOdds) * 100
            );
            return (
              <Card key={item.id} className="border-border hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{item.league}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.kickoff}</span>
                    </div>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {item.signalType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-base text-foreground">
                      <TeamLogo team={item.homeTeam} size="sm" />
                      <span>{item.homeTeam}</span>
                      <span className="text-muted-foreground font-normal text-xs">vs</span>
                      <TeamLogo team={item.awayTeam} size="sm" />
                      <span>{item.awayTeam}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      -{oddsDropPct}% Steam Drop
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3.5 text-xs">
                  {/* Dual Bar Comparison: Public Tickets vs Sharp Cash Handle */}
                  <div className="space-y-2 p-3 rounded-lg bg-muted/40 border border-border/60">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">
                          Public Retail Tickets: <strong className="text-foreground">{item.publicSideLabel}</strong>
                        </span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.publicTicketsPct}% of Slips
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${item.publicTicketsPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">
                          Institutional Cash Handle: <strong className="text-primary">{item.sharpSideLabel}</strong>
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.sharpMoneyHandlePct}% of Money
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${item.sharpMoneyHandlePct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed">{item.sharpAnalysis}</p>

                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-foreground">
                        Sharp Syndicate Pick: <span className="text-primary">{item.sharpSideLabel}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        Opened: <span className="line-through">{item.openingSharpOdds.toFixed(2)}</span> → Now:{' '}
                        <strong className="text-foreground">{item.currentSharpOdds.toFixed(2)}</strong> · AI {item.aiConfidence}%
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        addSelection({
                          matchId: item.id,
                          match: `${item.homeTeam} vs ${item.awayTeam}`,
                          homeTeam: item.homeTeam,
                          awayTeam: item.awayTeam,
                          league: item.league,
                          matchDate: new Date().toISOString(),
                          market: item.sharpSideLabel,
                          odds: item.currentSharpOdds,
                          confidence: item.aiConfidence,
                        });
                        toast.success(`Added Sharp Pick: ${item.sharpSideLabel} @ ${item.currentSharpOdds.toFixed(2)}!`);
                      }}
                      className="gap-1.5 text-xs font-bold shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ride Sharp @ {item.currentSharpOdds.toFixed(2)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <SEOAuthorityHub />
      </main>

      <Footer />
    </div>
  );
};

export default SharpMoneySplitsPage;
