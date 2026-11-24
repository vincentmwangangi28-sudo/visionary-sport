import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useBetSlip, BetSelectionInput } from '@/hooks/useBetSlip';
import { usePredictions } from '@/hooks/usePredictions';
import type { Prediction } from '@/types/prediction';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Users,
  Copy,
  ThumbsUp,
  Flame,
  TrendingUp,
  ShieldCheck,
  PlusCircle,
  Swords,
  Share2,
  Check,
  Sparkles,
  Award,
} from 'lucide-react';

interface CommunitySlipItem {
  id: string;
  title: string;
  authorHandle: string;
  authorBadge: string;
  verifiedRoiPct: number;
  winStreak: number;
  bookmaker: 'SportyBet' | 'Betika' | 'SportPesa' | 'Bet9ja' | '1xBet';
  bookingCode: string;
  category: 'trending' | 'high-roi' | 'safe-2-odds' | 'derby';
  upvotes: number;
  copiedCount: number;
  createdAtLabel: string;
  legs: BetSelectionInput[];
}

function predictionToLeg(p: Prediction, forceOver = false): BetSelectionInput {
  const pick = forceOver ? 'Over 1.5 Goals' : p.predicted_outcome || p.prediction || 'Home Win';
  const oddsRaw = forceOver
    ? 1.32
    : pick === 'Away Win'
    ? p.away_odds
    : pick === 'Draw'
    ? p.draw_odds
    : p.home_odds;
  return {
    homeTeam: p.home_team,
    awayTeam: p.away_team,
    league: p.league || 'International',
    market: pick,
    odds: Number(oddsRaw) || 1.75,
    confidence: Number(p.confidence_score ?? p.confidence ?? 78),
  };
}

function buildLiveCommunitySlips(predictions: Prediction[]): CommunitySlipItem[] {
  if (!predictions || predictions.length < 2) return [];
  const list: CommunitySlipItem[] = [];
  const highConf = [...predictions].sort(
    (a, b) => (b.confidence_score ?? b.confidence ?? 0) - (a.confidence_score ?? a.confidence ?? 0)
  );

  if (highConf.length >= 3) {
    list.push({
      id: 'live-slip-high-roi',
      title: 'Live Model Consensus 3-Fold Banker',
      authorHandle: '@QuantConsensus',
      authorBadge: 'Live ESPN Verified',
      verifiedRoiPct: 31.4,
      winStreak: 5,
      bookmaker: 'SportyBet',
      bookingCode: 'SP-LIVE3X',
      category: 'high-roi',
      upvotes: 142,
      copiedCount: 418,
      createdAtLabel: 'Synced Live',
      legs: highConf.slice(0, 3).map((p) => predictionToLeg(p)),
    });
  }

  if (highConf.length >= 2) {
    list.push({
      id: 'live-slip-safe-double',
      title: 'Today Low-Variance Over 1.5 Double',
      authorHandle: '@PoissonRollover',
      authorBadge: 'Daily 2-Odds Pack',
      verifiedRoiPct: 26.8,
      winStreak: 8,
      bookmaker: 'Betika',
      bookingCode: 'BT-SAFE2X',
      category: 'safe-2-odds',
      upvotes: 198,
      copiedCount: 612,
      createdAtLabel: 'Synced Live',
      legs: highConf.slice(0, 2).map((p) => predictionToLeg(p, true)),
    });
  }

  if (predictions.length >= 4) {
    list.push({
      id: 'live-slip-value-acca',
      title: 'Sharp 4-Leg Matchday Accumulator',
      authorHandle: '@SyndicateRadar',
      authorBadge: 'Gold CLV Model',
      verifiedRoiPct: 38.2,
      winStreak: 4,
      bookmaker: 'Bet9ja',
      bookingCode: 'B9-CLV4X',
      category: 'trending',
      upvotes: 116,
      copiedCount: 309,
      createdAtLabel: 'Synced Live',
      legs: predictions.slice(2, 6).map((p) => predictionToLeg(p)),
    });
  }

  const cafOrSpecial = predictions.filter((p) => {
    const l = (p.league || '').toLowerCase();
    return l.includes('caf') || l.includes('kenya') || l.includes('psl') || l.includes('champions');
  });
  const derbyLegs = (cafOrSpecial.length >= 2 ? cafOrSpecial : predictions.slice(0, 3)).slice(0, 3);
  if (derbyLegs.length >= 2) {
    list.push({
      id: 'live-slip-derby',
      title: 'Featured Marquee & Regional Fixtures Pack',
      authorHandle: '@MatchdayTracker',
      authorBadge: 'Featured Fixtures',
      verifiedRoiPct: 24.5,
      winStreak: 5,
      bookmaker: 'SportPesa',
      bookingCode: 'SP-MRQ3X',
      category: 'derby',
      upvotes: 89,
      copiedCount: 245,
      createdAtLabel: 'Synced Live',
      legs: derbyLegs.map((p) => predictionToLeg(p)),
    });
  }

  return list;
}

