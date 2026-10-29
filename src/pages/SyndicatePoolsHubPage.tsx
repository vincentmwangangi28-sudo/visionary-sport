import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import {
  CURATED_SYNDICATE_POOLS,
  DEFAULT_MINI_LEAGUE_STANDINGS,
  calculateSyndicateShareSplit,
  SyndicatePool,
} from '@/services/phase14SyndicateService';
import {
  Users,
  Trophy,
  Copy,
  Check,
  Plus,
  Calculator,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface CustomMiniLeague {
  id: string;
  name: string;
  inviteCode: string;
  competitionFocus: string;
  membersCount: number;
  createdAt: string;
}

const STORAGE_KEY_MINI_LEAGUES = 'predictpro_custom_mini_leagues_v1';
const STORAGE_KEY_JOINED_POOLS = 'predictpro_joined_syndicate_pools_v1';

export const SyndicatePoolsHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'syndicates' | 'minileagues' | 'calculator'>(
    'syndicates'
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Joined Syndicate Pools
  const [joinedPoolIds, setJoinedPoolIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_JOINED_POOLS);
      return raw ? JSON.parse(raw) : ['syn-mega-17-alpha'];
    } catch {
      return ['syn-mega-17-alpha'];
    }
  });

  // Custom Mini-Leagues
  const [customLeagues, setCustomLeagues] = useState<CustomMiniLeague[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MINI_LEAGUES);
      return raw
        ? JSON.parse(raw)
        : [
            {
              id: 'ml-default-1',
              name: 'Nairobi Weekend CLV Syndicate',
              inviteCode: 'PP-LGE-8842',
              competitionFocus: 'Premier League & UEFA Champions League',
              membersCount: 18,
              createdAt: 'Active Season',
            },
          ];
    } catch {
      return [];
    }
  });

  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueFocus, setNewLeagueFocus] = useState('Premier League & Top 5 Euro');
  const [joinInviteInput, setJoinInviteInput] = useState('');
  const [joinFeedback, setJoinFeedback] = useState<string | null>(null);

  // Syndicate Permutation Cost Calculator state
  const [doublesCount, setDoublesCount] = useState<number>(6);
  const [triplesCount, setTriplesCount] = useState<number>(1);
  const [unitLineCost, setUnitLineCost] = useState<number>(99);
  const [userContribution, setUserContribution] = useState<number>(2500);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_JOINED_POOLS, JSON.stringify(joinedPoolIds));
    } catch {
      // ignore
    }
  }, [joinedPoolIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MINI_LEAGUES, JSON.stringify(customLeagues));
    } catch {
      // ignore
    }
  }, [customLeagues]);

  const shareCalc = useMemo(
    () =>
      calculateSyndicateShareSplit(
        doublesCount,
        triplesCount,
        unitLineCost,
        userContribution
      ),
    [doublesCount, triplesCount, unitLineCost, userContribution]
  );

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard?.writeText(code);
    } catch {
      // ignore
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleToggleJoinPool = (pool: SyndicatePool) => {
    setJoinedPoolIds((prev) =>
      prev.includes(pool.id) ? prev.filter((id) => id !== pool.id) : [...prev, pool.id]
    );
  };

  const handleCreateMiniLeague = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newLeagueName.trim();
    if (!trimmed) return;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const created: CustomMiniLeague = {
      id: `ml-${Date.now()}`,
      name: trimmed,
      inviteCode: `PP-LGE-${randomSuffix}`,
      competitionFocus: newLeagueFocus,
      membersCount: 1,
      createdAt: 'Just Created',
    };
    setCustomLeagues((prev) => [created, ...prev]);
    setNewLeagueName('');
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = joinInviteInput.trim().toUpperCase();
    if (!cleaned) return;
    if (customLeagues.some((l) => l.inviteCode === cleaned)) {
      setJoinFeedback(`You are already a member of ${cleaned}.`);
      return;
    }
    const joined: CustomMiniLeague = {
      id: `ml-joined-${Date.now()}`,
      name: `Syndicate League (${cleaned})`,
      inviteCode: cleaned,
      competitionFocus: 'All 40+ Global Leagues',
      membersCount: 12,
      createdAt: 'Joined via Invite Code',
    };
    setCustomLeagues((prev) => [joined, ...prev]);
    setJoinInviteInput('');
    setJoinFeedback(`Successfully joined mini-league ${cleaned}!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="17-Game Jackpot Syndicate Pools & Private Mini-Leagues | PredictPro"
        description="Join collaborative 17-Game Mega Jackpot permutation syndicates (SportPesa, Betika, SportyBet) or create private CLV Mini-Leagues with shareable invite codes."
        canonicalUrl="https://predictpro.guru/syndicate-pools"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Header */}
        <header className="border-b border-border/70 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span>Multi-Double Jackpot Permutations</span>
              <span aria-hidden="true">·</span>
              <span>Proportional Equity Calculator</span>
              <span aria-hidden="true">·</span>
              <span>Private Friend Mini-Leagues</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Mega Jackpot Syndicate Pools &amp; Private Mini-Leagues
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Covering 7 or 8 Doubles on a 17-Game Mega Jackpot requires <span className="font-mono">128 to 256</span> individual ticket lines. Pool permutation costs with fellow quantitative analysts or compete head-to-head in private CLV Mini-Leagues.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to="/jackpot-generator"
              className="px-3.5 py-2 rounded-lg border border-border bg-card hover:bg-muted/60 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              17-Game Jackpot Generator
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Segmented Control Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('syndicates')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'syndicates'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            17-Game Jackpot Syndicates ({CURATED_SYNDICATE_POOLS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('minileagues')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'minileagues'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Private Mini-Leagues ({customLeagues.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === 'calculator'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-primary" />
            Syndicate Share &amp; Permutation Calculator
          </button>
        </div>

        {/* TAB 1: 17-GAME JACKPOT SYNDICATE POOLS */}
        {activeTab === 'syndicates' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {CURATED_SYNDICATE_POOLS.map((pool) => {
              const isJoined = joinedPoolIds.includes(pool.id);
              return (
                <div
                  key={pool.id}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{pool.bookmaker}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {pool.jackpotPrizeLabel}
                      </span>
                    </div>

                    <h2 className="text-base font-bold leading-snug">{pool.title}</h2>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Lead: {pool.creatorHandle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        +{pool.creatorVerifiedYieldPct}% 30d Yield
                      </span>
                    </div>

                    {/* Permutation Breakdown */}
                    <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                      <div className="rounded-lg border border-border/60 bg-background p-2.5">
                        <div className="text-[10px] text-muted-foreground uppercase">Doubles</div>
                        <div className="font-mono font-bold text-sm mt-0.5">
                          {pool.doublesCount} Legs
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background p-2.5">
                        <div className="text-[10px] text-muted-foreground uppercase">Permutations</div>
                        <div className="font-mono font-bold text-sm mt-0.5">
                          {pool.totalLines} Lines
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-background p-2.5">
                        <div className="text-[10px] text-muted-foreground uppercase">Total Cost</div>
                        <div className="font-mono font-bold text-sm mt-0.5">
                          {pool.currency} {pool.totalTicketCost.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Funding Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Members: {pool.membersCount + (isJoined ? 1 : 0)}/{pool.maxMembers}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.min(100, pool.fundedPct + (isJoined ? 5 : 0))}% Funded
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{
                            width: `${Math.min(100, pool.fundedPct + (isJoined ? 5 : 0))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Sample Banker & Double Legs */}
                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Top 5 Syndicate Permutation Legs
                      </div>
                      <ul className="space-y-1 text-xs">
                        {pool.bankerLegsPreview.map((leg) => (
                          <li
                            key={leg.legNumber}
                            className="flex items-center justify-between py-1 border-b border-border/40 last:border-0"
                          >
                            <span className="truncate pr-2">
                              <span className="font-mono text-muted-foreground mr-1.5">
                                #{leg.legNumber}
                              </span>
                              {leg.fixture}
                            </span>
                            <span
                              className={`font-mono font-bold shrink-0 ${
                                leg.isDouble
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {leg.pick}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(pool.inviteCode)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-mono font-semibold transition-colors whitespace-nowrap shrink-0"
                    >
                      {copiedCode === pool.inviteCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                          {pool.inviteCode}
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleJoinPool(pool)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                        isJoined
                          ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-primary text-primary-foreground hover:opacity-90'
                      }`}
                    >
                      {isJoined ? 'Joined Syndicate ✓' : 'Reserve Syndicate Share'}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* TAB 2: PRIVATE MINI-LEAGUES */}
        {activeTab === 'minileagues' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Create or Join Mini-League */}
            <div className="lg:col-span-5 space-y-5">
              <form
                onSubmit={handleCreateMiniLeague}
                className="rounded-xl border border-border bg-card p-5 space-y-4"
              >
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Create Private Mini-League
                </h2>
                <div className="space-y-1.5">
                  <label htmlFor="league-name-input" className="text-xs font-semibold text-muted-foreground block">
                    Mini-League Name
                  </label>
                  <input
                    id="league-name-input"
                    type="text"
                    placeholder="e.g. Westlands Weekend Punters"
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="league-focus-select" className="text-xs font-semibold text-muted-foreground block">
                    Primary Competition Focus
                  </label>
                  <select
                    id="league-focus-select"
                    value={newLeagueFocus}
                    onChange={(e) => setNewLeagueFocus(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                  >
                    <option value="Premier League & Top 5 Euro">Premier League &amp; Top 5 Euro</option>
                    <option value="UEFA Champions League">UEFA Champions League</option>
                    <option value="FKF Premier League & CAF">FKF Premier League &amp; CAF</option>
                    <option value="NPFL & African Leagues">NPFL &amp; African Leagues</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Generate League &amp; Invite Code
                </button>
              </form>

              <form
                onSubmit={handleJoinByCode}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <h3 className="text-sm font-bold">Have an Invite Code?</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. PP-LGE-8842)"
                    value={joinInviteInput}
                    onChange={(e) => setJoinInviteInput(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                  >
                    Join League
                  </button>
                </div>
                {joinFeedback && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {joinFeedback}
                  </p>
                )}
              </form>

              {/* Active Mini-Leagues List */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h3 className="text-sm font-bold">Your Active Mini-Leagues</h3>
                <div className="space-y-2.5">
                  {customLeagues.map((lg) => (
                    <div
                      key={lg.id}
                      className="rounded-lg border border-border/70 bg-background p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{lg.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {lg.competitionFocus} · {lg.membersCount} Members
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(lg.inviteCode)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-border bg-card hover:bg-muted text-[11px] font-mono font-bold shrink-0"
                      >
                        {copiedCode === lg.inviteCode ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        )}
                        {lg.inviteCode}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Mini-League Standings Table */}
            <div className="lg:col-span-7 rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-5 border-b border-border/70 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">
                    Nairobi Weekend CLV Syndicate — 30-Day Leaderboard
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Ranked by verified 30-day net units and Closing Line Value (CLV) beat rate.
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 font-semibold">Rank</th>
                      <th className="py-3 px-4 font-semibold">Syndicate Member</th>
                      <th className="py-3 px-3 font-semibold text-right">Hit Rate</th>
                      <th className="py-3 px-3 font-semibold text-right">CLV Beat %</th>
                      <th className="py-3 px-3 font-semibold text-right">30D Net Units</th>
                      <th className="py-3 px-4 font-semibold text-right">Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {DEFAULT_MINI_LEAGUE_STANDINGS.map((row) => (
                      <tr
                        key={row.rank}
                        className={row.isCurrentUser ? 'bg-primary/5 font-semibold' : 'hover:bg-muted/20'}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold">#{row.rank}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-foreground">{row.memberName}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {row.handle}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                          {row.correctPicks}/{row.totalPicks} (
                          {Math.round((row.correctPicks / row.totalPicks) * 100)}%)
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                          {row.clvBeatPct}%
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                          +{row.netUnits30d.toFixed(1)}u
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          {row.streak}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: SYNDICATE PERMUTATION & SHARE CALCULATOR */}
        {activeTab === 'calculator' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Jackpot Permutation Cost &amp; Share Split
              </h2>

              <div className="space-y-1">
                <label htmlFor="syn-doubles" className="text-xs font-semibold text-muted-foreground block">
                  Number of 2-Way Double Legs (2^N): {doublesCount}
                </label>
                <input
                  id="syn-doubles"
                  type="range"
                  min={0}
                  max={10}
                  value={doublesCount}
                  onChange={(e) => setDoublesCount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="syn-triples" className="text-xs font-semibold text-muted-foreground block">
                  Number of 3-Way Triple Legs (3^M): {triplesCount}
                </label>
                <input
                  id="syn-triples"
                  type="range"
                  min={0}
                  max={4}
                  value={triplesCount}
                  onChange={(e) => setTriplesCount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="syn-unit-cost" className="text-xs font-semibold text-muted-foreground block">
                    Unit Line Cost (KES)
                  </label>
                  <input
                    id="syn-unit-cost"
                    type="number"
                    min={1}
                    value={unitLineCost}
                    onChange={(e) => setUnitLineCost(Math.max(1, Number(e.target.value) || 99))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="syn-user-contrib" className="text-xs font-semibold text-muted-foreground block">
                    Your Contribution (KES)
                  </label>
                  <input
                    id="syn-user-contrib"
                    type="number"
                    min={10}
                    value={userContribution}
                    onChange={(e) => setUserContribution(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border/70 bg-background p-4">
                  <div className="text-xs text-muted-foreground">Total Permutation Lines</div>
                  <div className="text-2xl font-black font-mono tabular-nums mt-1">
                    {shareCalc.totalLines.toLocaleString()} Lines
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-background p-4">
                  <div className="text-xs text-muted-foreground">Total Syndicate Ticket Cost</div>
                  <div className="text-2xl font-black font-mono tabular-nums mt-1">
                    KES {shareCalc.totalPoolCost.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
                  <div className="text-xs text-muted-foreground">Your Proportional Share %</div>
                  <div className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                    {shareCalc.ownershipSharePct}%
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/30 p-4 flex items-start gap-3 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Transparent Syndicate Equity Rule</div>
                  <p className="text-muted-foreground leading-relaxed">
                    With {shareCalc.doublesCount} Doubles and {shareCalc.triplesCount} Triples ({shareCalc.totalLines} combinations), your contribution of{' '}
                    <strong className="text-foreground font-mono">
                      KES {shareCalc.userContribution.toLocaleString()}
                    </strong>{' '}
                    funds the equivalent of{' '}
                    <strong className="text-foreground font-mono">
                      {shareCalc.linesFundedEquivalent} tickets
                    </strong>{' '}
                    and entitles you to <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{shareCalc.ownershipSharePct}%</strong> of any 15/17, 16/17, or 17/17 Mega Jackpot payout.
                  </p>
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

export default SyndicatePoolsHubPage;
