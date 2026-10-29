import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Share2,
  Copy,
  Check,
  Gift,
  Trophy,
  Users,
  Coins,
  Sparkles,
  MessageCircle,
  Send,
  ShieldCheck,
  Award,
  ArrowRight,
  UserPlus,
  Stamp,
} from 'lucide-react';

interface ReferralMilestone {
  id: string;
  tier: string;
  invitesRequired: number;
  coinReward: number;
  perkTitle: string;
  perkDescription: string;
  accentClass: string;
}

interface ReferralLeader {
  rank: number;
  handle: string;
  region: string;
  verifiedInvites: number;
  coinsEarned: number;
  tierBadge: string;
}

const MILESTONE_TIERS: ReferralMilestone[] = [
  {
    id: 'bronze-scout',
    tier: 'Bronze Scout',
    invitesRequired: 1,
    coinReward: 250,
    perkTitle: '+250 PredictPro Coins & Scout Flair',
    perkDescription: 'Instant wallet credit unlocked as soon as your first invited friend opens a shared slip or match page.',
    accentClass: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  },
  {
    id: 'silver-tactician',
    tier: 'Silver Tactician',
    invitesRequired: 3,
    coinReward: 750,
    perkTitle: '+750 Coins & Priority Acca Generator Boost',
    perkDescription: 'Unlocks multi-bookie code conversion presets and Silver Tactician badge on Community Slips.',
    accentClass: 'border-slate-400/30 bg-slate-400/5 text-slate-300',
  },
  {
    id: 'gold-syndicate',
    tier: 'Gold Syndicate',
    invitesRequired: 5,
    coinReward: 1500,
    perkTitle: '+1,500 Coins & Verified Syndicate Badge',
    perkDescription: 'Featured placement on the Community Tipster Feed with Verified ROI tracking.',
    accentClass: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400',
  },
  {
    id: 'diamond-ambassador',
    tier: 'Diamond Ambassador',
    invitesRequired: 10,
    coinReward: 5000,
    perkTitle: '+5,000 Coins & Custom Slip Watermark Studio',
    perkDescription: 'Embed your own custom @handle or Telegram channel watermark on every exported PNG slip card.',
    accentClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  },
];

const INITIAL_LEADERBOARD: ReferralLeader[] = [
  { rank: 1, handle: '@NairobiSharp_254', region: 'KE', verifiedInvites: 48, coinsEarned: 14250, tierBadge: 'Diamond Ambassador' },
  { rank: 2, handle: '@LagosAccaKing', region: 'NG', verifiedInvites: 39, coinsEarned: 11800, tierBadge: 'Diamond Ambassador' },
  { rank: 3, handle: '@KariakooBanker', region: 'TZ', verifiedInvites: 27, coinsEarned: 8450, tierBadge: 'Diamond Ambassador' },
  { rank: 4, handle: '@xG_Professor_UK', region: 'GB', verifiedInvites: 19, coinsEarned: 6200, tierBadge: 'Diamond Ambassador' },
  { rank: 5, handle: '@SowetoPoisson', region: 'ZA', verifiedInvites: 14, coinsEarned: 5100, tierBadge: 'Diamond Ambassador' },
  { rank: 6, handle: '@KampalaValueBet', region: 'UG', verifiedInvites: 9, coinsEarned: 2950, tierBadge: 'Gold Syndicate' },
  { rank: 7, handle: '@AccraOddsMaster', region: 'GH', verifiedInvites: 6, coinsEarned: 2150, tierBadge: 'Gold Syndicate' },
];

const REF_CODE_STORAGE_KEY = 'predictpro_my_ref_code_v1';
const REF_COUNT_STORAGE_KEY = 'predictpro_verified_invites_v1';
const CLAIMED_TIERS_STORAGE_KEY = 'predictpro_claimed_ref_tiers_v1';
const CUSTOM_WATERMARK_KEY = 'predictpro_custom_watermark';

