import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useBetSlip, BetSelectionInput } from '@/hooks/useBetSlip';
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

const SEED_COMMUNITY_SLIPS: CommunitySlipItem[] = [
  {
    id: 'slip-epl-ucl-banker',
    title: 'Weekend European xG Banker Treble',
    authorHandle: '@NairobiSharp_254',
    authorBadge: 'Verified +34.8% ROI',
    verifiedRoiPct: 34.8,
    winStreak: 6,
    bookmaker: 'SportyBet',
    bookingCode: 'SP-894K2M',
    category: 'high-roi',
    upvotes: 142,
    copiedCount: 418,
    createdAtLabel: '18m ago',
    legs: [
      {
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        league: 'Premier League',
        market: 'Over 1.5 Goals',
        odds: 1.28,
        confidence: 88,
      },
      {
        homeTeam: 'Real Madrid',
        awayTeam: 'Villarreal',
        league: 'LaLiga',
        market: 'Home Win',
        odds: 1.44,
        confidence: 85,
      },
      {
        homeTeam: 'Bayern Munich',
        awayTeam: 'Bayer Leverkusen',
        league: 'Bundesliga',
        market: 'Both Teams To Score',
        odds: 1.52,
        confidence: 82,
      },
    ],
  },
  {
    id: 'slip-safe-2odds-rollover',
    title: 'Daily Sure 2.15x Low-Variance Double',
    authorHandle: '@KariakooBanker',
    authorBadge: '9-Day Rollover Streak',
    verifiedRoiPct: 28.4,
    winStreak: 9,
    bookmaker: 'Betika',
    bookingCode: 'BT-742X9',
    category: 'safe-2-odds',
    upvotes: 198,
    copiedCount: 612,
    createdAtLabel: '42m ago',
    legs: [
      {
        homeTeam: 'Inter Milan',
        awayTeam: 'Torino',
        league: 'Serie A',
        market: 'Home Win',
        odds: 1.48,
        confidence: 87,
      },
      {
        homeTeam: 'PSG',
        awayTeam: 'Monaco',
        league: 'Ligue 1',
        market: 'Over 2.5 Goals',
        odds: 1.45,
        confidence: 84,
      },
    ],
  },
  {
    id: 'slip-lagos-value-acca',
    title: 'Sharp CLV Value 4-Fold Accumulator',
    authorHandle: '@LagosAccaKing',
    authorBadge: 'Gold Syndicate',
    verifiedRoiPct: 41.2,
    winStreak: 4,
    bookmaker: 'Bet9ja',
    bookingCode: 'B9-551Q8',
    category: 'trending',
    upvotes: 116,
    copiedCount: 309,
    createdAtLabel: '1h ago',
    legs: [
      {
        homeTeam: 'Liverpool',
        awayTeam: 'Aston Villa',
        league: 'Premier League',
        market: 'Home Win & Over 1.5',
        odds: 1.62,
        confidence: 83,
      },
      {
        homeTeam: 'Barcelona',
        awayTeam: 'Sevilla',
        league: 'LaLiga',
        market: 'Home Win',
        odds: 1.38,
        confidence: 86,
      },
      {
        homeTeam: 'Borussia Dortmund',
        awayTeam: 'RB Leipzig',
        league: 'Bundesliga',
        market: 'Over 2.5 Goals',
        odds: 1.55,
        confidence: 80,
      },
      {
        homeTeam: 'Sporting CP',
        awayTeam: 'Braga',
        league: 'Primeira Liga',
        market: 'Home Win',
        odds: 1.50,
        confidence: 82,
      },
    ],
  },
  {
    id: 'slip-east-africa-derby',
    title: 'CAF & East Africa Premier Banker Pack',
    authorHandle: '@KampalaValueBet',
    authorBadge: 'Regional Specialist',
    verifiedRoiPct: 24.9,
    winStreak: 5,
    bookmaker: 'SportPesa',
    bookingCode: 'SP-319W4',
    category: 'derby',
    upvotes: 89,
    copiedCount: 245,
    createdAtLabel: '2h ago',
    legs: [
      {
        homeTeam: 'Gor Mahia',
        awayTeam: 'Tusker FC',
        league: 'FKF Premier League',
        market: 'Draw No Bet - Home',
        odds: 1.42,
        confidence: 84,
      },
      {
        homeTeam: 'Young Africans',
        awayTeam: 'Simba SC',
        league: 'NBC Premier League',
        market: 'Over 1.5 Goals',
        odds: 1.36,
        confidence: 83,
      },
      {
        homeTeam: 'Al Ahly',
        awayTeam: 'Pyramids FC',
        league: 'Egyptian Premier League',
        market: 'Home Or Draw (1X)',
        odds: 1.29,
        confidence: 88,
      },
    ],
  },
];

const DERBY_BATTLE_SIDES = {
  matchTitle: 'Arsenal vs Chelsea & Real Madrid vs Atletico',
  subtitle: 'Weekend Marquee Derby Slip Showdown',
  sideA: {
    label: 'Side A: High-xG Over & BTTS Attack',
    tipster: '@xG_Professor_UK',
    bookmaker: '1xBet',
    bookingCode: '1X-908A4K',
    totalOdds: 3.12,
    initialVotes: 384,
    legs: [
      {
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        league: 'Premier League',
        market: 'Both Teams To Score & Over 2.5',
        odds: 1.95,
        confidence: 79,
      },
      {
        homeTeam: 'Real Madrid',
        awayTeam: 'Atletico Madrid',
        league: 'LaLiga',
        market: 'Over 2.5 Goals',
        odds: 1.60,
        confidence: 81,
      },
    ] as BetSelectionInput[],
  },
  sideB: {
    label: 'Side B: Tactical Low-Block & Home Control',
    tipster: '@NairobiSharp_254',
    bookmaker: 'SportyBet',
    bookingCode: 'SP-442L9P',
    totalOdds: 2.38,
    initialVotes: 429,
    legs: [
      {
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        league: 'Premier League',
        market: 'Arsenal Win (1X2)',
        odds: 1.65,
        confidence: 84,
      },
      {
        homeTeam: 'Real Madrid',
        awayTeam: 'Atletico Madrid',
        league: 'LaLiga',
        market: 'Real Madrid Draw No Bet',
        odds: 1.44,
        confidence: 86,
      },
    ] as BetSelectionInput[],
  },
};

