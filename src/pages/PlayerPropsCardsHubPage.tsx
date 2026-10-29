import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';
import {
  Crosshair,
  Plus,
  Flame,
  ShieldAlert,
  Calculator,
  Search,
} from 'lucide-react';
import {
  PLAYER_PROP_PROJECTIONS,
  REFEREE_CARD_STRICTNESS_TABLE,
  PlayerPropModelRow,
  RefereeCardStrictnessRow,
} from '@/services/phase13EdgeService';

function poissonProbAtLeast(lambda: number, k: number): number {
  if (lambda <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < k; i++) {
    let fact = 1;
    for (let j = 2; j <= i; j++) fact *= j;
    sum += (Math.pow(lambda, i) * Math.exp(-lambda)) / fact;
  }
  return Math.max(0.01, Math.min(0.98, 1 - sum));
}

export const PlayerPropsCardsHubPage: React.FC = () => {
  const { addSelection, setIsOpen } = useBetSlip();

  const [activeTab, setActiveTab] = useState<'shots' | 'referees' | 'calculator'>('shots');
  const [leagueFilter, setLeagueFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Custom Player SOT Poisson Calculator state
  const [customPlayerName, setCustomPlayerName] = useState<string>('Cole Palmer');
  const [customSotPer90, setCustomSotPer90] = useState<string>('1.82');
  const [customExpectedMinutes, setCustomExpectedMinutes] = useState<string>('88');
  const [customBookieOdds2Sot, setCustomBookieOdds2Sot] = useState<string>('2.10');

  const filteredPlayers = useMemo(() => {
    return PLAYER_PROP_PROJECTIONS.filter((row) => {
      if (leagueFilter !== 'all' && row.league !== leagueFilter) return false;
      if (
        searchQuery.trim() &&
        !`${row.playerName} ${row.team} ${row.opponent}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [leagueFilter, searchQuery]);

  const customPoisson = useMemo(() => {
    const sot90 = Math.max(0.1, parseFloat(customSotPer90) || 1.5);
    const mins = Math.max(15, Math.min(95, parseFloat(customExpectedMinutes) || 85));
    const bookieOdds = Math.max(1.05, parseFloat(customBookieOdds2Sot) || 2.0);

    const lambda = sot90 * (mins / 90);
    const p1Plus = poissonProbAtLeast(lambda, 1);
    const p2Plus = poissonProbAtLeast(lambda, 2);
    const p3Plus = poissonProbAtLeast(lambda, 3);

    const fairOdds1Plus = 1 / p1Plus;
    const fairOdds2Plus = 1 / p2Plus;
    const edge2PlusPct = ((bookieOdds / fairOdds2Plus - 1) * 100);

    return {
      lambda,
      p1PlusPct: p1Plus * 100,
      p2PlusPct: p2Plus * 100,
      p3PlusPct: p3Plus * 100,
      fairOdds1Plus,
      fairOdds2Plus,
      edge2PlusPct,
    };
  }, [customSotPer90, customExpectedMinutes, customBookieOdds2Sot]);

  const handleAddPlayerProp = (row: PlayerPropModelRow) => {
    addSelection({
      homeTeam: row.team,
      awayTeam: row.opponent,
      match: `${row.team} vs ${row.opponent}`,
      league: row.league,
      market: row.recommendedPropMarket,
      selection: row.recommendedPropMarket,
      odds: row.bookieOdds2PlusSot,
      confidence: Math.round(row.prob1PlusSotPct),
    });
    setIsOpen(true);
    toast.success(`Added ${row.recommendedPropMarket} (@${row.bookieOdds2PlusSot.toFixed(2)}) to Bet Slip!`);
  };

  const handleAddRefereeCardProp = (ref: RefereeCardStrictnessRow) => {
    const label = `Over 4.5 Total Cards (Ref: ${ref.refereeName})`;
    addSelection({
      homeTeam: ref.homeTeam,
      awayTeam: ref.awayTeam,
      match: ref.assignedFixture,
      league: ref.league,
      market: label,
      selection: label,
      odds: ref.bookieOddsOver45Cards,
      confidence: Math.round(ref.over45CardsProbPct),
    });
    setIsOpen(true);
    toast.success(`Added ${label} (@${ref.bookieOddsOver45Cards.toFixed(2)}) to Bet Slip!`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Player Props, Shots on Target (SOT) & Referee Cards Model | PredictPro"
        description="Per-90 Poisson projections for player Shots on Target (1+ SOT, 2+ SOT), player fouls, and Referee Card Strictness indices across major European and African leagues."
        keywords="player shots on target predictions, 2+ shots on target tips, referee card stats predictions, player fouls betting model, poisson player props calculator"
        canonical="/player-props"
      />

      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Player Props, Shots on Target & Referee Cards Model' },
          ]}
        />

        {/* Header */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-emerald-500">Micro-Market Quantitative Model</span>
                <span aria-hidden="true">·</span>
                <span>Per-90 SOT Poisson Engine</span>
                <span aria-hidden="true">·</span>
                <span>Referee Booking Points Index</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Player Shots on Target, Fouls &amp; Referee Cards Hub
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sportsbooks price main `1X2` lines tightly, but player shots on target (`1+ SOT`, `2+ SOT`) and referee booking totals frequently misprice per-90 usage and officiating tempo by <strong className="text-foreground">8% to 20%</strong>.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('shots')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'shots'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Player Shots &amp; SOT
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('referees')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'referees'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Referee Card Index
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('calculator')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'calculator'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Custom SOT Calculator
              </button>
            </div>
          </div>
        </section>

        {/* TAB 1: PLAYER SHOTS ON TARGET TABLE */}
        {activeTab === 'shots' && (
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'Premier League', 'LaLiga', 'Bundesliga', 'Serie A'].map((lg) => (
                  <button
                    key={lg}
                    type="button"
                    onClick={() => setLeagueFilter(lg)}
                    className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      leagueFilter === lg
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {lg === 'all' ? 'All Competitions' : lg}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search player or club..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 pr-3 font-semibold">Player &amp; Matchup</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Shots/90</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">SOT/90</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">xG/90</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Fouls/90</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">1+ SOT %</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">2+ SOT %</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Fair 2+ Odds</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Bookie Odds</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Model Edge</th>
                    <th className="py-2.5 pl-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono tabular-nums">
                  {filteredPlayers.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/40">
                      <td className="py-3 pr-3 font-sans">
                        <div className="font-bold text-foreground">
                          <Link
                            to={`/players/${row.playerName.toLowerCase().replace(/\s+/g, '-')}`}
                            className="hover:text-primary transition-colors"
                          >
                            {row.playerName}
                          </Link>{' '}
                          <span className="text-[11px] font-normal text-muted-foreground">
                            ({row.position})
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {row.team} vs {row.opponent} · {row.league}
                        </div>
                      </td>
                      <td className="py-3 px-2.5 text-right">{row.shotsPer90.toFixed(2)}</td>
                      <td className="py-3 px-2.5 text-right font-bold text-cyan-400">
                        {row.sotPer90.toFixed(2)}
                      </td>
                      <td className="py-3 px-2.5 text-right">{row.xgPer90.toFixed(2)}</td>
                      <td className="py-3 px-2.5 text-right text-muted-foreground">
                        {row.foulsCommittedPer90.toFixed(2)}
                      </td>
                      <td className="py-3 px-2.5 text-right">{row.prob1PlusSotPct.toFixed(1)}%</td>
                      <td className="py-3 px-2.5 text-right font-bold text-foreground">
                        {row.prob2PlusSotPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-2.5 text-right text-muted-foreground">
                        {row.fairOdds2PlusSot.toFixed(2)}
                      </td>
                      <td className="py-3 px-2.5 text-right font-bold text-emerald-400">
                        {row.bookieOdds2PlusSot.toFixed(2)}{' '}
                        <span className="font-sans text-[10px] text-muted-foreground">
                          ({row.bestBookie})
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-right font-extrabold text-emerald-400">
                        +{row.edgePct.toFixed(1)}%
                      </td>
                      <td className="py-3 pl-3 text-right font-sans">
                        <Button
                          size="sm"
                          onClick={() => handleAddPlayerProp(row)}
                          className="h-7 px-2.5 text-[11px] font-bold gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          2+ SOT
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: REFEREE CARD STRICTNESS TABLE */}
        {activeTab === 'referees' && (
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground">
                Referee Card Strictness &amp; Booking Points Matrix
              </h2>
              <p className="text-xs text-muted-foreground">
                Officiating tempo, fouls-per-card thresholds, and Poisson Over 4.5 Cards edge
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 pr-3 font-semibold">Referee &amp; Assigned Match</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Yellows/Match</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Red Card %</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Fouls / Card</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Over 4.5 Prob</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Bookie Odds</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right">Model Edge</th>
                    <th className="py-2.5 pl-3 font-semibold text-right">Add to Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono tabular-nums">
                  {REFEREE_CARD_STRICTNESS_TABLE.map((ref) => (
                    <tr key={ref.id} className="hover:bg-muted/40">
                      <td className="py-3 pr-3 font-sans">
                        <div className="font-bold text-foreground">
                          {ref.refereeName} ·{' '}
                          <span className="text-amber-400 font-semibold">{ref.strictnessTier}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {ref.assignedFixture} · {ref.league} ({ref.matchesOfficiated} matches)
                        </div>
                      </td>
                      <td className="py-3 px-2.5 text-right font-bold text-amber-400">
                        {ref.yellowCardsPerMatch.toFixed(2)}
                      </td>
                      <td className="py-3 px-2.5 text-right">{ref.redCardProbPct.toFixed(1)}%</td>
                      <td className="py-3 px-2.5 text-right">{ref.foulsPerCard.toFixed(1)}</td>
                      <td className="py-3 px-2.5 text-right font-bold">
                        {ref.over45CardsProbPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-2.5 text-right font-bold text-emerald-400">
                        {ref.bookieOddsOver45Cards.toFixed(2)}
                      </td>
                      <td className="py-3 px-2.5 text-right font-extrabold text-emerald-400">
                        +{ref.modelEdgePct.toFixed(1)}%
                      </td>
                      <td className="py-3 pl-3 text-right font-sans">
                        <Button
                          size="sm"
                          onClick={() => handleAddRefereeCardProp(ref)}
                          className="h-7 px-2.5 text-[11px] font-bold gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Over 4.5 Cards
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: INTERACTIVE CUSTOM PLAYER SOT POISSON CALCULATOR */}
        {activeTab === 'calculator' && (
          <section className="rounded-xl border border-border bg-card p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Custom Player Shots on Target (SOT) Poisson Pricing Calculator
                </h2>
                <p className="text-xs text-muted-foreground">
                  Enter any attacker&apos;s per-90 SOT rate and expected minutes to compute true fair odds for 1+, 2+, and 3+ Shots on Target
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const label = `${customPlayerName || 'Player'} 2+ Shots on Target`;
                  addSelection({
                    homeTeam: customPlayerName || 'Player Prop',
                    awayTeam: 'Matchday Prop',
                    match: `${customPlayerName || 'Player'} SOT Prop`,
                    league: 'Player Props Model',
                    market: label,
                    selection: label,
                    odds: parseFloat(customBookieOdds2Sot) || 2.1,
                    confidence: Math.round(customPoisson.p2PlusPct),
                  });
                  setIsOpen(true);
                  toast.success(`Added ${label} to Bet Slip Drawer`);
                }}
                className="gap-1.5 text-xs font-bold shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add {customPlayerName || 'Player'} 2+ SOT to Bet Slip
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Player Name
                </label>
                <Input
                  type="text"
                  value={customPlayerName}
                  onChange={(e) => setCustomPlayerName(e.target.value)}
                  className="text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Shots on Target per 90 (SOT/90)
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.2"
                  value={customSotPer90}
                  onChange={(e) => setCustomSotPer90(e.target.value)}
                  className="font-mono tabular-nums font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Projected Minutes Played
                </label>
                <Input
                  type="number"
                  min="20"
                  max="95"
                  value={customExpectedMinutes}
                  onChange={(e) => setCustomExpectedMinutes(e.target.value)}
                  className="font-mono tabular-nums font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Bookmaker 2+ SOT Decimal Odds
                </label>
                <Input
                  type="number"
                  step="0.05"
                  min="1.1"
                  value={customBookieOdds2Sot}
                  onChange={(e) => setCustomBookieOdds2Sot(e.target.value)}
                  className="font-mono tabular-nums font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono tabular-nums">
              <div className="p-4 rounded-xl border border-border bg-background/60">
                <div className="text-xs font-sans text-muted-foreground">
                  1+ Shot on Target Prob
                </div>
                <div className="text-xl font-extrabold text-foreground mt-1">
                  {customPoisson.p1PlusPct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Fair Odds: {customPoisson.fairOdds1Plus.toFixed(2)}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5">
                <div className="text-xs font-sans text-emerald-400">
                  2+ Shots on Target Prob
                </div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1">
                  {customPoisson.p2PlusPct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Fair Odds: {customPoisson.fairOdds2Plus.toFixed(2)}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-background/60">
                <div className="text-xs font-sans text-muted-foreground">
                  3+ Shots on Target Prob
                </div>
                <div className="text-xl font-extrabold text-cyan-400 mt-1">
                  {customPoisson.p3PlusPct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Adjusted λ = {customPoisson.lambda.toFixed(2)} SOT
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-background/60">
                <div className="text-xs font-sans text-muted-foreground">
                  2+ SOT Value Edge vs Bookie
                </div>
                <div
                  className={`text-xl font-extrabold mt-1 ${
                    customPoisson.edge2PlusPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {customPoisson.edge2PlusPct >= 0 ? '+' : ''}
                  {customPoisson.edge2PlusPct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Bookie Quote: {Number(customBookieOdds2Sot).toFixed(2)}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PlayerPropsCardsHubPage;
