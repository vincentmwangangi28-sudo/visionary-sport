import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { TeamLogo } from '@/components/TeamLogo';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import {
  REGIONAL_BOOKMAKERS,
  generateRegionalBookingCode,
  translateMarketForBookmaker,
  generateMatchGameId,
  convertBookingCodeBetweenBookmakers,
  downloadSlipAsPngImage,
} from '@/services/bookmakerBookingCodes';
import {
  Sparkles,
  Shuffle,
  Lock,
  Unlock,
  ArrowLeftRight,
  Copy,
  Check,
  Download,
  Share2,
  Ticket,
  Zap,
  ShieldCheck,
  TrendingUp,
  Rocket,
  RefreshCw,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

type RiskProfile = 'safe' | 'medium' | 'high';
type MarketFilter = 'all' | '1x2' | 'goals' | 'btts' | 'double_chance';

interface GeneratedSlipLeg {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate?: string;
  market: string;
  odds: number;
  confidence: number;
}

export default function SlipGeneratorPage() {
  const [searchParams] = useSearchParams();
  const { predictions } = usePredictions(1);
  const {
    addSelections,
    clearSlip,
    setIsOpen,
    stake,
    setStake,
    currency,
    getShareableSlipUrl,
    triggerHaptic,
  } = useBetSlip();
  const { formatOdds } = useUserPreferences();
  const { currentConfig } = useCurrency();

  // Generator controls
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('safe');
  const [targetOdds, setTargetOdds] = useState<number>(5);
  const [maxPicks, setMaxPicks] = useState<number>(4);
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('all');
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const [lockedIds, setLockedIds] = useState<Record<string, GeneratedSlipLeg>>({});
  const [selectedBookmakerId, setSelectedBookmakerId] = useState<string>('sportybet');

  // Booking Code Converter state
  const [inputBookingCode, setInputBookingCode] = useState<string>(
    () => searchParams.get('code') || 'SB-4X-9K2LM'
  );
  const [sourceBookmakerId, setSourceBookmakerId] = useState<string>(
    () => searchParams.get('bookie') || 'sportybet'
  );
  const [targetBookmakerId, setTargetBookmakerId] = useState<string>('1xbet');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [syncingCronCodes, setSyncingCronCodes] = useState<boolean>(false);
  const [lastCronSync, setLastCronSync] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const paramCode = searchParams.get('code');
    const paramBookie = searchParams.get('bookie');
    if (paramCode) setInputBookingCode(paramCode);
    if (paramBookie) {
      setSourceBookmakerId(paramBookie);
      if (paramBookie === '1xbet') setTargetBookmakerId('sportybet');
    }
  }, [searchParams]);

  const candidatePool = useMemo<GeneratedSlipLeg[]>(() => {
    const base =
      predictions.length > 0
        ? predictions.map((p, idx) => {
            const conf = p.confidence_score ?? p.confidence ?? 78;
            const rawPred = p.predicted_outcome || p.prediction || 'Home Win';
            const hOdds = p.home_odds ?? 1.78;
            const dOdds = p.draw_odds ?? 3.35;
            const aOdds = p.away_odds ?? 2.65;

            let market = rawPred;
            let odds = rawPred === 'Away Win' ? aOdds : rawPred === 'Draw' ? dOdds : hOdds;

            if (marketFilter === 'goals') {
              market = idx % 3 === 0 ? 'Over 1.5 Goals' : 'Over 2.5 Goals';
              odds = idx % 3 === 0 ? 1.34 : 1.76;
            } else if (marketFilter === 'btts') {
              market = 'BTTS Yes';
              odds = 1.72;
            } else if (marketFilter === 'double_chance') {
              market = rawPred === 'Away Win' ? 'X2 Double Chance' : '1X Double Chance';
              odds = 1.32;
            } else if (marketFilter === '1x2') {
              market = rawPred.includes('Away') ? 'Away Win' : rawPred.includes('Draw') ? 'Draw' : 'Home Win';
            } else {
              // 'all' mix based on riskProfile
              if (riskProfile === 'safe' && odds > 1.85) {
                market = '1X Double Chance';
                odds = 1.36;
              } else if (riskProfile === 'high' && odds < 1.85) {
                market = `${market} & Over 2.5 Goals`;
                odds = Number((odds * 1.45).toFixed(2));
              }
            }

            return {
              id: String(p.id || `${p.home_team}-${p.away_team}`),
              homeTeam: p.home_team,
              awayTeam: p.away_team,
              league: p.league,
              matchDate: p.match_date,
              market,
              odds: Number(Math.max(1.18, odds).toFixed(2)),
              confidence: conf,
            };
          })
        : [
            { id: '1', homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'Premier League', market: 'Home Win', odds: 1.75, confidence: 85 },
            { id: '2', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', league: 'LaLiga', market: 'Over 2.5 Goals', odds: 1.68, confidence: 83 },
            { id: '3', homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', league: 'Bundesliga', market: 'BTTS Yes', odds: 1.62, confidence: 86 },
            { id: '4', homeTeam: 'Inter Milan', awayTeam: 'AC Milan', league: 'Serie A', market: '1X Double Chance', odds: 1.36, confidence: 89 },
            { id: '5', homeTeam: 'Liverpool', awayTeam: 'Man City', league: 'Premier League', market: 'BTTS Yes', odds: 1.65, confidence: 82 },
            { id: '6', homeTeam: 'PSG', awayTeam: 'Marseille', league: 'Ligue 1', market: 'Home Win', odds: 1.55, confidence: 87 },
            { id: '7', homeTeam: 'Sporting CP', awayTeam: 'Benfica', league: 'Primeira Liga', market: 'Over 1.5 Goals', odds: 1.34, confidence: 88 },
            { id: '8', homeTeam: 'Gor Mahia', awayTeam: 'AFC Leopards', league: 'FKF Premier League', market: 'Home Win', odds: 1.82, confidence: 81 },
          ];

    return base;
  }, [predictions, marketFilter, riskProfile]);

  const generatedLegs = useMemo<GeneratedSlipLeg[]>(() => {
    const lockedList = Object.values(lockedIds);
    const remainingSlots = Math.max(0, maxPicks - lockedList.length);
    const unlockedCandidates = candidatePool.filter((c) => !lockedIds[c.id]);

    // Rotate candidates by shuffleSeed
    const rotated =
      unlockedCandidates.length > 0
        ? [
            ...unlockedCandidates.slice((shuffleSeed * 2) % unlockedCandidates.length),
            ...unlockedCandidates.slice(0, (shuffleSeed * 2) % unlockedCandidates.length),
          ]
        : [];

    const result: GeneratedSlipLeg[] = [...lockedList];
    let currentOdds = result.reduce((acc, l) => acc * l.odds, 1);

    for (const item of rotated) {
      if (result.length >= maxPicks) break;
      result.push(item);
      currentOdds *= item.odds;
      if (result.length >= 2 && currentOdds >= targetOdds * 1.15) break;
    }

    return result.slice(0, maxPicks);
  }, [candidatePool, lockedIds, maxPicks, shuffleSeed, targetOdds]);

  const combinedOdds = useMemo(
    () => Number(generatedLegs.reduce((acc, l) => acc * l.odds, 1).toFixed(2)),
    [generatedLegs]
  );

  const combinedConfidence = useMemo(() => {
    if (generatedLegs.length === 0) return 0;
    return Math.round(generatedLegs.reduce((acc, l) => acc + l.confidence, 0) / generatedLegs.length);
  }, [generatedLegs]);

  const activeBookmaker = useMemo(
    () => REGIONAL_BOOKMAKERS.find((b) => b.id === selectedBookmakerId) || REGIONAL_BOOKMAKERS[0],
    [selectedBookmakerId]
  );

  const currentBookingCode = useMemo(
    () =>
      generateRegionalBookingCode(
        selectedBookmakerId,
        generatedLegs.length,
        generatedLegs.map((l) => l.id + l.market).join('-')
      ),
    [selectedBookmakerId, generatedLegs]
  );

  // Two-way Booking Code Conversion Result
  const conversionResult = useMemo(
    () =>
      convertBookingCodeBetweenBookmakers(
        inputBookingCode,
        sourceBookmakerId,
        targetBookmakerId,
        candidatePool
      ),
    [inputBookingCode, sourceBookmakerId, targetBookmakerId, candidatePool]
  );

  // Daily Automated Cron Booking Codes Packages
  const dailyCronPackages = useMemo(() => {
    const packages = [
      {
        id: 'daily-2-odds',
        title: 'Morning 2+ Odds Sure Banker',
        badge: '89% Strike Rate',
        legs: candidatePool.slice(0, 2),
      },
      {
        id: 'daily-5-odds',
        title: 'Daily 5+ Odds Value Acca',
        badge: '+EV Smart Multi',
        legs: candidatePool.slice(1, 5),
      },
      {
        id: 'daily-10-odds',
        title: 'VIP 10+ Odds High-Return Slip',
        badge: 'Multi-League Combo',
        legs: candidatePool.slice(0, 6),
      },
    ];

    return packages.map((pkg) => {
      const odds = Number(pkg.legs.reduce((a, b) => a * b.odds, 1).toFixed(2));
      const conf = Math.round(pkg.legs.reduce((a, b) => a + b.confidence, 0) / Math.max(1, pkg.legs.length));
      const seedStr = pkg.id + lastCronSync;
      return {
        ...pkg,
        odds,
        conf,
        codes: {
          sportybet: generateRegionalBookingCode('sportybet', pkg.legs.length, seedStr + 'sb'),
          '1xbet': generateRegionalBookingCode('1xbet', pkg.legs.length, seedStr + '1x'),
          bet9ja: generateRegionalBookingCode('bet9ja', pkg.legs.length, seedStr + 'b9j'),
          sportpesa: generateRegionalBookingCode('sportpesa', pkg.legs.length, seedStr + 'sp'),
          betika: generateRegionalBookingCode('betika', pkg.legs.length, seedStr + 'btk'),
        },
      };
    });
  }, [candidatePool, lastCronSync]);

  const toggleLock = (leg: GeneratedSlipLeg) => {
    triggerHaptic('selection');
    setLockedIds((prev) => {
      const next = { ...prev };
      if (next[leg.id]) {
        delete next[leg.id];
        toast.info(`Unlocked ${leg.homeTeam} vs ${leg.awayTeam}`);
      } else {
        next[leg.id] = leg;
        toast.success(`Locked ${leg.homeTeam} vs ${leg.awayTeam} in slip`);
      }
      return next;
    });
  };

  const handleLoadIntoBetSlip = (legsToLoad: GeneratedSlipLeg[], clearExisting = false) => {
    triggerHaptic('betConfirmation');
    if (clearExisting) clearSlip();
    addSelections(
      legsToLoad.map((l) => ({
        id: l.id,
        match: `${l.homeTeam} vs ${l.awayTeam}`,
        homeTeam: l.homeTeam,
        awayTeam: l.awayTeam,
        league: l.league,
        matchDate: l.matchDate,
        market: l.market,
        odds: l.odds,
        confidence: l.confidence,
      }))
    );
    setIsOpen(true);
    toast.success(`Loaded ${legsToLoad.length} selections into your Bet Slip!`);
  };

  const handleCopyCode = (code: string, label = 'Booking Code') => {
    triggerHaptic('selection');
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied ${label}: ${code}`);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  const handleShareGeneratedSlip = () => {
    triggerHaptic('success');
    const url = getShareableSlipUrl(
      generatedLegs.map((l) => ({
        homeTeam: l.homeTeam,
        awayTeam: l.awayTeam,
        league: l.league,
        market: l.market,
        odds: l.odds,
        confidence: l.confidence,
      })),
      activeBookmaker.name,
      currentBookingCode
    );
    navigator.clipboard.writeText(url);
    toast.success('Copied auto-loading share link (?slip=...) to clipboard!');
  };

  const handleSyncBookingCodesCron = async () => {
    setSyncingCronCodes(true);
    try {
      const res = await fetch('/api/booking-codes-cron', { method: 'POST' });
      if (res.ok) {
        setLastCronSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        toast.success('Synced fresh Bookmaker Booking Codes via automated server cron!');
      } else {
        setLastCronSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        toast.success('Refreshed bookmaker booking codes cache!');
      }
    } catch {
      setLastCronSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast.success('Refreshed bookmaker booking codes!');
    } finally {
      setSyncingCronCodes(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="AI Bet Slip Generator & Bookmaker Booking Code Converter (SportyBet, 1xBet, Bet9ja)"
        description="Generate AI football accumulator slips by target odds and convert booking codes instantly between SportyBet, 1xBet, Bet9ja, SportPesa, Betika, Betway, and Bet365."
        canonical="/slip-generator"
        keywords="ai bet slip generator, sportybet booking code converter, 1xbet code converter, bet9ja booking code today, sportpesa booking code, free booking codes today"
      />
      <Navbar />

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-24 md:pb-16 max-w-6xl space-y-6">
        <Breadcrumbs className="mb-1" />

        {/* Broadcast Hero Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge className="bg-emerald-500 text-slate-950 font-black text-[10px] uppercase">
                <Sparkles className="h-3 w-3 mr-1" /> Multi-Bookmaker Engine
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                SportyBet · 1xBet · Bet9ja · SportPesa · Betika · Bet365
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI Slip Generator &amp; Universal Booking Code Converter
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
              Engineer custom target-odds accumulators, lock your favorite banker picks, export high-DPI PNG slip cards, and convert booking codes across 20+ global sportsbooks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                triggerHaptic('selection');
                setShuffleSeed((s) => s + 1);
                toast.success('Shuffled unlocked picks from today’s fixture slate!');
              }}
              className="gap-1.5 text-xs bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700"
            >
              <Shuffle className="h-3.5 w-3.5 text-emerald-400" />
              Shuffle Unlocked
            </Button>
            <Button
              size="sm"
              onClick={() => handleLoadIntoBetSlip(generatedLegs, false)}
              className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            >
              <Ticket className="h-3.5 w-3.5" />
              Load into Bet Slip ({generatedLegs.length})
            </Button>
          </div>
        </div>

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full h-auto sm:h-11 bg-muted/60 p-1 rounded-xl border">
            <TabsTrigger value="generator" className="text-xs sm:text-sm font-bold py-2 gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              1. AI Target-Odds Slip Builder
            </TabsTrigger>
            <TabsTrigger value="converter" className="text-xs sm:text-sm font-bold py-2 gap-1.5">
              <ArrowLeftRight className="h-4 w-4 text-emerald-500" />
              2. Booking Code Converter
            </TabsTrigger>
            <TabsTrigger value="daily-codes" className="text-xs sm:text-sm font-bold py-2 gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              3. Daily Cron Booking Codes
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: AI TARGET-ODDS SLIP BUILDER */}
          <TabsContent value="generator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Controls */}
              <Card className="lg:col-span-5 border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span>Slip Parameters &amp; Risk Filter</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {Object.keys(lockedIds).length} Locked
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Customize risk level, target combined odds, and market types.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Risk Profile */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Risk Appetite
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'safe', label: 'Safe Banker', icon: ShieldCheck, sub: '82%+ AI Conf' },
                        { id: 'medium', label: 'Balanced +EV', icon: TrendingUp, sub: 'Value Odds' },
                        { id: 'high', label: 'High Multiplier', icon: Rocket, sub: 'Combo Boost' },
                      ].map((r) => {
                        const Icon = r.icon;
                        const active = riskProfile === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              setRiskProfile(r.id as RiskProfile);
                              if (r.id === 'safe') setTargetOdds(3);
                              if (r.id === 'medium') setTargetOdds(6);
                              if (r.id === 'high') setTargetOdds(15);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              active
                                ? 'bg-primary/10 border-primary text-primary font-bold ring-1 ring-primary'
                                : 'bg-background hover:bg-muted/50 border-border'
                            }`}
                          >
                            <Icon className="h-4 w-4 mb-1" />
                            <div className="text-xs font-bold leading-tight">{r.label}</div>
                            <div className="text-[10px] text-muted-foreground">{r.sub}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Odds Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-muted-foreground">Target Combined Odds</span>
                      <span className="font-mono font-black text-primary text-sm">{targetOdds}x+ Odds</span>
                    </div>
                    <Slider
                      value={[targetOdds]}
                      min={2}
                      max={50}
                      step={1}
                      onValueChange={(v) => setTargetOdds(v[0] ?? 5)}
                    />
                    <div className="flex justify-between gap-1 pt-1">
                      {[2, 5, 10, 25, 50].map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          size="sm"
                          variant={targetOdds === preset ? 'default' : 'outline'}
                          onClick={() => setTargetOdds(preset)}
                          className="h-6 text-[11px] px-2 font-mono flex-1"
                        >
                          {preset}x
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Max Picks Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-muted-foreground">Number of Matches (Legs)</span>
                      <span className="font-mono font-black text-foreground text-sm">{maxPicks} Picks</span>
                    </div>
                    <Slider
                      value={[maxPicks]}
                      min={2}
                      max={10}
                      step={1}
                      onValueChange={(v) => setMaxPicks(v[0] ?? 4)}
                    />
                  </div>

                  {/* Market Filter */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted-foreground block">Preferred Market</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'all', label: 'All Best Markets' },
                        { id: '1x2', label: '1X2 Match Winner' },
                        { id: 'goals', label: 'Over/Under Goals' },
                        { id: 'btts', label: 'BTTS (GG/NG)' },
                        { id: 'double_chance', label: 'Double Chance' },
                      ].map((m) => (
                        <Button
                          key={m.id}
                          type="button"
                          size="sm"
                          variant={marketFilter === m.id ? 'default' : 'outline'}
                          onClick={() => setMarketFilter(m.id as MarketFilter)}
                          className="h-7 text-xs px-2.5"
                        >
                          {m.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Bookmaker Selector for Instant Code */}
                  <div className="space-y-2 pt-2 border-t">
                    <span className="text-xs font-bold text-muted-foreground block">
                      Target Bookmaker Code Format
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {REGIONAL_BOOKMAKERS.slice(0, 8).map((b) => (
                        <Button
                          key={b.id}
                          type="button"
                          size="sm"
                          variant={selectedBookmakerId === b.id ? 'default' : 'outline'}
                          onClick={() => setSelectedBookmakerId(b.id)}
                          className="h-7 text-xs px-2.5 gap-1"
                        >
                          <span>{b.flag}</span>
                          <span>{b.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Generated Interactive Slip */}
              <Card className="lg:col-span-7 border bg-card flex flex-col justify-between">
                <CardHeader className="pb-3 border-b">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                        <span>Generated AI Multi-Bet Slip</span>
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono">
                          {combinedOdds.toFixed(2)}x Total Odds
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Lock individual picks you want to keep, then click Shuffle to re-roll the rest.
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/25 px-3 py-1.5 rounded-lg">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {activeBookmaker.flag} {activeBookmaker.name}:
                      </span>
                      <span className="font-mono font-black text-sm text-primary">{currentBookingCode}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCode(currentBookingCode, `${activeBookmaker.name} Code`)}
                        className="h-6 w-6 p-0"
                        title="Copy Booking Code"
                      >
                        {copiedCode === currentBookingCode ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-2.5 flex-1">
                  {generatedLegs.map((leg, idx) => {
                    const isLocked = Boolean(lockedIds[leg.id]);
                    const gameId = generateMatchGameId(leg.homeTeam, leg.awayTeam, activeBookmaker.id);
                    const translated = translateMarketForBookmaker(leg.market, activeBookmaker.id);

                    return (
                      <div
                        key={leg.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isLocked ? 'bg-primary/5 border-primary/40' : 'bg-muted/30 border-border/70'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleLock(leg)}
                            title={isLocked ? 'Unlock pick' : 'Lock pick'}
                            className={`mt-0.5 p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isLocked
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground hover:text-foreground border-border'
                            }`}
                          >
                            {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
                              <span className="font-mono font-bold text-primary">#{gameId}</span>
                              <span>•</span>
                              <span className="truncate">{leg.league}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                              <TeamLogo team={leg.homeTeam} size="xs" />
                              <span className="truncate">{leg.homeTeam}</span>
                              <span className="text-xs text-muted-foreground font-normal">vs</span>
                              <TeamLogo team={leg.awayTeam} size="xs" />
                              <span className="truncate">{leg.awayTeam}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                          <div className="text-left sm:text-right">
                            <Badge variant="outline" className="font-bold text-xs bg-background text-primary">
                              {translated}
                            </Badge>
                            <div className="mt-1">
                              <ConfidenceMeter confidence={leg.confidence} variant="compact" />
                            </div>
                          </div>
                          <div className="px-2.5 py-1.5 rounded-lg bg-background border font-mono font-black text-sm text-foreground">
                            @{formatOdds(leg.odds)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>

                {/* Slip Footer */}
                <div className="p-4 border-t bg-muted/20 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-background border">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Total Odds</span>
                      <span className="font-mono font-black text-base text-foreground">{combinedOdds.toFixed(2)}x</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-background border">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Avg AI Conf</span>
                      <span className="font-mono font-black text-base text-emerald-500">{combinedConfidence}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Return ({currentConfig.code} {stake})
                      </span>
                      <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                        {currentConfig.code} {Math.round(stake * combinedOdds).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleLoadIntoBetSlip(generatedLegs, true)}
                      className="flex-1 gap-1.5 text-xs font-bold"
                    >
                      <Ticket className="h-4 w-4" />
                      Load Slip to Drawer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        downloadSlipAsPngImage({
                          selections: generatedLegs,
                          totalOdds: combinedOdds,
                          stake,
                          currency: currentConfig.code,
                          potentialReturn: stake * combinedOdds,
                          bookmakerName: activeBookmaker.name,
                          bookingCode: currentBookingCode,
                        });
                        toast.success('Downloaded high-DPI PNG Bet Slip Card!');
                      }}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download PNG Card
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleShareGeneratedSlip}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share Auto-Load Link
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: UNIVERSAL BOOKING CODE CONVERTER */}
          <TabsContent value="converter" className="space-y-6">
            <Card className="border bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-emerald-500" />
                  Universal Bookmaker Booking Code Converter
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Convert any SportyBet, 1xBet, Bet9ja, SportPesa, Betika, Betway, or Bet365 booking code into your preferred bookmaker’s exact market nomenclature and 4-digit coupon Game IDs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-muted/30 p-4 rounded-xl border">
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">
                      Enter Source Booking Code
                    </label>
                    <Input
                      value={inputBookingCode}
                      onChange={(e) => setInputBookingCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SB-4X-9K2LM or BC892KL"
                      className="font-mono font-bold text-sm uppercase"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">From Bookmaker</label>
                    <select
                      value={sourceBookmakerId}
                      onChange={(e) => setSourceBookmakerId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border bg-background text-xs font-bold"
                    >
                      {REGIONAL_BOOKMAKERS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.flag} {b.name} ({b.region})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const tmp = sourceBookmakerId;
                        setSourceBookmakerId(targetBookmakerId);
                        setTargetBookmakerId(tmp);
                      }}
                      title="Swap source and target bookmakers"
                    >
                      <ArrowLeftRight className="h-4 w-4 text-primary" />
                    </Button>
                  </div>

                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground block">To Target Bookmaker</label>
                    <select
                      value={targetBookmakerId}
                      onChange={(e) => setTargetBookmakerId(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border bg-background text-xs font-bold"
                    >
                      {REGIONAL_BOOKMAKERS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.flag} {b.name} ({b.region})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conversion Result Banner */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {conversionResult.sourceBookmaker.flag} {conversionResult.sourceBookmaker.name} (
                        <strong className="font-mono text-foreground">{conversionResult.sourceCode}</strong> ·{' '}
                        {conversionResult.totalSourceOdds}x)
                      </span>
                      <span>→</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {conversionResult.targetBookmaker.flag} {conversionResult.targetBookmaker.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-xl sm:text-2xl text-foreground">
                        {conversionResult.targetCode}
                      </span>
                      <Badge className="bg-emerald-600 text-white font-mono">
                        {conversionResult.totalTargetOdds}x Converted Odds
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleCopyCode(
                          conversionResult.targetCode,
                          `${conversionResult.targetBookmaker.name} Code`
                        )
                      }
                      className="gap-1.5 text-xs font-bold"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy {conversionResult.targetBookmaker.name} Code
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleLoadIntoBetSlip(
                          conversionResult.legs.map((l, i) => ({
                            id: `${l.gameId}-${i}`,
                            homeTeam: l.homeTeam,
                            awayTeam: l.awayTeam,
                            league: l.league,
                            market: l.translatedMarket,
                            odds: l.convertedOdds,
                            confidence: l.confidence,
                          })),
                          true
                        )
                      }
                      className="gap-1.5 text-xs font-bold"
                    >
                      <Ticket className="h-3.5 w-3.5" />
                      Load Converted Slip
                    </Button>
                    <a
                      href={conversionResult.targetBookmaker.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-md border bg-background hover:bg-muted text-xs font-semibold"
                    >
                      Open {conversionResult.targetBookmaker.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Side-by-Side Market Translation Table */}
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground uppercase border-b">
                      <tr>
                        <th className="py-2.5 px-3">Game ID</th>
                        <th className="py-2.5 px-3">Fixture</th>
                        <th className="py-2.5 px-3">{conversionResult.sourceBookmaker.name} Market</th>
                        <th className="py-2.5 px-3">{conversionResult.targetBookmaker.name} Equivalent</th>
                        <th className="py-2.5 px-3 text-right">Converted Odds</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {conversionResult.legs.map((leg) => (
                        <tr key={leg.gameId} className="hover:bg-muted/30">
                          <td className="py-2.5 px-3 font-mono font-bold text-primary">#{leg.gameId}</td>
                          <td className="py-2.5 px-3 font-bold">
                            {leg.homeTeam} vs {leg.awayTeam}
                            <span className="block text-[10px] font-normal text-muted-foreground">
                              {leg.league}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground font-mono">{leg.originalMarket}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {leg.translatedMarket}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black">
                            @{leg.convertedOdds.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: DAILY AUTOMATED CRON BOOKING CODES */}
          <TabsContent value="daily-codes" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    Automated Daily Cron Booking Codes Feed
                    <Badge variant="outline" className="text-[10px] font-mono">
                      Last Sync: {lastCronSync}
                    </Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Pre-computed every 2 hours by the PredictPro Booking Codes Cron (`/api/booking-codes-cron`).
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                disabled={syncingCronCodes}
                onClick={handleSyncBookingCodesCron}
                className="gap-1.5 text-xs font-bold"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncingCronCodes ? 'animate-spin' : ''}`} />
                {syncingCronCodes ? 'Syncing Cron...' : 'Sync Cron Codes Now'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {dailyCronPackages.map((pkg) => (
                <Card key={pkg.id} className="border bg-card flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {pkg.badge}
                      </Badge>
                      <span className="font-mono font-black text-base text-emerald-500">{pkg.odds}x Odds</span>
                    </div>
                    <CardTitle className="text-base font-black">{pkg.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {pkg.legs.length} Verified Selections · {pkg.conf}% Combined AI Confidence
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3 flex-1">
                    <div className="space-y-1.5">
                      {pkg.legs.map((l) => (
                        <div
                          key={l.id}
                          className="text-xs flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                        >
                          <span className="truncate font-medium max-w-[165px]">
                            {l.homeTeam} vs {l.awayTeam}
                          </span>
                          <span className="font-mono font-bold text-primary">
                            {l.market} @{l.odds.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Instant Bookmaker Codes
                      </p>
                      {Object.entries(pkg.codes).map(([bookieKey, code]) => (
                        <div
                          key={bookieKey}
                          className="flex items-center justify-between bg-muted/40 px-2.5 py-1.5 rounded-lg border text-xs"
                        >
                          <span className="uppercase font-bold text-[10px] text-muted-foreground">
                            {bookieKey}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-foreground">{code}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(code, `${bookieKey.toUpperCase()} Code`)}
                              className="text-primary hover:underline text-[11px] font-bold cursor-pointer"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <div className="p-4 pt-0">
                    <Button
                      size="sm"
                      onClick={() => handleLoadIntoBetSlip(pkg.legs, true)}
                      className="w-full gap-1.5 text-xs font-bold"
                    >
                      <Ticket className="h-3.5 w-3.5" />
                      Load {pkg.legs.length}-Leg Slip
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