const STORAGE_KEY_COMMUNITY_SLIPS = 'predictpro_community_slips_v1';
const STORAGE_KEY_UPVOTED = 'predictpro_upvoted_slips_v1';

export const CommunitySlipsPage: React.FC = () => {
  const { selections, addSelections, generateBookingCode, getShareableSlipUrl } = useBetSlip();

  const [slips, setSlips] = useState<CommunitySlipItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMMUNITY_SLIPS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return SEED_COMMUNITY_SLIPS;
  });

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
  const [votesA, setVotesA] = useState(DERBY_BATTLE_SIDES.sideA.initialVotes);
  const [votesB, setVotesB] = useState(DERBY_BATTLE_SIDES.sideB.initialVotes);

  const calculateSlipOdds = (legs: BetSelectionInput[]) => {
    const raw = legs.reduce((acc, l) => acc * (Number(l.odds) || 1.4), 1);
    return Math.round(raw * 100) / 100;
  };

  const handleCopySlipToDrawer = (slip: CommunitySlipItem) => {
    addSelections(slip.legs);
    setSlips((prev) =>
      prev.map((item) =>
        item.id === slip.id ? { ...item, copiedCount: item.copiedCount + 1 } : item
      )
    );
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

    setSlips((prev) => {
      const updated = prev.map((s) =>
        s.id === slipId
          ? { ...s, upvotes: alreadyUpvoted ? Math.max(0, s.upvotes - 1) : s.upvotes + 1 }
          : s
      );
      try {
        localStorage.setItem(STORAGE_KEY_COMMUNITY_SLIPS, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handlePublishSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const activeLegs: BetSelectionInput[] =
      selections.length > 0
        ? selections
        : [
            {
              homeTeam: 'Arsenal',
              awayTeam: 'Chelsea',
              league: 'Premier League',
              market: 'Over 2.5 Goals',
              odds: 1.72,
              confidence: 84,
            },
            {
              homeTeam: 'Real Madrid',
              awayTeam: 'Villarreal',
              league: 'LaLiga',
              market: 'Home Win',
              odds: 1.45,
              confidence: 86,
            },
          ];

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

    const updated = [newSlip, ...slips];
    setSlips(updated);
    try {
      localStorage.setItem(STORAGE_KEY_COMMUNITY_SLIPS, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setSlipTitle('');
    toast.success(`Published "${newSlip.title}" to the Community Feed! (+25 PredictPro Coins)`);
  };

  const handleVoteDerbySide = (side: 'A' | 'B') => {
    if (derbyVote === side) return;
    if (side === 'A') {
      setVotesA((v) => v + 1);
      if (derbyVote === 'B') setVotesB((v) => Math.max(0, v - 1));
      setDerbyVote('A');
      addSelections(DERBY_BATTLE_SIDES.sideA.legs);
      toast.success('Voted Side A & loaded High-xG Attack Slip into your Bet Slip!');
    } else {
      setVotesB((v) => v + 1);
      if (derbyVote === 'A') setVotesA((v) => Math.max(0, v - 1));
      setDerbyVote('B');
      addSelections(DERBY_BATTLE_SIDES.sideB.legs);
      toast.success('Voted Side B & loaded Tactical Banker Slip into your Bet Slip!');
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
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Swords className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Head-to-Head Derby Slip Battle: {DERBY_BATTLE_SIDES.matchTitle}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Vote for the sharper tactical angle to copy its 2-leg derby combo directly into your Bet Slip
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
                    {DERBY_BATTLE_SIDES.sideA.label}
                  </span>
                  <span className="font-mono text-sm font-extrabold tabular-nums text-foreground">
                    {DERBY_BATTLE_SIDES.sideA.totalOdds.toFixed(2)}x Odds
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Curated by <strong className="text-foreground">{DERBY_BATTLE_SIDES.sideA.tipster}</strong> • Code:{' '}
                  <code className="font-mono text-foreground">{DERBY_BATTLE_SIDES.sideA.bookingCode}</code>
                </div>
                <div className="space-y-1.5 pt-1">
                  {DERBY_BATTLE_SIDES.sideA.legs.map((leg, i) => (
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
                    {DERBY_BATTLE_SIDES.sideB.label}
                  </span>
                  <span className="font-mono text-sm font-extrabold tabular-nums text-foreground">
                    {DERBY_BATTLE_SIDES.sideB.totalOdds.toFixed(2)}x Odds
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Curated by <strong className="text-foreground">{DERBY_BATTLE_SIDES.sideB.tipster}</strong> • Code:{' '}
                  <code className="font-mono text-foreground">{DERBY_BATTLE_SIDES.sideB.bookingCode}</code>
                </div>
                <div className="space-y-1.5 pt-1">
                  {DERBY_BATTLE_SIDES.sideB.legs.map((leg, i) => (
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
          {filteredSlips.map((slip) => {
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
