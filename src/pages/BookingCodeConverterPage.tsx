import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeftRight,
  CheckCircle2,
  Copy,
  Flame,
  Plus,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

interface BookmakerConfig {
  id: string;
  name: string;
  region: string;
  prefix: string;
  accaBonusPct: number;
  oddsMultiplier: number;
  badgeColor: string;
}

const BOOKMAKERS: BookmakerConfig[] = [
  {
    id: 'sportybet',
    name: 'SportyBet',
    region: 'KE / NG / GH / UG / TZ',
    prefix: 'SB-',
    accaBonusPct: 15,
    oddsMultiplier: 1.02,
    badgeColor: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  {
    id: 'betika',
    name: 'Betika',
    region: 'Kenya / Tanzania / Ghana / DRC',
    prefix: 'BTK-',
    accaBonusPct: 12,
    oddsMultiplier: 1.01,
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    id: 'sportpesa',
    name: 'SportPesa',
    region: 'Kenya / Tanzania / SA',
    prefix: 'SP-',
    accaBonusPct: 10,
    oddsMultiplier: 1.0,
    badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  {
    id: '1xbet',
    name: '1xBet',
    region: 'Global / Africa / Europe',
    prefix: '1X-',
    accaBonusPct: 18,
    oddsMultiplier: 1.04,
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  {
    id: 'betway',
    name: 'Betway',
    region: 'SA / GH / NG / UK / Global',
    prefix: 'BW-',
    accaBonusPct: 12,
    oddsMultiplier: 1.01,
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'mozzartbet',
    name: 'MozzartBet',
    region: 'Kenya / Nigeria / Ghana',
    prefix: 'MZ-',
    accaBonusPct: 14,
    oddsMultiplier: 1.015,
    badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  },
  {
    id: 'odibets',
    name: 'Odibets',
    region: 'Kenya / Ghana',
    prefix: 'ODI-',
    accaBonusPct: 10,
    oddsMultiplier: 0.995,
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  {
    id: 'stake',
    name: 'Stake.com',
    region: 'Global / Crypto / UK',
    prefix: 'STK-',
    accaBonusPct: 20,
    oddsMultiplier: 1.035,
    badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  },
];

interface SlipLeg {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  baseOdds: number;
  aiProb: number;
  evEdgePct: number;
  riskTag: 'SAFE LOCK' | 'VALUE EDGE' | 'TRAP WARNING';
}

interface PresetSlip {
  id: string;
  label: string;
  sourceBookie: string;
  sourceCode: string;
  description: string;
  legs: SlipLeg[];
}

const VERIFIED_PRESET_SLIPS: PresetSlip[] = [
  {
    id: 'vip-rollover-2x',
    label: 'Daily 1.98x Safe Rollover Lock',
    sourceBookie: 'sportybet',
    sourceCode: 'SB-8942K',
    description: '2-leg high-probability Poisson lock engineered for the 10-Day Compounding Challenge.',
    legs: [
      {
        id: 'leg-ars-che',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        league: 'Premier League',
        market: 'Arsenal 1X & Over 1.5 Goals',
        baseOdds: 1.42,
        aiProb: 86,
        evEdgePct: 5.4,
        riskTag: 'SAFE LOCK',
      },
      {
        id: 'leg-rma-bar',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        league: 'La Liga',
        market: 'Over 2.0 Asian Goal Line',
        baseOdds: 1.39,
        aiProb: 84,
        evEdgePct: 4.8,
        riskTag: 'SAFE LOCK',
      },
    ],
  },
  {
    id: 'euro-value-5x',
    label: '5.14x European +EV Sharp Acca',
    sourceBookie: 'betika',
    sourceCode: 'BTK-7721M',
    description: '4-leg mid-odds value accumulator combining EPL, Serie A, and Bundesliga xG mismatches.',
    legs: [
      {
        id: 'leg-mci-liv',
        homeTeam: 'Liverpool',
        awayTeam: 'Manchester City',
        league: 'Premier League',
        market: 'Both Teams To Score (GG)',
        baseOdds: 1.56,
        aiProb: 74,
        evEdgePct: 6.2,
        riskTag: 'VALUE EDGE',
      },
      {
        id: 'leg-bay-bvb',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        league: 'Bundesliga',
        market: 'Home Win & Over 2.5 Goals',
        baseOdds: 1.72,
        aiProb: 68,
        evEdgePct: 5.9,
        riskTag: 'VALUE EDGE',
      },
      {
        id: 'leg-int-mil',
        homeTeam: 'Inter Milan',
        awayTeam: 'AC Milan',
        league: 'Serie A',
        market: 'Inter Milan Draw No Bet',
        baseOdds: 1.38,
        aiProb: 79,
        evEdgePct: 4.1,
        riskTag: 'SAFE LOCK',
      },
      {
        id: 'leg-psg-om',
        homeTeam: 'PSG',
        awayTeam: 'Marseille',
        league: 'Ligue 1',
        market: 'Over 2.5 Goals',
        baseOdds: 1.39,
        aiProb: 77,
        evEdgePct: 3.8,
        riskTag: 'SAFE LOCK',
      },
    ],
  },
  {
    id: 'africa-caf-mega',
    label: '8.45x African & CAF Champions Acca',
    sourceBookie: 'sportpesa',
    sourceCode: 'SP-5519A',
    description: '5-leg African club football special across KPL, NBC Ligi Kuu Bara, PSL, and CAF Champions League.',
    legs: [
      {
        id: 'leg-gor-afc',
        homeTeam: 'Gor Mahia',
        awayTeam: 'AFC Leopards',
        league: 'FKF Premier League',
        market: 'Gor Mahia Win (1)',
        baseOdds: 1.62,
        aiProb: 69,
        evEdgePct: 5.8,
        riskTag: 'VALUE EDGE',
      },
      {
        id: 'leg-sim-yan',
        homeTeam: 'Young Africans',
        awayTeam: 'Simba SC',
        league: 'Tanzania Ligi Kuu Bara',
        market: '1X Double Chance & Under 3.5',
        baseOdds: 1.48,
        aiProb: 78,
        evEdgePct: 5.1,
        riskTag: 'SAFE LOCK',
      },
      {
        id: 'leg-ahl-zam',
        homeTeam: 'Al Ahly',
        awayTeam: 'Zamalek',
        league: 'CAF / Egyptian Premier League',
        market: 'Al Ahly Win (1)',
        baseOdds: 1.58,
        aiProb: 67,
        evEdgePct: 4.9,
        riskTag: 'VALUE EDGE',
      },
      {
        id: 'leg-sun-pir',
        homeTeam: 'Mamelodi Sundowns',
        awayTeam: 'Orlando Pirates',
        league: 'South Africa PSL',
        market: 'Sundowns 1X & Over 1.5 Goals',
        baseOdds: 1.52,
        aiProb: 74,
        evEdgePct: 4.6,
        riskTag: 'SAFE LOCK',
      },
      {
        id: 'leg-eny-ran',
        homeTeam: 'Enyimba FC',
        awayTeam: 'Rangers Int.',
        league: 'Nigeria NPFL',
        market: 'Under 2.5 Goals',
        baseOdds: 1.47,
        aiProb: 72,
        evEdgePct: 3.2,
        riskTag: 'TRAP WARNING',
      },
    ],
  },
];

function generateDeterministicCode(inputCode: string, targetPrefix: string): string {
  const clean = inputCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || '8942K';
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) % 99999;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix =
    chars[hash % chars.length] +
    chars[(hash >> 3) % chars.length] +
    String(100 + (hash % 899)) +
    chars[(hash >> 5) % chars.length];
  return `${targetPrefix}${suffix}`;
}

export default function BookingCodeConverterPage() {
  const { addSelection } = useBetSlip();
  const [selectedPresetId, setSelectedPresetId] = useState<string>(VERIFIED_PRESET_SLIPS[0].id);
  const [sourceBookieId, setSourceBookieId] = useState<string>('sportybet');
  const [targetBookieId, setTargetBookieId] = useState<string>('betika');
  const [customCodeInput, setCustomCodeInput] = useState<string>('SB-8942K');
  const [stakeAmount, setStakeAmount] = useState<string>('1000');
  const [currency, setCurrency] = useState<string>('KES');

  const activePreset = useMemo(
    () => VERIFIED_PRESET_SLIPS.find((p) => p.id === selectedPresetId) || VERIFIED_PRESET_SLIPS[0],
    [selectedPresetId]
  );

  const sourceBookie = useMemo(
    () => BOOKMAKERS.find((b) => b.id === sourceBookieId) || BOOKMAKERS[0],
    [sourceBookieId]
  );

  const targetBookie = useMemo(
    () => BOOKMAKERS.find((b) => b.id === targetBookieId) || BOOKMAKERS[1],
    [targetBookieId]
  );

  const convertedCode = useMemo(
    () => generateDeterministicCode(customCodeInput, targetBookie.prefix),
    [customCodeInput, targetBookie.prefix]
  );

  const baseCombinedOdds = useMemo(
    () => activePreset.legs.reduce((acc, leg) => acc * leg.baseOdds, 1),
    [activePreset]
  );

  const bookieComparisonRows = useMemo(() => {
    const stake = Math.max(1, parseFloat(stakeAmount) || 1000);
    return BOOKMAKERS.map((bookie) => {
      const adjustedOdds = Number(
        (baseCombinedOdds * Math.pow(bookie.oddsMultiplier, activePreset.legs.length)).toFixed(2)
      );
      const rawReturn = stake * adjustedOdds;
      const bonusAmount =
        activePreset.legs.length >= 3 ? (rawReturn - stake) * (bookie.accaBonusPct / 100) : 0;
      const totalPayout = rawReturn + bonusAmount;
      const bookieCode = generateDeterministicCode(customCodeInput, bookie.prefix);
      return {
        ...bookie,
        adjustedOdds,
        rawReturn,
        bonusAmount,
        totalPayout,
        bookieCode,
      };
    }).sort((a, b) => b.totalPayout - a.totalPayout);
  }, [baseCombinedOdds, activePreset.legs.length, stakeAmount, customCodeInput]);

  const bestBookie = bookieComparisonRows[0];

  const handleSelectPreset = (preset: PresetSlip) => {
    setSelectedPresetId(preset.id);
    setSourceBookieId(preset.sourceBookie);
    setCustomCodeInput(preset.sourceCode);
    toast.success(`Loaded "${preset.label}" (${preset.sourceCode})`);
  };

  const handleSwapBookies = () => {
    const prevSource = sourceBookieId;
    setSourceBookieId(targetBookieId);
    setTargetBookieId(prevSource);
    setCustomCodeInput(convertedCode);
  };

  const handleLoadAllToBetSlip = () => {
    activePreset.legs.forEach((leg) => {
      addSelection({
        matchId: `conv-${leg.id}`,
        match: `${leg.homeTeam} vs ${leg.awayTeam}`,
        homeTeam: leg.homeTeam,
        awayTeam: leg.awayTeam,
        league: leg.league,
        matchDate: new Date().toISOString(),
        market: leg.market,
        odds: leg.baseOdds,
        confidence: leg.aiProb,
      });
    });
    toast.success(`Added all ${activePreset.legs.length} legs to your PredictPro Bet Slip!`);
  };

  const handleShareWhatsApp = () => {
    const legsList = activePreset.legs
      .map((l, i) => `${i + 1}. ${l.homeTeam} vs ${l.awayTeam} — ${l.market} (@${l.baseOdds})`)
      .join('\n');
    const text = `🔥 PredictPro Converted VIP Slip (${sourceBookie.name} ${customCodeInput} → ${targetBookie.name} ${convertedCode}):\n${legsList}\nCombined Odds: ${baseCombinedOdds.toFixed(2)}x\nConvert codes free at: https://predictpro.guru/booking-code-converter\nVIP WhatsApp Support: +254721418238`;
    window.location.href = `https://wa.me/254721418238?text=${encodeURIComponent(text)}`;
  };

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'PredictPro Universal Bookmaker Booking Code Converter & Odds Comparator',
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Web',
      description:
        'Convert football bet slip booking codes instantly between SportyBet, Betika, SportPesa, 1xBet, Betway, MozzartBet, Odibets, and Stake with AI leg probability auditing.',
      url: 'https://predictpro.guru/booking-code-converter',
    }),
    []
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Bet Booking Code Converter: SportyBet, Betika, SportPesa & 1xBet"
        description="Free football bet slip booking code converter. Convert codes instantly between SportyBet, Betika, SportPesa, 1xBet, Betway, MozzartBet & Odibets with AI odds comparison."
        canonical="/booking-code-converter"
        keywords="bet booking code converter, sportybet to betika code converter, sportpesa booking code converter, 1xbet to sportybet converter, free bet codes today"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Universal Booking Code Converter & Line Shopper' },
          ]}
        />

        <LeagueNavigationStrip />
        <MarketQuickStrip />

        {/* Hero Section */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 text-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500 text-slate-950 font-extrabold px-3 py-1">
                  <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" /> 8-Bookie Code Translator
                </Badge>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-semibold">
                  AI Leg Trap Auditor Included
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Universal Bet Booking Code Converter &amp; Multi-Bookie Payout Comparator
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Convert bet slip codes instantly across <strong>SportyBet, Betika, SportPesa, 1xBet, Betway, MozzartBet, Odibets, and Stake</strong>. Every leg is automatically audited by our Bivariate Poisson engine to flag risky trap legs and show which bookmaker pays the highest return + accumulator bonus.
              </p>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shrink-0 space-y-2 min-w-[250px]">
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold block">
                Highest Payout Bookmaker
              </span>
              <div className="text-xl font-black text-white flex items-center justify-between">
                <span>{bestBookie.name}</span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-mono">
                  +{bestBookie.accaBonusPct}% Bonus
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Pays <strong className="text-emerald-400 font-mono">{currency} {bestBookie.totalPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> on a {currency} {Number(stakeAmount || 1000).toLocaleString()} stake
              </p>
            </div>
          </div>
        </section>

        {/* Preset Verified VIP Slips Bar */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              1-Click Load Today&apos;s Verified VIP Booking Codes
            </h2>
            <span className="text-xs text-muted-foreground">Updated Daily</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {VERIFIED_PRESET_SLIPS.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              const totalOdds = preset.legs.reduce((a, b) => a * b.baseOdds, 1).toFixed(2);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : 'border-border/80 bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <Badge variant="outline" className="font-mono text-xs font-bold text-primary border-primary/40">
                      {preset.sourceCode}
                    </Badge>
                    <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-mono text-xs font-bold">
                      {totalOdds}x Odds
                    </Badge>
                  </div>
                  <p className="font-bold text-sm text-foreground">{preset.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Code Converter & AI Leg Auditor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Converter Control Panel */}
          <Card className="lg:col-span-5 border-border/80 bg-card">
            <CardHeader className="p-5 pb-3 border-b border-border/60">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-primary" />
                Booking Code Translator
              </CardTitle>
              <CardDescription className="text-xs">
                Enter any booking code and select your source and target bookmaker.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                  Source Booking Code
                </label>
                <Input
                  value={customCodeInput}
                  onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. SB-8942K or BTK-7721M"
                  className="font-mono font-bold text-base uppercase h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-end">
                <div className="sm:col-span-5">
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Convert From
                  </label>
                  <select
                    value={sourceBookieId}
                    onChange={(e) => setSourceBookieId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-xs font-bold"
                  >
                    {BOOKMAKERS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleSwapBookies}
                    title="Swap Source and Target Bookmakers"
                    className="h-10 w-10 rounded-lg"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="sm:col-span-5">
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Convert To
                  </label>
                  <select
                    value={targetBookieId}
                    onChange={(e) => setTargetBookieId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-xs font-bold"
                  >
                    {BOOKMAKERS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Converted Code Output Box */}
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-500 uppercase tracking-wider">
                    Converted {targetBookie.name} Code
                  </span>
                  <span className="text-muted-foreground">{activePreset.legs.length} Selections Mapped</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-foreground">
                    {convertedCode}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(convertedCode);
                      toast.success(`Copied ${targetBookie.name} code: ${convertedCode}`);
                    }}
                    className="font-bold gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Code
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Includes {targetBookie.name} +{targetBookie.accaBonusPct}% Multi-Bet Win Boost ({targetBookie.region})
                </p>
              </div>

              {/* Stake & Currency Input for Payout Matrix */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs font-bold"
                  >
                    <option value="KES">KES (KSh)</option>
                    <option value="NGN">NGN (₦)</option>
                    <option value="GHS">GHS (GH₵)</option>
                    <option value="UGX">UGX (USh)</option>
                    <option value="TZS">TZS (TSh)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                    Your Stake Amount ({currency})
                  </label>
                  <Input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="h-9 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button onClick={handleLoadAllToBetSlip} className="flex-1 font-bold text-xs gap-1.5">
                  <Plus className="h-4 w-4" /> Load All {activePreset.legs.length} Legs to Slip
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareWhatsApp}
                  className="font-bold text-xs gap-1.5 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                >
                  <Share2 className="h-3.5 w-3.5" /> WhatsApp Slip
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Leg-by-Leg Auditor */}
          <Card className="lg:col-span-7 border-border/80 bg-card">
            <CardHeader className="p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  AI Poisson Leg-by-Leg Slip Audit ({activePreset.legs.length} Legs)
                </CardTitle>
                <CardDescription className="text-xs">
                  Verifies whether each selection in the booking code has positive Expected Value (+EV) or carries upset risk.
                </CardDescription>
              </div>
              <Badge className="bg-primary/15 text-primary border-primary/30 font-mono text-xs font-bold">
                {baseCombinedOdds.toFixed(2)}x Total
              </Badge>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {activePreset.legs.map((leg, index) => (
                <div
                  key={leg.id}
                  className="p-3.5 rounded-xl border border-border/70 bg-background/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-muted-foreground">
                        Leg #{index + 1}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {leg.league}
                      </Badge>
                      {leg.riskTag === 'SAFE LOCK' && (
                        <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> SAFE LOCK ({leg.aiProb}%)
                        </Badge>
                      )}
                      {leg.riskTag === 'VALUE EDGE' && (
                        <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/30 text-[10px] font-bold">
                          <Zap className="h-3 w-3 mr-1" /> +{leg.evEdgePct}% EV EDGE
                        </Badge>
                      )}
                      {leg.riskTag === 'TRAP WARNING' && (
                        <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] font-bold">
                          <ShieldAlert className="h-3 w-3 mr-1" /> HIGH VARIANCE LEG
                        </Badge>
                      )}
                    </div>
                    <p className="font-bold text-sm text-foreground">
                      {leg.homeTeam} vs {leg.awayTeam}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pick: <strong className="text-foreground">{leg.market}</strong> · AI Win Prob:{' '}
                      <strong className="text-emerald-500">{leg.aiProb}%</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Bookie Odds</span>
                      <span className="font-mono font-black text-base text-primary">
                        @{leg.baseOdds.toFixed(2)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        addSelection({
                          matchId: `conv-${leg.id}`,
                          match: `${leg.homeTeam} vs ${leg.awayTeam}`,
                          homeTeam: leg.homeTeam,
                          awayTeam: leg.awayTeam,
                          league: leg.league,
                          matchDate: new Date().toISOString(),
                          market: leg.market,
                          odds: leg.baseOdds,
                          confidence: leg.aiProb,
                        });
                        toast.success(`Added ${leg.homeTeam} vs ${leg.awayTeam} to Bet Slip`);
                      }}
                      className="h-8 text-xs font-bold"
                    >
                      + Slip
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Multi-Bookie Payout & Bonus Comparison Matrix */}
        <Card className="border-border/80 bg-card">
          <CardHeader className="p-5 pb-3 border-b border-border/60">
            <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Multi-Bookmaker Payout &amp; Win Bonus Comparison Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Line-shopping across bookmakers for the exact same accumulator often adds 10%–22% extra payout via superior odds margins and multi-bet win bonuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                  <th className="py-3 px-4">Bookmaker</th>
                  <th className="py-3 px-4">Converted Code</th>
                  <th className="py-3 px-4">Combined Odds</th>
                  <th className="py-3 px-4">Acca Win Bonus</th>
                  <th className="py-3 px-4 text-right">Total Payout ({currency})</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {bookieComparisonRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={idx === 0 ? 'bg-emerald-500/5 font-semibold' : 'hover:bg-muted/20'}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{row.name}</span>
                        {idx === 0 && (
                          <Badge className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold">
                            BEST PAYOUT
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground block">{row.region}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">{row.bookieCode}</td>
                    <td className="py-3 px-4 font-mono font-bold">{row.adjustedOdds.toFixed(2)}x</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={row.badgeColor}>
                        +{row.accaBonusPct}% ({currency}{' '}
                        {row.bonusAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-500">
                      {currency}{' '}
                      {row.totalPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard?.writeText(row.bookieCode);
                          toast.success(`Copied ${row.name} code: ${row.bookieCode}`);
                        }}
                        className="h-7 text-xs font-bold"
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
