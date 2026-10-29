import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TipsterFeedSkeleton } from '@/components/PredictionCardSkeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBetSlip } from '@/hooks/useBetSlip';
import {
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Star,
  Send,
  TrendingUp,
  Users,
  Coins,
  Lock,
  Copy,
  Plus,
  UserPlus,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/EmptyState';
import {
  VERIFIED_TIPSTER_PROFILES,
  VerifiedTipsterProfile,
  getFollowedTipsterIds,
  toggleFollowTipsterId,
  getUnlockedTipsterSlipIds,
  getPredictProCoinsBalance,
  unlockTipsterSlipWithCoins,
} from '@/services/phase13EdgeService';

interface Tip {
  id: string;
  user_id: string;
  match: string;
  prediction: string;
  reasoning: string;
  odds: number;
  likes: number;
  dislikes: number;
  created_at: string;
  profiles?: { full_name: string };
  user_vote?: 'like' | 'dislike' | null;
}

const DEFAULT_COMMUNITY_TIPS: Tip[] = [
  {
    id: 'tip-1',
    user_id: 'tipster-victor',
    match: 'Arsenal vs Chelsea',
    prediction: 'Arsenal Win & Over 1.5 Goals',
    reasoning:
      'Arsenal averaging 2.34 xG at the Emirates over their last 8 home league fixtures while Chelsea have conceded in 7 straight away matches.',
    odds: 1.92,
    likes: 34,
    dislikes: 3,
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    profiles: { full_name: 'Victor K.' },
  },
  {
    id: 'tip-2',
    user_id: 'tipster-grace',
    match: 'Real Madrid vs Barcelona',
    prediction: 'Both Teams to Score & Over 2.5',
    reasoning:
      'El Clásico high defensive lines and transitional pace on both wings make BTTS + Over 2.5 the strongest mathematical play.',
    odds: 1.85,
    likes: 28,
    dislikes: 2,
    created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    profiles: { full_name: 'Grace M.' },
  },
  {
    id: 'tip-3',
    user_id: 'tipster-john',
    match: 'Gor Mahia vs AFC Leopards',
    prediction: 'Under 2.5 Goals (1X Double Chance)',
    reasoning:
      'Mashemeji Derby tactical discipline historically keeps total goals below 2.5 in 78% of recent meetings, with Gor Mahia holding edge.',
    odds: 1.74,
    likes: 21,
    dislikes: 1,
    created_at: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
    profiles: { full_name: 'John O.' },
  },
];

const LOCAL_TIPS_KEY = 'predictpro_community_tips_v1';

export default function Tipsters() {
  const { user } = useAuth();
  const { addSelections, setIsOpen } = useBetSlip();

  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ match: '', prediction: '', reasoning: '', odds: '' });
  const [submitting, setSubmitting] = useState(false);

  // Phase 13 Verified Tipsters & Yield Leaderboard state
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('All');
  const [followedIds, setFollowedIds] = useState<string[]>(() => getFollowedTipsterIds());
  const [unlockedSlipIds, setUnlockedSlipIds] = useState<string[]>(() =>
    getUnlockedTipsterSlipIds()
  );
  const [coinsBalance, setCoinsBalance] = useState<number>(() => getPredictProCoinsBalance());
  const [selectedTipsterId, setSelectedTipsterId] = useState<string>(
    VERIFIED_TIPSTER_PROFILES[0].id
  );

  useEffect(() => {
    const syncCoins = () => setCoinsBalance(getPredictProCoinsBalance());
    window.addEventListener('storage', syncCoins);
    return () => window.removeEventListener('storage', syncCoins);
  }, []);

  const fetchTips = async () => {
    try {
      const { data } = await (supabase as any)
        .from('community_tips')
        .select('*, profiles(full_name)')
        .order('likes', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30);

      if (data && Array.isArray(data) && data.length > 0) {
        setTips(data as Tip[]);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback to local / seeded community tips
    }

    try {
      const saved = localStorage.getItem(LOCAL_TIPS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Tip[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTips(parsed);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Ignore storage error
    }

    setTips(DEFAULT_COMMUNITY_TIPS);
    setLoading(false);
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const filteredVerifiedTipsters = useMemo(() => {
    return VERIFIED_TIPSTER_PROFILES.filter((tp) => {
      if (specialtyFilter === 'All') return true;
      if (specialtyFilter === 'Followed') return followedIds.includes(tp.id);
      return tp.specialty === specialtyFilter;
    });
  }, [specialtyFilter, followedIds]);

  const activeTipster = useMemo(() => {
    return (
      VERIFIED_TIPSTER_PROFILES.find((t) => t.id === selectedTipsterId) ||
      VERIFIED_TIPSTER_PROFILES[0]
    );
  }, [selectedTipsterId]);

  const handleFollowToggle = (tipster: VerifiedTipsterProfile) => {
    const res = toggleFollowTipsterId(tipster.id);
    setFollowedIds(res.followedIds);
    toast.success(
      res.isNowFollowed
        ? `Following ${tipster.handle} — new slips will appear in your feed`
        : `Unfollowed ${tipster.handle}`
    );
  };

  const handleUnlockVipSlip = (tipster: VerifiedTipsterProfile) => {
    const res = unlockTipsterSlipWithCoins(tipster.id, tipster.unlockCoinCost);
    setCoinsBalance(res.newBalance);
    setUnlockedSlipIds(res.unlockedIds);
    if (res.ok) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleCopyTipsterSlip = (tipster: VerifiedTipsterProfile) => {
    const isLocked = tipster.isVipCoinLocked && !unlockedSlipIds.includes(tipster.id);
    if (isLocked) {
      toast.error(`Unlock ${tipster.handle}'s VIP Slip with ${tipster.unlockCoinCost} Coins first!`);
      return;
    }

    const items = tipster.activeSlipLegs.map((leg) => ({
      homeTeam: leg.homeTeam,
      awayTeam: leg.awayTeam,
      match: `${leg.homeTeam} vs ${leg.awayTeam}`,
      league: leg.league,
      market: leg.market,
      selection: leg.market,
      odds: leg.odds,
      confidence: leg.confidence,
    }));

    addSelections(items);
    setIsOpen(true);
    toast.success(`Copied ${tipster.handle}'s ${items.length}-leg slip into your Bet Slip Drawer!`);
  };

  const submitTip = async () => {
    if (!user) {
      toast.error('Sign in to share tips');
      return;
    }
    if (!form.match || !form.prediction || !form.reasoning) {
      toast.error('Fill all fields');
      return;
    }
    setSubmitting(true);
    const newTip: Tip = {
      id: `tip-${Date.now()}`,
      user_id: user.id,
      match: form.match.trim(),
      prediction: form.prediction.trim(),
      reasoning: form.reasoning.trim(),
      odds: parseFloat(form.odds) || 1.85,
      likes: 1,
      dislikes: 0,
      created_at: new Date().toISOString(),
      profiles: { full_name: user.email?.split('@')[0] || 'Community Tipster' },
      user_vote: 'like',
    };

    try {
      await (supabase as any).from('community_tips').insert({
        user_id: user.id,
        match: newTip.match,
        prediction: newTip.prediction,
        reasoning: newTip.reasoning,
        odds: newTip.odds,
        likes: 0,
        dislikes: 0,
      });
    } catch {
      // Persist locally below
    } finally {
      const updated = [newTip, ...tips];
      setTips(updated);
      try {
        localStorage.setItem(LOCAL_TIPS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      toast.success('Tip shared with the community!');
      setForm({ match: '', prediction: '', reasoning: '', odds: '' });
      setShowForm(false);
      setSubmitting(false);
    }
  };

  const vote = async (tipId: string, type: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Sign in to vote');
      return;
    }
    const tip = tips.find((t) => t.id === tipId);
    if (tip?.user_vote === type) return;
    const delta =
      type === 'like'
        ? { likes: (tip?.likes ?? 0) + 1 }
        : { dislikes: (tip?.dislikes ?? 0) + 1 };
    setTips((prev) => {
      const next = prev.map((t) =>
        t.id === tipId ? { ...t, ...delta, user_vote: type } : t
      );
      try {
        localStorage.setItem(LOCAL_TIPS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    try {
      await (supabase as any)
        .from('tip_votes')
        .upsert({ tip_id: tipId, user_id: user.id, vote: type }, { onConflict: 'tip_id,user_id' });
      await (supabase as any).from('community_tips').update(delta).eq('id', tipId);
    } catch {
      // Saved locally
    }
  };

  const topTipsters = [
    ...new Map(
      tips.map((t) => [
        t.user_id,
        {
          name: t.profiles?.full_name ?? 'Anonymous',
          tips: tips.filter((x) => x.user_id === t.user_id).length,
          likes: tips
            .filter((x) => x.user_id === t.user_id)
            .reduce((s, x) => s + x.likes, 0),
        },
      ])
    ).values(),
  ]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 5);

  const isSelectedVipLocked =
    activeTipster.isVipCoinLocked && !unlockedSlipIds.includes(activeTipster.id);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Verified Football Tipsters, 30-Day ROI Leaderboard & Community Tips | PredictPro"
        description="Follow verified high-ROI football tipsters, inspect 30-day yield curves and Closing Line Value (CLV) grades, unlock VIP slips with PredictPro Coins, and copy winning booking codes."
        keywords="verified football tipsters, tipster roi leaderboard, best football tipsters kenya nigeria, copy tipster booking codes, community football tips"
        canonical="/tipsters"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        {/* Phase 13 Verified Tipster Yield Leaderboard Header */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-emerald-500">Verified Quantitative Track Record</span>
                <span aria-hidden="true">·</span>
                <span>30-Day Yield &amp; CLV Audited</span>
                <span aria-hidden="true">·</span>
                <span>1-Click Slip Tailing</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                <Users className="h-7 w-7 text-primary shrink-0" />
                <span>Verified Tipster Profiles &amp; 30-Day Yield Hub</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track verified analysts ranked by <strong className="text-foreground">30-Day Net Yield (%)</strong> and <strong className="text-foreground">Closing Line Value (CLV) beat rate</strong>. Copy free daily slips in one click or spend your earned PredictPro Coins to unlock high-odds VIP Syndicate tickets.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="px-3.5 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center gap-2">
                <Coins className="h-4 w-4 text-amber-400" />
                <div className="text-xs">
                  <span className="text-muted-foreground">Wallet: </span>
                  <strong className="font-mono tabular-nums text-amber-400">
                    {coinsBalance.toLocaleString()} Coins
                  </strong>
                </div>
              </div>
              <Link
                to="/pick-em-challenge"
                className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Earn Free Coins →
              </Link>
              <Button onClick={() => setShowForm((f) => !f)} size="sm" className="gap-1.5 text-xs font-bold">
                <Send className="h-3.5 w-3.5" />
                {showForm ? 'Cancel' : 'Share a Tip'}
              </Button>
            </div>
          </div>

          {/* Specialty Filter Tabs */}
          <div className="pt-3 border-t border-border/60 flex items-center gap-1.5 flex-wrap">
            {['All', '1X2 Value', 'High-Odds Accas', 'Over 2.5 Goals', 'Player Props', 'Followed'].map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSpecialtyFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    specialtyFilter === tab
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'Followed' ? `Followed (${followedIds.length})` : tab}
                </button>
              )
            )}
          </div>
        </section>

        {/* Verified Tipster Leaderboard + Active Slip Inspector */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Verified Tipsters Cards */}
          <div className="lg:col-span-7 space-y-3">
            {filteredVerifiedTipsters.map((tp, idx) => {
              const isSelected = tp.id === activeTipster.id;
              const isFollowed = followedIds.includes(tp.id);
              const isUnlocked = !tp.isVipCoinLocked || unlockedSlipIds.includes(tp.id);

              return (
                <div
                  key={tp.id}
                  onClick={() => setSelectedTipsterId(tp.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedTipsterId(tp.id);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:border-border/90'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary font-mono font-extrabold text-sm flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">{tp.handle}</span>
                          <span aria-hidden="true">·</span>
                          <span>{tp.region}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400 font-semibold">{tp.verifiedBadge}</span>
                        </div>
                        <h2 className="text-sm font-extrabold text-foreground mt-0.5">
                          {tp.displayName}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isFollowed ? 'outline' : 'default'}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(tp);
                        }}
                        className="h-8 text-xs font-bold gap-1"
                      >
                        {isFollowed ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" />
                            Follow
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Quantitative Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-border/60 font-mono tabular-nums text-xs">
                    <div>
                      <div className="text-[10px] font-sans text-muted-foreground">30D Net Yield</div>
                      <div className="font-extrabold text-emerald-400">+{tp.roi30dPct.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-sans text-muted-foreground">Strike Rate</div>
                      <div className="font-bold text-foreground">{tp.winStrikeRatePct.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-sans text-muted-foreground">CLV Beat Rate</div>
                      <div className="font-bold text-cyan-400">{tp.clvBeatRatePct}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-sans text-muted-foreground">Avg Odds</div>
                      <div className="font-bold text-foreground">{tp.avgOdds.toFixed(2)}x</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-sans text-muted-foreground">Active Slip</div>
                      <div className="font-bold text-amber-400">
                        {isUnlocked ? `${tp.activeSlipTotalOdds.toFixed(2)}x Open` : `${tp.unlockCoinCost} Coins VIP`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 5 Cols: Active Tipster Performance Sheet & Slip Unlocker */}
          <div className="lg:col-span-5 rounded-xl border border-border bg-card p-5 space-y-4 sticky top-28">
            <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
              <div>
                <div className="text-xs font-semibold text-primary">
                  {activeTipster.handle} · {activeTipster.specialty}
                </div>
                <h3 className="text-base font-extrabold text-foreground">
                  {activeTipster.activeSlipTitle}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeTipster.settledPicksCount} Verified Picks · {activeTipster.currentStreak}
                </p>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-[10px] text-muted-foreground">Combined Odds</div>
                <div className="text-lg font-extrabold text-emerald-400">
                  {activeTipster.activeSlipTotalOdds.toFixed(2)}x
                </div>
              </div>
            </div>

            {/* Recent 10-Pick Form Strip & 30-Day Equity Curve */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">
                  Last 10 Settlements &amp; 30D Equity Curve
                </span>
                <span className="font-mono tabular-nums text-emerald-400 font-bold">
                  {activeTipster.equityCurve[0]}u →{' '}
                  {activeTipster.equityCurve[activeTipster.equityCurve.length - 1]}u (+
                  {activeTipster.roi30dPct.toFixed(1)}%)
                </span>
              </div>
              <div className="grid grid-cols-10 gap-1 items-end h-12 px-2.5 py-2 rounded-lg border border-border bg-background/60">
                {activeTipster.equityCurve.map((val, idx) => {
                  const minVal = Math.min(...activeTipster.equityCurve);
                  const maxVal = Math.max(...activeTipster.equityCurve);
                  const pct = maxVal > minVal ? ((val - minVal) / (maxVal - minVal)) * 75 + 25 : 50;
                  return (
                    <div
                      key={idx}
                      title={`Checkpoint ${idx + 1}: ${val}u`}
                      className="w-full rounded-xs bg-emerald-500/70 hover:bg-emerald-400 transition-colors"
                      style={{ height: `${Math.round(pct)}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5">
                {activeTipster.recentForm.map((res, idx) => (
                  <span
                    key={idx}
                    className={`h-6 w-6 rounded text-[11px] font-mono font-bold flex items-center justify-center ${
                      res === 'W'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : res === 'L'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed bg-background/60 p-3 rounded-lg border border-border">
              {activeTipster.activeSlipAnalysis}
            </p>

            {/* Slip Legs or VIP Coin Unlock Gate */}
            {isSelectedVipLocked ? (
              <div className="p-5 rounded-xl border border-amber-500/40 bg-amber-500/5 text-center space-y-3">
                <Lock className="h-6 w-6 text-amber-400 mx-auto" />
                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-foreground">
                    VIP Syndicate Slip ({activeTipster.activeSlipLegs.length} Verified Legs ·{' '}
                    {activeTipster.activeSlipTotalOdds.toFixed(2)}x)
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unlock all {activeTipster.activeSlipLegs.length} legs and regional booking codes instantly using your PredictPro Coins.
                  </p>
                </div>
                <Button
                  onClick={() => handleUnlockVipSlip(activeTipster)}
                  className="w-full gap-1.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950"
                >
                  <Coins className="h-4 w-4" />
                  Unlock VIP Slip for {activeTipster.unlockCoinCost} Coins
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeTipster.activeSlipLegs.map((leg) => (
                  <div
                    key={`${leg.homeTeam}-${leg.awayTeam}`}
                    className="p-3 rounded-lg border border-border bg-background/60 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {leg.homeTeam} vs {leg.awayTeam}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-semibold">
                        {leg.market} · <span className="text-muted-foreground">{leg.league}</span>
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-xs font-extrabold text-foreground">
                        {leg.odds.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{leg.confidence}% Conf</div>
                    </div>
                  </div>
                ))}

                {/* Booking Codes Strip */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {Object.entries(activeTipster.activeSlipBookingCodes).map(([bookie, code]) => (
                    <button
                      key={bookie}
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        toast.success(`Copied ${bookie} code: ${code}`);
                      }}
                      className="px-2.5 py-1 rounded border border-border bg-muted/60 hover:bg-muted text-[11px] font-mono font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{bookie}:</span>
                      <strong className="text-primary">{code}</strong>
                      <Copy className="h-3 w-3 ml-0.5 text-muted-foreground" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => handleCopyTipsterSlip(activeTipster)}
                    className="flex-1 gap-1.5 text-xs font-bold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Copy All {activeTipster.activeSlipLegs.length} Legs to Bet Slip
                  </Button>
                  <Link
                    to="/code-converter"
                    className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Convert Code →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Community Tips Feed & Submission Section */}
        <section className="pt-4 border-t border-border/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Open Community Matchday Tips &amp; Voting Feed
              </h2>
              <p className="text-xs text-muted-foreground">
                Share single-match value picks with fellow punters and upvote accurate analysis
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {showForm && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Share Your Tip</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label htmlFor="tip-match-input" className="sr-only">
                        Match fixture
                      </label>
                      <Input
                        id="tip-match-input"
                        placeholder="Match (e.g. Arsenal vs Chelsea)"
                        value={form.match}
                        onChange={(e) => setForm((f) => ({ ...f, match: e.target.value }))}
                        aria-label="Match fixture"
                      />
                    </div>
                    <div>
                      <label htmlFor="tip-prediction-input" className="sr-only">
                        Prediction
                      </label>
                      <Input
                        id="tip-prediction-input"
                        placeholder="Prediction (e.g. Arsenal Win / Over 2.5)"
                        value={form.prediction}
                        onChange={(e) => setForm((f) => ({ ...f, prediction: e.target.value }))}
                        aria-label="Prediction outcome"
                      />
                    </div>
                    <div>
                      <label htmlFor="tip-odds-input" className="sr-only">
                        Odds
                      </label>
                      <Input
                        id="tip-odds-input"
                        placeholder="Odds (e.g. 1.85)"
                        type="number"
                        step="0.01"
                        value={form.odds}
                        onChange={(e) => setForm((f) => ({ ...f, odds: e.target.value }))}
                        aria-label="Estimated odds"
                      />
                    </div>
                    <div>
                      <label htmlFor="tip-reasoning-input" className="sr-only">
                        Reasoning
                      </label>
                      <Textarea
                        id="tip-reasoning-input"
                        placeholder="Your reasoning (min 20 chars)..."
                        value={form.reasoning}
                        onChange={(e) => setForm((f) => ({ ...f, reasoning: e.target.value }))}
                        rows={3}
                        aria-label="Analysis and reasoning"
                      />
                    </div>
                    <Button onClick={submitTip} disabled={submitting} className="w-full">
                      {submitting ? 'Submitting...' : 'Share Tip'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {loading ? (
                <TipsterFeedSkeleton count={4} />
              ) : tips.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No tips yet"
                  description="Be the first to share a tip with the community!"
                  actionLabel="Share a Tip"
                  onAction={() => setShowForm(true)}
                />
              ) : (
                tips.map((tip) => (
                  <Card key={tip.id} className="hover:border-primary/20 transition-all">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {(tip.profiles?.full_name ?? 'A').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">
                              {tip.profiles?.full_name ?? 'Anonymous'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(tip.created_at).toLocaleDateString('en-KE')}
                            </span>
                            {tip.odds && (
                              <Badge variant="outline" className="text-xs font-mono tabular-nums">
                                @ {tip.odds}
                              </Badge>
                            )}
                          </div>
                          <p className="font-bold mt-1">{tip.match}</p>
                          <Badge className="my-1.5 bg-primary/10 text-primary border-primary/20">
                            {tip.prediction}
                          </Badge>
                          <p className="text-sm text-muted-foreground">{tip.reasoning}</p>
                          <div className="flex gap-3 mt-3">
                            <button
                              type="button"
                              onClick={() => vote(tip.id, 'like')}
                              aria-label={`Like tip for ${tip.match}, currently ${tip.likes} likes`}
                              className={`flex items-center gap-1.5 text-sm min-h-[40px] px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                tip.user_vote === 'like'
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-muted hover:bg-emerald-500/20'
                              }`}
                            >
                              <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                              {tip.likes}
                            </button>
                            <button
                              type="button"
                              onClick={() => vote(tip.id, 'dislike')}
                              aria-label={`Dislike tip for ${tip.match}, currently ${tip.dislikes} dislikes`}
                              className={`flex items-center gap-1.5 text-sm min-h-[40px] px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                                tip.user_vote === 'dislike'
                                  ? 'bg-rose-700 text-white'
                                  : 'bg-muted hover:bg-rose-500/20'
                              }`}
                            >
                              <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
                              {tip.dislikes}
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Top Community Contributors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topTipsters.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tipsters yet
                    </p>
                  ) : (
                    topTipsters.map((t, i) => (
                      <div key={t.name} className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0
                              ? 'bg-yellow-400 text-yellow-900'
                              : i === 1
                              ? 'bg-gray-300 text-gray-700'
                              : i === 2
                              ? 'bg-orange-400 text-orange-900'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.tips} tips · {t.likes} likes
                          </p>
                        </div>
                        {i === 0 && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