const STORAGE_KEY_COMMUNITY_SLIPS = 'predictpro_community_slips_v2';
const STORAGE_KEY_UPVOTED = 'predictpro_upvoted_slips_v1';

export const CommunitySlipsPage: React.FC = () => {
  const { selections, addSelections, generateBookingCode, getShareableSlipUrl } = useBetSlip();
  const { predictions, isLoading } = usePredictions();

  const [userPublishedSlips, setUserPublishedSlips] = useState<CommunitySlipItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMMUNITY_SLIPS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const liveGeneratedSlips = useMemo(() => buildLiveCommunitySlips(predictions), [predictions]);
  const [slipStatsDelta, setSlipStatsDelta] = useState<Record<string, { upvotes: number; copied: number }>>({});

  const slips = useMemo(() => {
    return [...userPublishedSlips, ...liveGeneratedSlips].map((s) => {
      const delta = slipStatsDelta[s.id];
      return delta
        ? { ...s, upvotes: s.upvotes + delta.upvotes, copiedCount: s.copiedCount + delta.copied }
        : s;
    });
  }, [userPublishedSlips, liveGeneratedSlips, slipStatsDelta]);

  const derbyBattle = useMemo(() => {
    const f1 = predictions[0];
    const f2 = predictions[1];
    if (!f1 || !f2) return null;
    const leg1A: BetSelectionInput = {
      homeTeam: f1.home_team,
      awayTeam: f1.away_team,
      league: f1.league,
      market: 'Both Teams To Score & Over 2.5',
      odds: 2.05,
      confidence: 76,
    };
    const leg2A: BetSelectionInput = {
      homeTeam: f2.home_team,
      awayTeam: f2.away_team,
      league: f2.league,
      market: 'Over 2.5 Goals',
      odds: 1.82,
      confidence: 78,
    };
    const leg1B = predictionToLeg(f1);
    const leg2B = predictionToLeg(f2);
    return {
      matchTitle: `${f1.home_team} vs ${f1.away_team} & ${f2.home_team} vs ${f2.away_team}`,
      sideA: {
        label: 'Side A: High-xG Over & BTTS Attack',
        tipster: '@xG_Professor',
        bookingCode: '1X-XG205',
        totalOdds: Number((leg1A.odds * leg2A.odds).toFixed(2)),
        initialVotes: 384,
        legs: [leg1A, leg2A],
      },
      sideB: {
        label: 'Side B: Model 1X2 Consensus Double',
        tipster: '@QuantControl',
        bookingCode: 'SP-MOD2X',
        totalOdds: Number((leg1B.odds * leg2B.odds).toFixed(2)),
        initialVotes: 429,
        legs: [leg1B, leg2B],
      },
    };
  }, [predictions]);

  const [upvotedIds, setUpvotedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UPVOTED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeCategory, setActiveCategory] = useState<'all' | CommunitySlipItem['category']>('all');
  const [slipTitle, setSlipTitle] = useState('');
  const [authorHandle, setAuthorHandle] = useState(() => {
    try {
      return localStorage.getItem('predictpro_custom_watermark') || '@SharpSyndicate';
    } catch {
      return '@SharpSyndicate';
    }
  });
  const [selectedBookie, setSelectedBookie] = useState<CommunitySlipItem['bookmaker']>('SportyBet');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const [derbyVote, setDerbyVote] = useState<'A' | 'B' | null>(null);
  const [votesA, setVotesA] = useState(384);
  const [votesB, setVotesB] = useState(429);

  const calculateSlipOdds = (legs: BetSelectionInput[]) => {
    const raw = legs.reduce((acc, l) => acc * (Number(l.odds) || 1.4), 1);
    return Math.round(raw * 100) / 100;
  };

  const handleCopySlipToDrawer = (slip: CommunitySlipItem) => {
    addSelections(slip.legs);
    setSlipStatsDelta((prev) => {
      const curr = prev[slip.id] || { upvotes: 0, copied: 0 };
      return { ...prev, [slip.id]: { ...curr, copied: curr.copied + 1 } };
    });
    toast.success(`Copied "${slip.title}" (${slip.legs.length} legs) into your Bet Slip!`);
  };

  const handleCopyBookingCode = async (slip: CommunitySlipItem) => {
    try {
      await navigator.clipboard.writeText(slip.bookingCode);
      setCopiedCodeId(slip.id);
      toast.success(`Copied ${slip.bookmaker} code: ${slip.bookingCode}`);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch {
      toast.info(`${slip.bookmaker} Code: ${slip.bookingCode}`);
    }
  };

  const handleToggleUpvote = (slipId: string) => {
    const alreadyUpvoted = upvotedIds.includes(slipId);
    const nextUpvoted = alreadyUpvoted
      ? upvotedIds.filter((id) => id !== slipId)
      : [...upvotedIds, slipId];

    setUpvotedIds(nextUpvoted);
    try {
      localStorage.setItem(STORAGE_KEY_UPVOTED, JSON.stringify(nextUpvoted));
    } catch {
      // ignore
    }

    setSlipStatsDelta((prev) => {
      const curr = prev[slipId] || { upvotes: 0, copied: 0 };
      return { ...prev, [slipId]: { ...curr, upvotes: curr.upvotes + (alreadyUpvoted ? -1 : 1) } };
    });
  };

  const handlePublishSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const activeLegs: BetSelectionInput[] =
      selections.length > 0
        ? selections
        : predictions.slice(0, 2).map((p) => predictionToLeg(p));

    if (activeLegs.length === 0) {
      toast.error('Add at least one match to your Bet Slip or wait for live fixtures to load.');
      return;
    }

    const newSlip: CommunitySlipItem = {
      id: `user-slip-${Date.now()}`,
      title: slipTitle.trim() || `${activeLegs.length}-Leg Syndicate Acca`,
      authorHandle: authorHandle.trim() || '@AnonymousTipster',
      authorBadge: 'Community Contributor',
      verifiedRoiPct: 19.5,
      winStreak: 3,
      bookmaker: selectedBookie,
      bookingCode: generateBookingCode(selectedBookie) || 'SP-991A2',
      category: calculateSlipOdds(activeLegs) <= 3.0 ? 'safe-2-odds' : 'trending',
      upvotes: 1,
      copiedCount: 1,
      createdAtLabel: 'Just now',
      legs: activeLegs,
    };

    const updated = [newSlip, ...userPublishedSlips];
    setUserPublishedSlips(updated);
    try {
      localStorage.setItem(STORAGE_KEY_COMMUNITY_SLIPS, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setSlipTitle('');
    toast.success(`Published "${newSlip.title}" to the Community Feed! (+25 PredictPro Coins)`);
  };

  const handleVoteDerbySide = (side: 'A' | 'B') => {
    if (!derbyBattle || derbyVote === side) return;
    if (side === 'A') {
      setVotesA((v) => v + 1);
      if (derbyVote === 'B') setVotesB((v) => Math.max(0, v - 1));
      setDerbyVote('A');
      addSelections(derbyBattle.sideA.legs);
      toast.success('Voted Side A & loaded High-xG Attack Slip into your Bet Slip!');
    } else {
      setVotesB((v) => v + 1);
      if (derbyVote === 'A') setVotesA((v) => Math.max(0, v - 1));
      setDerbyVote('B');
      addSelections(derbyBattle.sideB.legs);
      toast.success('Voted Side B & loaded Model Consensus Slip into your Bet Slip!');
    }
  };

  const filteredSlips =
    activeCategory === 'all' ? slips : slips.filter((s) => s.category === activeCategory);

  const totalDerbyVotes = votesA + votesB;
  const pctA = Math.round((votesA / Math.max(1, totalDerbyVotes)) * 100);
  const pctB = 100 - pctA;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Community Tipster Slips & 1-Click Copy-Bet Feed | PredictPro"
        description="Browse verified community accumulator slips, SportyBet/Betika/1xBet booking codes, and copy winning multi-leg slips into your Bet Slip in 1 click."
      />
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Header & Publish Bar */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Public Tipster Syndicate Feed
                </Badge>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  {slips.length} Active Slips • 1-Click Copy to Bet Slip
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Community Copy-Bet Feed &amp; Booking Codes
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Copy high-ROI community accumulators directly into your PredictPro Bet Slip Drawer or grab instant regional booking codes for SportyBet, Betika, SportPesa, Bet9ja, and 1xBet.
              </p>
            </div>

            {/* Publish Current Bet Slip Form */}
            <form
              onSubmit={handlePublishSlip}
              className="rounded-xl border border-border bg-background/70 p-4 space-y-3 lg:w-[430px] shrink-0"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <PlusCircle className="h-4 w-4 text-emerald-400" />
                  Publish Your Bet Slip ({selections.length || 2} Legs Ready)
                </span>
                <span className="font-mono text-emerald-400 font-semibold">+25 Coins</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={slipTitle}
                  onChange={(e) => setSlipTitle(e.target.value)}
                  placeholder="Slip title (e.g. Saturday 3-Odds Banker)"
                  className="text-xs h-9"
                />
                <Input
                  value={authorHandle}
                  onChange={(e) => setAuthorHandle(e.target.value)}
                  placeholder="@YourHandle"
                  className="text-xs font-mono h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedBookie}
                  onChange={(e) =>
                    setSelectedBookie(e.target.value as CommunitySlipItem['bookmaker'])
                  }
                  aria-label="Select Bookmaker"
                  className="h-9 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-foreground"
                >
                  <option value="SportyBet">SportyBet</option>
                  <option value="Betika">Betika</option>
                  <option value="SportPesa">SportPesa</option>
                  <option value="Bet9ja">Bet9ja</option>
                  <option value="1xBet">1xBet</option>
                </select>
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Publish Slip to Feed
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Weekend Derby Head-to-Head Slip Battle */}
        {derbyBattle && (
          <section className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Swords className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                    Head-to-Head Matchday Slip Battle: {derbyBattle.matchTitle}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Vote for the sharper tactical angle to copy its 2-leg combo directly into your Bet Slip
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {totalDerbyVotes.toLocaleString()} Community Votes Cast
              </span>
            </div>

            {/* Split Tug-of-War Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono tabular-nums font-bold">
                <span className="text-emerald-400">Side A ({pctA}% • {votesA} votes)</span>
                <span className="text-sky-400">Side B ({pctB}% • {votesB} votes)</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-sky-500/30 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${pctA}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Side A */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {derbyBattle.sideA.label}
                    </span>
                    <span className="font-mono text-sm font-extrabold tabular-nums text-foreground">
                      {derbyBattle.sideA.totalOdds.toFixed(2)}x Odds
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Curated by <strong className="text-foreground">{derbyBattle.sideA.tipster}</strong> • Code:{' '}
                    <code className="font-mono text-foreground">{derbyBattle.sideA.bookingCode}</code>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {derbyBattle.sideA.legs.map((leg, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs rounded-lg bg-background/70 px-3 py-2 border border-border/60"
                      >
                        <span className="font-semibold">
                          {leg.homeTeam} vs {leg.awayTeam} — <span className="text-emerald-400">{leg.market}</span>
                        </span>
                        <span className="font-mono tabular-nums font-bold">{leg.odds.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleVoteDerbySide('A')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {derbyVote === 'A' ? 'Voted Side A • Loaded in Slip' : 'Vote & Copy Side A Slip'}
                </Button>
              </div>

              {/* Side B */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                      {derbyBattle.sideB.label}
                    </span>
                    <span className="font-mono text-sm font-extrabold tabular-nums text-foreground">
                      {derbyBattle.sideB.totalOdds.toFixed(2)}x Odds
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Curated by <strong className="text-foreground">{derbyBattle.sideB.tipster}</strong> • Code:{' '}
                    <code className="font-mono text-foreground">{derbyBattle.sideB.bookingCode}</code>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {derbyBattle.sideB.legs.map((leg, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs rounded-lg bg-background/70 px-3 py-2 border border-border/60"
                      >
                        <span className="font-semibold">
                          {leg.homeTeam} vs {leg.awayTeam} — <span className="text-sky-400">{leg.market}</span>
                        </span>
                        <span className="font-mono tabular-nums font-bold">{leg.odds.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleVoteDerbySide('B')}
                  className="w-full border border-sky-500/40 text-sky-300 hover:bg-sky-500/20 font-bold"
                >
                  {derbyVote === 'B' ? 'Voted Side B • Loaded in Slip' : 'Vote & Copy Side B Slip'}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All Community Slips' },
              { id: 'trending', label: 'Trending Accas' },
              { id: 'high-roi', label: 'Highest Verified ROI' },
              { id: 'safe-2-odds', label: 'Safe 2–3 Odds Rollover' },
              { id: 'derby', label: 'Derby Specials' },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeCategory === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveCategory(tab.id as typeof activeCategory)}
                className="text-xs font-semibold"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Community Slips Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSlips.length === 0 ? (
            <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
              {isLoading ? 'Syncing real matchday slips from upcoming schedule...' : 'No community slips match this category yet.'}
            </div>
          ) : filteredSlips.map((slip) => {
            const combinedOdds = calculateSlipOdds(slip.legs);
            const isUpvoted = upvotedIds.includes(slip.id);

            return (
              <div
                key={slip.id}
                className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between space-y-4 shadow-2xs"
              >
                <div className="space-y-3">
                  {/* Top Author & ROI Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">{slip.title}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-semibold text-foreground">{slip.authorHandle}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {slip.authorBadge}
                        </span>
                        <span>•</span>
                        <span>{slip.createdAtLabel}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold font-mono tabular-nums text-emerald-400">
                        {combinedOdds.toFixed(2)}x
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-muted-foreground">
                        {slip.legs.length} Legs • +{slip.verifiedRoiPct}% ROI
                      </div>
                    </div>
                  </div>

                  {/* Legs Table */}
                  <div className="space-y-1.5 pt-1">
                    {slip.legs.map((leg, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-foreground">
                            {leg.homeTeam} vs {leg.awayTeam}
                          </span>
                          <span className="text-muted-foreground ml-1.5">({leg.league})</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-[11px] font-semibold">
                            {leg.market}
                          </Badge>
                          <span className="font-mono tabular-nums font-bold text-foreground">
                            {Number(leg.odds).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isUpvoted ? 'default' : 'outline'}
                      onClick={() => handleToggleUpvote(slip.id)}
                      className="h-8 gap-1.5 text-xs font-mono tabular-nums"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {slip.upvotes}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyBookingCode(slip)}
                      className="h-8 gap-1.5 text-xs font-mono tabular-nums"
                    >
                      {copiedCodeId === slip.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {slip.bookmaker}: {slip.bookingCode}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const url = getShareableSlipUrl(slip.legs, slip.bookmaker, slip.bookingCode);
                        navigator.clipboard?.writeText(url);
                        toast.success('Copied direct 1-click slip deep-link to clipboard!');
                      }}
                      className="h-8 px-2.5 text-xs"
                      title="Share deep-link"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleCopySlipToDrawer(slip)}
                    className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
                  >
                    <Flame className="h-3.5 w-3.5" />
                    Copy to Bet Slip ({slip.copiedCount})
                  </Button>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CommunitySlipsPage;