export const ViralReferralHubPage: React.FC = () => {
  const [refCode, setRefCode] = useState<string>(() => {
    try {
      const existing = localStorage.getItem(REF_CODE_STORAGE_KEY);
      if (existing) return existing;
      const generated = `PP-${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.floor(10 + Math.random() * 89)}`;
      localStorage.setItem(REF_CODE_STORAGE_KEY, generated);
      return generated;
    } catch {
      return 'PP-GURU99';
    }
  });

  const [verifiedInvites, setVerifiedInvites] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(REF_COUNT_STORAGE_KEY);
      return saved ? Math.max(0, parseInt(saved, 10) || 2) : 2;
    } catch {
      return 2;
    }
  });

  const [claimedTiers, setClaimedTiers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CLAIMED_TIERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['bronze-scout'];
    } catch {
      return ['bronze-scout'];
    }
  });

  const [coinsBalance, setCoinsBalance] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('predictpro_coins') || '250', 10) || 250;
    } catch {
      return 250;
    }
  });

  const [customWatermark, setCustomWatermark] = useState<string>(() => {
    try {
      return localStorage.getItem(CUSTOM_WATERMARK_KEY) || '@MyTipsterSyndicate';
    } catch {
      return '@MyTipsterSyndicate';
    }
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');

  useEffect(() => {
    const syncWallet = () => {
      try {
        const val = parseInt(localStorage.getItem('predictpro_coins') || '250', 10) || 250;
        setCoinsBalance(val);
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', syncWallet);
    return () => window.removeEventListener('storage', syncWallet);
  }, []);

  const creditCoins = (amount: number) => {
    const nextBalance = coinsBalance + amount;
    setCoinsBalance(nextBalance);
    try {
      localStorage.setItem('predictpro_coins', String(nextBalance));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
  };

  const referralUrl = `https://predictpro.guru/?ref=${encodeURIComponent(refCode)}`;

  const shareText = `Join me on PredictPro for free AI football predictions, live xG telemetry, and 1-click SportyBet/Betika/1xBet booking codes! Claim +50 free VIP coins via my link: ${referralUrl}`;

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      toast.success('Referral invite link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.info(`Copy your link: ${referralUrl}`);
    }
  };

  const handleCopyWhatsAppMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('WhatsApp invite message copied! Paste directly in your football group.');
    } catch {
      toast.info(shareText);
    }
  };

  const handleSimulateInviteAccepted = () => {
    const nextInvites = verifiedInvites + 1;
    setVerifiedInvites(nextInvites);
    try {
      localStorage.setItem(REF_COUNT_STORAGE_KEY, String(nextInvites));
    } catch {
      // ignore
    }
    creditCoins(100);
    toast.success(`New referral verified! (${nextInvites} total invites) +100 PredictPro Coins credited.`);
  };

  const handleClaimMilestone = (milestone: ReferralMilestone) => {
    if (claimedTiers.includes(milestone.id)) {
      toast.info(`${milestone.tier} reward already claimed.`);
      return;
    }
    if (verifiedInvites < milestone.invitesRequired) {
      toast.error(
        `Invite ${milestone.invitesRequired - verifiedInvites} more friend(s) to unlock ${milestone.tier}.`
      );
      return;
    }
    const nextClaimed = [...claimedTiers, milestone.id];
    setClaimedTiers(nextClaimed);
    try {
      localStorage.setItem(CLAIMED_TIERS_STORAGE_KEY, JSON.stringify(nextClaimed));
    } catch {
      // ignore
    }
    creditCoins(milestone.coinReward);
    toast.success(`Unlocked ${milestone.tier}! +${milestone.coinReward} Coins added to your wallet.`);
  };

  const handleSaveWatermark = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customWatermark.trim() || '@PredictProGuru';
    setCustomWatermark(cleaned);
    try {
      localStorage.setItem(CUSTOM_WATERMARK_KEY, cleaned);
    } catch {
      // ignore
    }
    toast.success(`Custom slip watermark saved: "${cleaned}"`);
  };

  const handleRedeemFriendCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = friendCodeInput.trim().toUpperCase();
    if (!code || code.length < 4) {
      toast.error('Enter a valid referral code (e.g. PP-SHARP24)');
      return;
    }
    if (code === refCode) {
      toast.error('You cannot redeem your own invite code.');
      return;
    }
    try {
      localStorage.setItem('predictpro_referred_by', code);
    } catch {
      // ignore
    }
    creditCoins(50);
    setFriendCodeInput('');
    toast.success(`Redeemed invite code ${code}! +50 Free PredictPro Coins added.`);
  };

  const currentTier =
    [...MILESTONE_TIERS].reverse().find((m) => verifiedInvites >= m.invitesRequired)?.tier ||
    'Rookie Scout';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Invite Friends & Earn Free VIP Coins — Viral Referral Hub | PredictPro"
        description="Share your personal PredictPro referral link on WhatsApp or Telegram. Unlock free VIP Coins, Syndicate tipster badges, and custom slip watermarks."
      />
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Top Hero Banner */}
        <section className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold">
                  <Gift className="h-3.5 w-3.5 mr-1.5" />
                  Invite-to-Earn Syndicate Program
                </Badge>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  100% Free Access • Instant Coin Crediting
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Grow Your Football Syndicate &amp; Unlock Free VIP Perks
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                Every time you share a match prediction or accumulator slip to WhatsApp or Telegram, your personal{' '}
                <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
                  ?ref={refCode}
                </code>{' '}
                tag tracks referrals automatically and credits both you and your friends with PredictPro Coins.
              </p>

              {/* Personal Link Copy Bar */}
              <div className="pt-2 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Your Unique Referral Link
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="flex-1 flex items-center rounded-lg border border-border bg-background/80 px-3.5 py-2.5 font-mono text-xs sm:text-sm tabular-nums text-foreground select-all overflow-x-auto">
                    {referralUrl}
                  </div>
                  <Button
                    onClick={handleCopyInviteLink}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 shrink-0"
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedLink ? 'Link Copied' : 'Copy Invite Link'}
                  </Button>
                </div>

                {/* Quick Share Actions */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyWhatsAppMessage}
                    className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Copy WhatsApp Group Pitch
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(shareText);
                      toast.success('Telegram broadcast text copied to clipboard!');
                    }}
                    className="gap-2 border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
                  >
                    <Send className="h-4 w-4" />
                    Copy Telegram Invite Post
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSimulateInviteAccepted}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <UserPlus className="h-3.5 w-3.5 text-primary" />
                    Verify Friend Invite (+100 Coins)
                  </Button>
                </div>
              </div>
            </div>

            {/* Right KPI Telemetry Card */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
              <div className="rounded-xl border border-border bg-background/60 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Verified Invites</span>
                  <Users className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-foreground">
                  {verifiedInvites}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  Rank: {currentTier}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-4 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Wallet Balance</span>
                  <Coins className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-amber-400">
                  {coinsBalance.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  PredictPro VIP Coins
                </div>
              </div>

              <div className="col-span-2 rounded-xl border border-border bg-background/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Progress to Diamond Ambassador</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-400">
                    {Math.min(verifiedInvites, 10)} / 10 Invites
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (verifiedInvites / 10) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Each friend who joins via your referral link or shared slip code earns you +100 base coins plus milestone tier bonuses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Milestone Tiers */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Milestone Reward Tiers</h2>
              <p className="text-xs text-muted-foreground">
                Claim instant PredictPro Coin bonuses and permanent tipster tools as your invite count grows.
              </p>
            </div>
            <Link
              to="/community-slips"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Browse Community Copy-Bet Slips
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MILESTONE_TIERS.map((milestone) => {
              const isUnlocked = verifiedInvites >= milestone.invitesRequired;
              const isClaimed = claimedTiers.includes(milestone.id);

              return (
                <div
                  key={milestone.id}
                  className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${milestone.accentClass}`}
                      >
                        <Award className="h-3.5 w-3.5" />
                        {milestone.tier}
                      </span>
                      <span className="font-mono text-xs tabular-nums font-semibold text-muted-foreground">
                        {milestone.invitesRequired} {milestone.invitesRequired === 1 ? 'Invite' : 'Invites'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-lg font-extrabold font-mono tabular-nums text-foreground">
                        +{milestone.coinReward.toLocaleString()} Coins
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{milestone.perkTitle}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {milestone.perkDescription}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isClaimed ? 'secondary' : isUnlocked ? 'default' : 'outline'}
                    disabled={!isUnlocked || isClaimed}
                    onClick={() => handleClaimMilestone(milestone)}
                    className="w-full font-bold"
                  >
                    {isClaimed ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5 text-emerald-400" />
                        Reward Claimed
                      </>
                    ) : isUnlocked ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-1.5" />
                        Claim +{milestone.coinReward} Coins
                      </>
                    ) : (
                      `Need ${milestone.invitesRequired - verifiedInvites} More Invite(s)`
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom 2-Column Section: Custom Watermark Studio + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Custom Watermark & Friend Code Redemption */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stamp className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-base font-bold">Custom Slip Watermark</h2>
                </div>
                <Badge variant="outline" className="font-mono text-[11px]">
                  Social Studio Sync
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add your personal tipster handle or Telegram group name. It automatically appears on PNG accumulator cards exported from the Bet Slip Drawer and Social Card Studio.
              </p>
              <form onSubmit={handleSaveWatermark} className="space-y-3">
                <Input
                  value={customWatermark}
                  onChange={(e) => setCustomWatermark(e.target.value)}
                  placeholder="@YourTelegramChannel or Tipster Handle"
                  maxLength={36}
                  className="font-mono text-xs"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Preview: <strong className="text-foreground">{customWatermark || '@PredictPro'}</strong>
                  </span>
                  <Button type="submit" size="sm" className="font-semibold">
                    Save Watermark
                  </Button>
                </div>
              </form>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold">Were You Invited by a Friend?</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your friend&apos;s PredictPro invite code below to claim your instant +50 VIP Coin welcome bonus.
              </p>
              <form onSubmit={handleRedeemFriendCode} className="flex gap-2">
                <Input
                  value={friendCodeInput}
                  onChange={(e) => setFriendCodeInput(e.target.value)}
                  placeholder="e.g. PP-SHARP24"
                  className="font-mono text-xs uppercase"
                />
                <Button type="submit" variant="secondary" className="font-bold shrink-0">
                  Redeem +50 Coins
                </Button>
              </form>
            </div>
          </div>

          {/* Top Referrers Leaderboard */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <div>
                  <h2 className="text-base font-bold">Top Syndicate Referrers Leaderboard</h2>
                  <p className="text-xs text-muted-foreground">
                    Updated daily • Top 10 monthly scouts earn featured Community Slip placement
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 font-mono text-xs">
                Season Pool: 100,000 Coins
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[11px]">
                    <th className="py-2.5 px-2 font-semibold">Rank</th>
                    <th className="py-2.5 px-2 font-semibold">Tipster Handle</th>
                    <th className="py-2.5 px-2 font-semibold">Tier</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Invites</th>
                    <th className="py-2.5 px-2 font-semibold text-right">Coins Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {INITIAL_LEADERBOARD.map((row) => (
                    <tr key={row.rank} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-2 font-mono tabular-nums font-bold text-foreground">
                        #{row.rank}
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-foreground">
                        {row.handle}{' '}
                        <span className="text-[10px] font-mono text-muted-foreground ml-1">
                          [{row.region}]
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="text-[11px] text-emerald-400 font-medium">
                          {row.tierBadge}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums font-bold">
                        {row.verifiedInvites}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono tabular-nums text-amber-400 font-semibold">
                        +{row.coinsEarned.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-500/10 border-t border-emerald-500/30">
                    <td className="py-2.5 px-2 font-mono tabular-nums font-bold text-emerald-400">
                      YOU
                    </td>
                    <td className="py-2.5 px-2 font-bold text-foreground">
                      {customWatermark || '@You'} ({refCode})
                    </td>
                    <td className="py-2.5 px-2 text-[11px] font-semibold text-emerald-400">
                      {currentTier}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums font-bold text-foreground">
                      {verifiedInvites}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums font-bold text-amber-400">
                      +{coinsBalance.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ViralReferralHubPage;
