import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Trophy,
  Smartphone,
  Square,
} from 'lucide-react';
import {
  downloadSocialCardPng,
  getVerifiedWinProofs,
  publishVerifiedWinProof,
  type SocialCardRenderConfig,
  type VerifiedWinProof,
} from '@/services/socialCardPngGenerator';
import {
  getAdminBookingCodes,
  getAdminJackpotOverrides,
} from '@/services/adminOverrideSyncService';
import { toast } from 'sonner';

export const AdminSocialProofStudioTab: React.FC = () => {
  const [template, setTemplate] = useState<SocialCardRenderConfig['template']>('daily-codes');
  const [format, setFormat] = useState<SocialCardRenderConfig['format']>('story-9-16');
  const [customHeadline, setCustomHeadline] = useState('DAILY VERIFIED VIP SLIP');
  const [customPromoCode, setCustomPromoCode] = useState('PREDICTPRO');
  const [proofs, setProofs] = useState<VerifiedWinProof[]>(() => getVerifiedWinProofs());

  // New Proof Form state
  const [proofTitle, setProofTitle] = useState('3.45x Premier League xG Double — WON');
  const [proofBookie, setProofBookie] = useState('SportyBet');
  const [proofCode, setProofCode] = useState('BC8942X');
  const [proofOdds, setProofOdds] = useState('3.45');
  const [proofLeg1Match, setProofLeg1Match] = useState('Arsenal vs Chelsea');
  const [proofLeg1Score, setProofLeg1Score] = useState('3 - 1 (FT)');
  const [proofLeg2Match, setProofLeg2Match] = useState('Atalanta vs Fiorentina');
  const [proofLeg2Score, setProofLeg2Score] = useState('2 - 0 (FT)');

  const activeConfig = useMemo<SocialCardRenderConfig>(() => {
    const codes = getAdminBookingCodes();
    const jackpot = getAdminJackpotOverrides();

    if (template === 'verified-win') {
      const latest = proofs[0];
      return {
        template: 'verified-win',
        format,
        headline: customHeadline || 'BOOM! VERIFIED WINNING SLIP',
        subtitle: latest ? latest.title : '100% Audited Full-Time Settlement Proof',
        bookmaker: latest?.bookmaker || 'SportyBet',
        bookingCode: latest?.bookingCode || 'BC8942X',
        promoCode: customPromoCode,
        totalOdds: String(latest?.totalOdds || '2.18'),
        winRateBadge: 'VERIFIED WINNER ✓',
        rows: (latest?.legs || []).map((l) => ({
          label: l.match,
          sublabel: `${l.market}  ·  Final Score: ${l.finalScore}`,
          badgeText: `WON @${l.odds.toFixed(2)} ✓`,
          status: 'won',
        })),
      };
    }

    if (template === 'jackpot-bankers') {
      const locked = jackpot.filter((j) => j.isBankerLock);
      return {
        template: 'jackpot-bankers',
        format,
        headline: '17-GAME MEGA JACKPOT BANKERS',
        subtitle: 'Bivariate Poisson & Dixon-Coles Locked Single Outcomes',
        bookmaker: 'SportPesa / Betika',
        bookingCode: 'SPMJ-2026',
        promoCode: customPromoCode,
        totalOdds: '17 GAMES',
        winRateBadge: '85%+ AI CONFIDENCE',
        rows: locked.map((j) => ({
          label: `Game #${j.gameNo}: ${j.homeTeam} vs ${j.awayTeam}`,
          sublabel: `${j.league}  ·  Locked Banker Pick: ${j.singlePick}`,
          badgeText: `${j.confidence}% LOCK`,
          status: 'locked',
        })),
      };
    }

    const firstCode = codes[0];
    return {
      template: 'daily-codes',
      format,
      headline: customHeadline || 'TODAY’S VERIFIED BOOKING CODES',
      subtitle: '1-Tap Convert across SportyBet, 1xBet, Bet9ja & SportPesa',
      bookmaker: firstCode?.bookmaker || 'SportyBet',
      bookingCode: firstCode?.code || 'BC8942X',
      promoCode: customPromoCode,
      totalOdds: firstCode?.totalOdds || '2.14',
      winRateBadge: '84.6% STRIKE RATE',
      rows: codes.slice(0, 6).map((c) => ({
        label: `${c.bookmaker} — ${c.tier}`,
        sublabel: `${c.legs} Statistical Legs  ·  Expires ${c.expiryTime}`,
        badgeText: `${c.code} (${c.totalOdds}x)`,
        status: 'code',
      })),
    };
  }, [template, format, customHeadline, customPromoCode, proofs]);

  const handleCertifyNewProof = (e: React.FormEvent) => {
    e.preventDefault();
    const numericOdds = parseFloat(proofOdds) || 2.15;
    const updated = publishVerifiedWinProof({
      date: 'Today · Verified FT',
      title: proofTitle,
      bookmaker: proofBookie,
      bookingCode: proofCode.toUpperCase(),
      totalOdds: numericOdds,
      profitUnits: Number((numericOdds - 1).toFixed(2)),
      certifiedBy: 'Admin Settlement Audit',
      legs: [
        { match: proofLeg1Match, market: 'Primary AI Pick', finalScore: proofLeg1Score, odds: 1.75 },
        { match: proofLeg2Match, market: 'Primary AI Pick', finalScore: proofLeg2Score, odds: Number((numericOdds / 1.75).toFixed(2)) },
      ],
    });
    setProofs(updated);
    setTemplate('verified-win');
    toast.success('Certified Winning Slip Proof & synced to Public Archive (/archive)!');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              2× Retina Social Story (9:16) &amp; Square (1:1) PNG Card Studio
            </CardTitle>
            <CardDescription className="text-xs">
              Generate high-DPI social graphics for WhatsApp Status, Instagram Stories, Telegram Channels, and X/Twitter in 1 click.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'daily-codes', label: 'Daily Booking Codes' },
                { id: 'verified-win', label: 'Verified Winner Proof' },
                { id: 'jackpot-bankers', label: '17-Game Jackpot Bankers' },
              ].map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  size="sm"
                  variant={template === t.id ? 'default' : 'outline'}
                  onClick={() => {
                    setTemplate(t.id as SocialCardRenderConfig['template']);
                    if (t.id === 'verified-win') setCustomHeadline('BOOM! VERIFIED WINNING SLIP');
                    else if (t.id === 'jackpot-bankers') setCustomHeadline('17-GAME MEGA JACKPOT BANKERS');
                    else setCustomHeadline('TODAY’S VERIFIED BOOKING CODES');
                  }}
                  className="text-xs font-semibold"
                >
                  {t.label}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant={format === 'story-9-16' ? 'default' : 'outline'}
                onClick={() => setFormat('story-9-16')}
                className="gap-1.5 text-xs"
              >
                <Smartphone className="w-3.5 h-3.5" /> 9:16 Story (1080×1920 · WhatsApp / IG)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={format === 'square-1-1' ? 'default' : 'outline'}
                onClick={() => setFormat('square-1-1')}
                className="gap-1.5 text-xs"
              >
                <Square className="w-3.5 h-3.5" /> 1:1 Square (1080×1080 · Telegram / X)
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Card Headline
                </label>
                <input
                  type="text"
                  value={customHeadline}
                  onChange={(e) => setCustomHeadline(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Affiliate Promo Code Footer
                </label>
                <input
                  type="text"
                  value={customPromoCode}
                  onChange={(e) => setCustomPromoCode(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                downloadSocialCardPng(activeConfig, `predictpro-${template}`);
                toast.success(`Downloaded 2× Retina ${format === 'story-9-16' ? '9:16 Story' : '1:1 Square'} PNG!`);
              }}
              className="w-full gap-2 text-xs font-bold"
            >
              <Download className="w-4 h-4" />
              Download 2× Retina PNG ({format === 'story-9-16' ? '1080×1920' : '1080×1080'})
            </Button>
          </CardContent>
        </Card>

        {/* Right Live Preview Card */}
        <Card className="lg:col-span-5 bg-slate-950 text-slate-100 border-slate-800">
          <CardHeader className="pb-2">
            <div className="text-[11px] font-mono text-emerald-400">
              PREDICTPRO QUANTITATIVE ANALYTICS · {activeConfig.winRateBadge}
            </div>
            <CardTitle className="text-base text-white">{activeConfig.headline}</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {activeConfig.subtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  {activeConfig.bookmaker} BOOKING CODE
                </div>
                <div className="text-lg font-mono font-bold text-emerald-400">
                  {activeConfig.bookingCode}
                </div>
              </div>
              <div className="text-base font-mono font-bold text-white tabular-nums">
                {activeConfig.totalOdds}x ODDS
              </div>
            </div>

            <div className="space-y-2">
              {activeConfig.rows.slice(0, 4).map((r, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">
                      {i + 1}. {r.label}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{r.sublabel}</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 shrink-0">
                    {r.badgeText}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex justify-between">
              <span>predictpro.guru</span>
              <span>PROMO: {activeConfig.promoCode}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Certify & Publish Verified Winning Slip Proof */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Certify Winning Slip Proof (Auto-Publishes to Public /archive &amp; Social Studio)
          </CardTitle>
          <CardDescription className="text-xs">
            Record settled winning slips so visitors see verified full-time scores and ROI transparency on the Settled Results Archive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCertifyNewProof} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Winning Slip Headline
              </label>
              <input
                type="text"
                value={proofTitle}
                onChange={(e) => setProofTitle(e.target.value)}
                className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Bookmaker &amp; Code
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={proofBookie}
                  onChange={(e) => setProofBookie(e.target.value)}
                  className="w-1/2 rounded-lg border bg-background px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={proofCode}
                  onChange={(e) => setProofCode(e.target.value)}
                  className="w-1/2 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-mono uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Leg 1 Match &amp; FT Score
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={proofLeg1Match}
                  onChange={(e) => setProofLeg1Match(e.target.value)}
                  className="w-2/3 rounded-lg border bg-background px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={proofLeg1Score}
                  onChange={(e) => setProofLeg1Score(e.target.value)}
                  className="w-1/3 rounded-lg border bg-background px-2 py-1.5 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Total Won Odds
                </label>
                <input
                  type="text"
                  value={proofOdds}
                  onChange={(e) => setProofOdds(e.target.value)}
                  className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <Button type="submit" size="sm" className="h-8 gap-1 text-xs font-bold shrink-0">
                <Plus className="w-3.5 h-3.5" /> Certify Winner
              </Button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {proofs.slice(0, 4).map((p) => (
              <div key={p.id} className="rounded-xl border bg-muted/20 p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {p.date} · {p.bookmaker} ({p.bookingCode})
                  </div>
                  <div className="text-sm font-bold truncate">{p.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {p.legs.map((l) => `${l.match} (${l.finalScore})`).join(' · ')}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-sm text-emerald-500 tabular-nums">
                    {p.totalOdds.toFixed(2)}x
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    +{p.profitUnits.toFixed(2)}u
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
