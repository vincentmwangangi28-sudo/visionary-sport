import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Copy,
  Globe,
  Languages,
  Plus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  SUPPORTED_LOCALES,
  SupportedLocale,
  generateMultilingualBroadcastText,
  useAppLocale,
} from '@/services/i18nLocalizationService';
import {
  getClvSteamSignals,
  addOrUpdateClvSteamSignal,
  ClvSteamSignal,
} from '@/services/clvAndCopulaService';
import {
  getVerifiedBookingCodes,
  getJackpotAdminConfig,
} from '@/services/adminOverrideSyncService';
import { toast } from 'sonner';

export const AdminClvAndLocalizationTab: React.FC = () => {
  const { locale: activeSiteLocale, changeLocale } = useAppLocale();
  const [selectedBroadcastLocale, setSelectedBroadcastLocale] =
    useState<SupportedLocale>('sw');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [clvList, setClvList] = useState<ClvSteamSignal[]>(() => getClvSteamSignals());
  const [homeTeam, setHomeTeam] = useState('Arsenal');
  const [awayTeam, setAwayTeam] = useState('Liverpool');
  const [league, setLeague] = useState('Premier League');
  const [market, setMarket] = useState('Over 2.5 Match Goals');
  const [openingOdds, setOpeningOdds] = useState(2.02);
  const [currentBookieOdds, setCurrentBookieOdds] = useState(1.86);
  const [sharpNoVigOdds, setSharpNoVigOdds] = useState(1.71);
  const [tacticalNote, setTacticalNote] = useState(
    'Heavy Asian syndicate steam pushed true no-vig line down 31 cents; soft books still hanging 1.86.'
  );

  const bookingCodes = useMemo(() => getVerifiedBookingCodes(), []);
  const jackpotConfig = useMemo(() => getJackpotAdminConfig(), []);

  const broadcastText = useMemo(() => {
    const sporty = bookingCodes.find((b) => b.bookmaker === 'SportyBet') || bookingCodes[0];
    const onex = bookingCodes.find((b) => b.bookmaker === '1xBet') || bookingCodes[1];
    const bet9ja = bookingCodes.find((b) => b.bookmaker === 'Bet9ja') || bookingCodes[2];
    const dateLabel = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return generateMultilingualBroadcastText(selectedBroadcastLocale, {
      dateLabel,
      sportyCode: sporty?.code || 'BC8942X',
      sportyOdds: Number(sporty?.totalOdds || 2.14).toFixed(2),
      onexCode: onex?.code || 'PRD26X',
      onexOdds: Number(onex?.totalOdds || 2.18).toFixed(2),
      bet9jaCode: bet9ja?.code || 'B9J551092',
      bet9jaOdds: Number(bet9ja?.totalOdds || 3.85).toFixed(2),
      jackpotPool: jackpotConfig.prizePoolLabel || 'KES 384M+',
    });
  }, [selectedBroadcastLocale, bookingCodes, jackpotConfig]);

  const handleCopy = async (id: string, text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(`Copied ${label} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Clipboard copy failed');
    }
  };

  const handlePublishClvSignal = () => {
    const clvEdge = Number(
      (((currentBookieOdds / Math.max(sharpNoVigOdds, 1.05)) - 1) * 100).toFixed(1)
    );
    const steamDrop = Number(
      (((openingOdds - sharpNoVigOdds) / Math.max(openingOdds, 1.05)) * 100).toFixed(1)
    );

    const updated = addOrUpdateClvSteamSignal({
      homeTeam: homeTeam.trim() || 'Home Club',
      awayTeam: awayTeam.trim() || 'Away Club',
      league: league.trim() || 'Premier League',
      region:
        league.toLowerCase().includes('caf') ||
        league.toLowerCase().includes('fkf') ||
        league.toLowerCase().includes('npfl')
          ? 'Africa / CAF'
          : 'Europe',
      kickoffLabel: 'Today · Live CLV Pin',
      market: market.trim() || 'Home Win (1)',
      openingOdds,
      currentBookieOdds,
      sharpPinnacleNoVigOdds: sharpNoVigOdds,
      modelFairOdds: Number(Math.max(sharpNoVigOdds - 0.03, 1.15).toFixed(2)),
      modelProbabilityPct: Number((100 / Math.max(sharpNoVigOdds, 1.15)).toFixed(1)),
      clvBeatPct: Math.max(clvEdge, 4.5),
      steamDropPct: Math.max(steamDrop, 8.0),
      movementTag: 'SYNDICATE STEAM',
      sharpMoneyVolumePct: 85,
      publicTicketsPct: 48,
      tacticalNote,
    });
    setClvList(updated);
    toast.success(
      `Pinned ${homeTeam} vs ${awayTeam} (+${Math.max(clvEdge, 4.5)}% CLV) to /closing-line-value!`
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Languages className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                5-Language Localization &amp; Closing Line Value (CLV) Command Studio
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] text-emerald-500 border-emerald-500/30 font-mono"
              >
                EN · SWAHILI · FRANÇAIS · PORTUGUÊS · العربية
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Generate 1-click ready-to-paste Telegram &amp; WhatsApp broadcasts in 5 regional languages and pin custom Syndicate Steam / Positive-CLV plays directly to `/closing-line-value`.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc.code}
                type="button"
                onClick={() => {
                  changeLocale(loc.code);
                  setSelectedBroadcastLocale(loc.code);
                  toast.success(`Switched Platform & Broadcast Language to ${loc.nativeLabel}`);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border transition-all cursor-pointer ${
                  activeSiteLocale === loc.code
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 6 COLS: 5-Language Ready-to-Paste Broadcast Generator */}
        <Card className="lg:col-span-6 border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                1. 5-Language Ready-to-Paste Telegram / WhatsApp Broadcasts
              </CardTitle>
              <Button
                size="sm"
                onClick={() =>
                  handleCopy(
                    `lang-${selectedBroadcastLocale}`,
                    broadcastText,
                    `${selectedBroadcastLocale.toUpperCase()} Broadcast`
                  )
                }
                className="h-7 text-xs gap-1 font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              >
                {copiedId === `lang-${selectedBroadcastLocale}` ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy {selectedBroadcastLocale.toUpperCase()} Broadcast
              </Button>
            </div>
            <CardDescription className="text-xs">
              Auto-populates your live SportyBet, 1xBet &amp; Bet9ja Booking Codes into native Swahili, French, Portuguese, Arabic, or English.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-5 gap-1.5">
              {SUPPORTED_LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => setSelectedBroadcastLocale(loc.code)}
                  className={`py-2 px-2 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                    selectedBroadcastLocale === loc.code
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500 font-bold'
                      : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="block font-mono text-[11px]">{loc.label}</span>
                  <span className="block text-[10px] truncate">{loc.nativeLabel}</span>
                </button>
              ))}
            </div>

            <pre
              dir={selectedBroadcastLocale === 'ar' ? 'rtl' : 'ltr'}
              className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed"
            >
              {broadcastText}
            </pre>
          </CardContent>
        </Card>

        {/* RIGHT 6 COLS: Custom Sharp Steam & CLV Seeder */}
        <Card className="lg:col-span-6 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              2. Pin Custom Sharp Steam &amp; Positive-CLV Signal
            </CardTitle>
            <CardDescription className="text-xs">
              Broadcast a new Opening-to-Sharp odds movement directly to the public `/closing-line-value` scanner.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Home Team</label>
                <input
                  type="text"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Away Team</label>
                <input
                  type="text"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Competition</label>
                <input
                  type="text"
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              <div className="col-span-1 space-y-1">
                <label className="font-semibold text-foreground block">Market</label>
                <input
                  type="text"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Opening Odds</label>
                <input
                  type="number"
                  step="0.01"
                  value={openingOdds}
                  onChange={(e) => setOpeningOdds(Number(e.target.value) || 1.9)}
                  className="w-full h-9 px-2.5 rounded-lg bg-muted/50 border border-border font-mono tabular-nums text-xs text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Soft Bookie</label>
                <input
                  type="number"
                  step="0.01"
                  value={currentBookieOdds}
                  onChange={(e) => setCurrentBookieOdds(Number(e.target.value) || 1.8)}
                  className="w-full h-9 px-2.5 rounded-lg bg-muted/50 border border-border font-mono tabular-nums text-xs text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground block">Sharp No-Vig</label>
                <input
                  type="number"
                  step="0.01"
                  value={sharpNoVigOdds}
                  onChange={(e) => setSharpNoVigOdds(Number(e.target.value) || 1.68)}
                  className="w-full h-9 px-2.5 rounded-lg bg-muted/50 border border-border font-mono tabular-nums text-xs text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground block">
                Syndicate Liquidity / Tactical Note
              </label>
              <input
                type="text"
                value={tacticalNote}
                onChange={(e) => setTacticalNote(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg bg-muted/50 border border-border text-xs text-foreground"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-muted-foreground">
                Active Signals in Feed: <strong>{clvList.length}</strong>
              </span>
              <Button
                size="sm"
                onClick={handlePublishClvSignal}
                className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              >
                <Plus className="h-3.5 w-3.5" />
                Publish CLV Steam Signal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
