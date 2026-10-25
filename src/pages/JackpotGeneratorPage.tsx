import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Copy,
  Flame,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

type PickOption = '1' | 'X' | '2';

interface JackpotFixture {
  gameNo: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: string;
  odds1: number;
  oddsX: number;
  odds2: number;
  aiBanker: PickOption;
  aiHedgeSecond: PickOption;
  aiConfidence: number;
  varianceLevel: 'BANKER LOCK' | 'MODERATE' | 'HIGH VARIANCE COIN-FLIP';
  tacticalNote: string;
}

interface JackpotProviderConfig {
  id: 'sportpesa-mega' | 'betika-grand' | 'mozzart-super' | 'sportpesa-midweek';
  name: string;
  countryFlag: string;
  totalGames: number;
  jackpotPool: string;
  lineCost: number;
  currency: string;
  bonusTiers: string[];
  bookingPrefix: string;
}

const JACKPOT_PROVIDERS: JackpotProviderConfig[] = [
  {
    id: 'sportpesa-mega',
    name: 'SportPesa 17-Game Mega Jackpot',
    countryFlag: '🇰🇪',
    totalGames: 17,
    jackpotPool: 'KES 384,912,450',
    lineCost: 99,
    currency: 'KES',
    bonusTiers: ['13/17 Correct', '14/17 Correct', '15/17 Correct', '16/17 Correct', '17/17 Mega Prize'],
    bookingPrefix: 'SPMJ',
  },
  {
    id: 'betika-grand',
    name: 'Betika 17-GameSababisha Grand Jackpot',
    countryFlag: '🇰🇪',
    totalGames: 17,
    jackpotPool: 'KES 100,000,000',
    lineCost: 49,
    currency: 'KES',
    bonusTiers: ['12/17 Bonus', '13/17 Bonus', '14/17 Bonus', '15/17 Bonus', '16/17 Bonus', '17/17 Grand Prize'],
    bookingPrefix: 'BTKG',
  },
  {
    id: 'mozzart-super',
    name: 'Mozzart Super Grand Jackpot (17 Split)',
    countryFlag: '🌍',
    totalGames: 17,
    jackpotPool: 'KES 200,000,000',
    lineCost: 50,
    currency: 'KES',
    bonusTiers: ['0/17 Refund Bonus', '14/17 Bonus', '15/17 Bonus', '16/17 Bonus', '17/17 Super Prize'],
    bookingPrefix: 'MZJP',
  },
  {
    id: 'sportpesa-midweek',
    name: 'SportPesa 13-Game Midweek Jackpot',
    countryFlag: '🇰🇪',
    totalGames: 13,
    jackpotPool: 'KES 22,450,800',
    lineCost: 99,
    currency: 'KES',
    bonusTiers: ['10/13 Bonus', '11/13 Bonus', '12/13 Bonus', '13/13 Midweek Prize'],
    bookingPrefix: 'SPMW',
  },
];

const MASTER_JACKPOT_FIXTURES: JackpotFixture[] = [
  {
    gameNo: 1,
    homeTeam: 'Arsenal',
    awayTeam: 'Newcastle United',
    league: 'Premier League',
    kickoff: 'Sat 15:00',
    odds1: 1.62,
    oddsX: 3.95,
    odds2: 5.40,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 87,
    varianceLevel: 'BANKER LOCK',
    tacticalNote: 'Arsenal generate 2.38 home xG/90 and hold an 84% win rate at the Emirates.',
  },
  {
    gameNo: 2,
    homeTeam: 'Aston Villa',
    awayTeam: 'Tottenham',
    league: 'Premier League',
    kickoff: 'Sat 17:30',
    odds1: 2.35,
    oddsX: 3.60,
    odds2: 2.85,
    aiBanker: '1',
    aiHedgeSecond: '2',
    aiConfidence: 63,
    varianceLevel: 'HIGH VARIANCE COIN-FLIP',
    tacticalNote: 'Both sides play high defensive lines; only 1 draw in their last 11 meetings (use 12 hedge).',
  },
  {
    gameNo: 3,
    homeTeam: 'Brighton',
    awayTeam: 'Fulham',
    league: 'Premier League',
    kickoff: 'Sat 15:00',
    odds1: 2.05,
    oddsX: 3.45,
    odds2: 3.55,
    aiBanker: 'X',
    aiHedgeSecond: '1',
    aiConfidence: 65,
    varianceLevel: 'HIGH VARIANCE COIN-FLIP',
    tacticalNote: 'Fulham are unbeaten in 5 straight H2H clashes against Brighton; 1X covers 82% Poisson density.',
  },
  {
    gameNo: 4,
    homeTeam: 'Real Madrid',
    awayTeam: 'Villarreal',
    league: 'La Liga',
    kickoff: 'Sat 20:00',
    odds1: 1.44,
    oddsX: 4.70,
    odds2: 6.80,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 91,
    varianceLevel: 'BANKER LOCK',
    tacticalNote: 'Pure single-pick AI Banker: Real Madrid boast +1.64 net xG differential at the Bernabéu.',
  },
  {
    gameNo: 5,
    homeTeam: 'Athletic Bilbao',
    awayTeam: 'Real Sociedad',
    league: 'La Liga',
    kickoff: 'Sun 18:30',
    odds1: 2.20,
    oddsX: 3.10,
    odds2: 3.50,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 66,
    varianceLevel: 'HIGH VARIANCE COIN-FLIP',
    tacticalNote: 'Basque Derby with tight low-scoring xG (2.05 total). 1X Double Chance locks in 86% safety.',
  },
  {
    gameNo: 6,
    homeTeam: 'Inter Milan',
    awayTeam: 'Napoli',
    league: 'Serie A',
    kickoff: 'Sun 19:45',
    odds1: 1.85,
    oddsX: 3.50,
    odds2: 4.30,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 82,
    varianceLevel: 'BANKER LOCK',
    tacticalNote: 'Inter lead Serie A in box entries and set-piece xG at San Siro.',
  },
  {
    gameNo: 7,
    homeTeam: 'Atalanta',
    awayTeam: 'Lazio',
    league: 'Serie A',
    kickoff: 'Sun 17:00',
    odds1: 1.95,
    oddsX: 3.50,
    odds2: 3.85,
    aiBanker: '1',
    aiHedgeSecond: '2',
    aiConfidence: 76,
    varianceLevel: 'MODERATE',
    tacticalNote: 'Atalanta press aggressively in Bergamo; strong home edge.',
  },
  {
    gameNo: 8,
    homeTeam: 'Bayer Leverkusen',
    awayTeam: 'Eintracht Frankfurt',
    league: 'Bundesliga',
    kickoff: 'Sat 14:30',
    odds1: 1.58,
    oddsX: 4.25,
    odds2: 5.25,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 88,
    varianceLevel: 'BANKER LOCK',
    tacticalNote: 'Leverkusen average 2.55 home goals per match.',
  },
  {
    gameNo: 9,
    homeTeam: 'Borussia Dortmund',
    awayTeam: 'RB Leipzig',
    league: 'Bundesliga',
    kickoff: 'Sat 17:30',
    odds1: 2.25,
    oddsX: 3.65,
    odds2: 2.95,
    aiBanker: '1',
    aiHedgeSecond: '2',
    aiConfidence: 64,
    varianceLevel: 'HIGH VARIANCE COIN-FLIP',
    tacticalNote: 'End-to-end transition clash; hedging 12 avoids the high-tempo shootout variance.',
  },
  {
    gameNo: 10,
    homeTeam: 'Gor Mahia',
    awayTeam: 'Tusker FC',
    league: 'FKF Premier League',
    kickoff: 'Sun 15:00',
    odds1: 1.78,
    oddsX: 3.20,
    odds2: 4.60,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 85,
    varianceLevel: 'BANKER LOCK',
    tacticalNote: 'Gor Mahia concede just 0.58 xGA/90 in Nairobi.',
  },
  {
    gameNo: 11,
    homeTeam: 'Simba SC',
    awayTeam: 'Azam FC',
    league: 'Tanzania NBC League',
    kickoff: 'Sun 16:00',
    odds1: 1.82,
    oddsX: 3.25,
    odds2: 4.35,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 81,
    varianceLevel: 'BANKER LOCK',
    tacticalNote: 'Simba SC dominate Dar es Salaam possession & dead-ball xG.',
  },
  {
    gameNo: 12,
    homeTeam: 'Kaizer Chiefs',
    awayTeam: 'Orlando Pirates',
    league: 'South Africa PSL',
    kickoff: 'Sat 15:30',
    odds1: 3.10,
    oddsX: 2.95,
    odds2: 2.40,
    aiBanker: '2',
    aiHedgeSecond: 'X',
    aiConfidence: 67,
    varianceLevel: 'HIGH VARIANCE COIN-FLIP',
    tacticalNote: 'Soweto Derby: Pirates hold superior xG form, X2 Double Chance covers stalemate.',
  },
  {
    gameNo: 13,
    homeTeam: 'Raja Casablanca',
    awayTeam: 'Wydad AC',
    league: 'Morocco Botola Pro',
    kickoff: 'Sun 20:00',
    odds1: 2.15,
    oddsX: 3.00,
    odds2: 3.60,
    aiBanker: 'X',
    aiHedgeSecond: '1',
    aiConfidence: 74,
    varianceLevel: 'MODERATE',
    tacticalNote: 'Casablanca Derby historically produces 44% draws; 1X or X Banker.',
  },
  {
    gameNo: 14,
    homeTeam: 'Monaco',
    awayTeam: 'Lille',
    league: 'Ligue 1',
    kickoff: 'Fri 20:45',
    odds1: 2.10,
    oddsX: 3.40,
    odds2: 3.45,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 78,
    varianceLevel: 'MODERATE',
    tacticalNote: 'Monaco create 1.94 xG/90 at Stade Louis II.',
  },
  {
    gameNo: 15,
    homeTeam: 'Sporting CP',
    awayTeam: 'SC Braga',
    league: 'Primeira Liga',
    kickoff: 'Sun 20:30',
    odds1: 1.52,
    oddsX: 4.30,
    odds2: 5.80,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 89,
    varianceLevel: 'BANKER LOCK',
    tacticalNote: 'Sporting CP unbeaten at home in Lisbon.',
  },
  {
    gameNo: 16,
    homeTeam: 'Feyenoord',
    awayTeam: 'AZ Alkmaar',
    league: 'Eredivisie',
    kickoff: 'Sat 20:00',
    odds1: 1.72,
    oddsX: 3.80,
    odds2: 4.50,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 83,
    varianceLevel: 'BANKER LOCK',
    tacticalNote: 'De Kuip home fortress advantage (+1.35 xG margin).',
  },
  {
    gameNo: 17,
    homeTeam: 'Leeds United',
    awayTeam: 'Sheffield United',
    league: 'Championship',
    kickoff: 'Fri 20:00',
    odds1: 1.90,
    oddsX: 3.45,
    odds2: 4.10,
    aiBanker: '1',
    aiHedgeSecond: 'X',
    aiConfidence: 79,
    varianceLevel: 'MODERATE',
    tacticalNote: 'Elland Road crowd intensity gives Leeds strong 1st-half xG.',
  },
];

const MAX_HEDGED_GAMES = 6; // 2^6 = 64 max lines for clean browser rendering

export const JackpotGeneratorPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [selectedProviderId, setSelectedProviderId] = useState<JackpotProviderConfig['id']>('sportpesa-mega');

  const activeProvider = useMemo(
    () => JACKPOT_PROVIDERS.find((p) => p.id === selectedProviderId) || JACKPOT_PROVIDERS[0],
    [selectedProviderId]
  );

  const activeFixtures = useMemo(
    () => MASTER_JACKPOT_FIXTURES.slice(0, activeProvider.totalGames),
    [activeProvider.totalGames]
  );

  // Map of gameNo -> array of selected outcomes (['1'] or ['1', 'X'])
  const [picksMap, setPicksMap] = useState<Record<number, PickOption[]>>(() => {
    const initial: Record<number, PickOption[]> = {};
    MASTER_JACKPOT_FIXTURES.forEach((f) => {
      // Auto-hedge top 3 coin-flip games by default (2^3 = 8 combinations)
      if ([2, 3, 5].includes(f.gameNo)) {
        initial[f.gameNo] = [f.aiBanker, f.aiHedgeSecond];
      } else {
        initial[f.gameNo] = [f.aiBanker];
      }
    });
    return initial;
  });

  const hedgedCount = useMemo(() => {
    return activeFixtures.filter((f) => (picksMap[f.gameNo]?.length || 1) > 1).length;
  }, [activeFixtures, picksMap]);

  const handleTogglePick = (gameNo: number, option: PickOption) => {
    setPicksMap((prev) => {
      const current = prev[gameNo] || ['1'];
      if (current.includes(option)) {
        if (current.length === 1) {
          toast.info('Each jackpot fixture must have at least 1 outcome selected.');
          return prev;
        }
        return { ...prev, [gameNo]: current.filter((o) => o !== option) };
      } else {
        if (current.length >= 2) {
          // Replace the second choice so it stays a Double Chance (2 outcomes max per fixture)
          return { ...prev, [gameNo]: [current[0], option] };
        }
        if (hedgedCount >= MAX_HEDGED_GAMES) {
          toast.warning(`Maximum ${MAX_HEDGED_GAMES} Double Chance hedges (${Math.pow(2, MAX_HEDGED_GAMES)} lines) reached.`);
          return prev;
        }
        return { ...prev, [gameNo]: [...current, option] };
      }
    });
  };

  const applyStrategyPreset = (hedgeCountTarget: number) => {
    const sortedByRisk = [...activeFixtures].sort((a, b) => a.aiConfidence - b.aiConfidence);
    const gamesToHedge = new Set(sortedByRisk.slice(0, hedgeCountTarget).map((f) => f.gameNo));
    const nextMap: Record<number, PickOption[]> = {};
    MASTER_JACKPOT_FIXTURES.forEach((f) => {
      if (gamesToHedge.has(f.gameNo)) {
        nextMap[f.gameNo] = [f.aiBanker, f.aiHedgeSecond];
      } else {
        nextMap[f.gameNo] = [f.aiBanker];
      }
    });
    setPicksMap(nextMap);
    toast.success(
      hedgeCountTarget === 0
        ? 'Applied Pure 1-Line AI Banker Slip!'
        : `Applied AI Double-Chance Hedge on ${hedgeCountTarget} riskiest fixtures (${Math.pow(2, hedgeCountTarget)} combinations)!`
    );
  };

  // Cartesian product generator for all single-line jackpot slips
  const generatedLines = useMemo(() => {
    let combinations: PickOption[][] = [[]];
    for (const fixture of activeFixtures) {
      const options = picksMap[fixture.gameNo] || [fixture.aiBanker];
      const next: PickOption[][] = [];
      for (const combo of combinations) {
        for (const opt of options) {
          next.push([...combo, opt]);
        }
      }
      combinations = next;
    }
    return combinations.map((line, index) => {
      const codeSuffix = ((index + 1) * 7919 + activeProvider.totalGames * 131)
        .toString(36)
        .toUpperCase()
        .slice(0, 5);
      return {
        lineNo: index + 1,
        code: `${activeProvider.bookingPrefix}-${codeSuffix}`,
        picks: line,
        compactString: line.join('-'),
      };
    });
  }, [activeFixtures, picksMap, activeProvider]);

  const totalCost = generatedLines.length * activeProvider.lineCost;

  const handleLoadTopBankersToSlip = () => {
    const bankers = activeFixtures.filter((f) => f.varianceLevel === 'BANKER LOCK').slice(0, 6);
    bankers.forEach((f) => {
      const odds = f.aiBanker === '1' ? f.odds1 : f.aiBanker === 'X' ? f.oddsX : f.odds2;
      const marketLabel = f.aiBanker === '1' ? 'Home Win (1)' : f.aiBanker === 'X' ? 'Draw (X)' : 'Away Win (2)';
      addSelection({
        matchId: `jp-banker-${f.gameNo}`,
        match: `${f.homeTeam} vs ${f.awayTeam}`,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        league: f.league,
        matchDate: new Date().toISOString(),
        market: marketLabel,
        odds,
        confidence: f.aiConfidence,
      });
    });
    toast.success(`Loaded ${bankers.length} Jackpot AI Bankers (81%+ Confidence) into your Bet Slip!`);
  };

  const handleCopyAllCombinations = () => {
    const text =
      `🏆 PredictPro ${activeProvider.name} (${generatedLines.length} Combinations)\n` +
      `💰 Pool: ${activeProvider.jackpotPool} | Total Stake: ${activeProvider.currency} ${totalCost.toLocaleString()}\n\n` +
      generatedLines
        .map((l) => `Line #${l.lineNo} [${l.code}]: ${l.picks.map((p, idx) => `${idx + 1}:${p}`).join(' ')}`)
        .join('\n') +
      `\n\n📲 VIP Jackpot Syndicate WhatsApp: https://wa.me/254721418238`;
    navigator.clipboard.writeText(text);
    toast.success(`Copied all ${generatedLines.length} playable jackpot combinations!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="17-Game Mega & Midweek Jackpot Combination Generator | SportPesa, Betika & Mozzart AI Hedging"
        description="Interactive 17-Game Mega Jackpot and 13-Game Midweek Jackpot combination generator. Lock AI Poisson Bankers and hedge 3–5 Double Chances into playable single-line slips."
        canonicalUrl="https://predictpro.guru/jackpot-generator"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mega Jackpot Hub', href: '/jackpot-predictions' },
            { label: 'Jackpot Combination Generator' },
          ]}
        />

        <LeagueNavigationStrip />
        <MarketQuickStrip />

        {/* Hero Header */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Trophy className="h-3.5 w-3.5 text-amber-500" />
                <span>Combinatorial Poisson Jackpot Hedging Engine</span>
                <span aria-hidden="true">·</span>
                <span>2^N Multi-Line Generator</span>
                <span aria-hidden="true">·</span>
                <span>Bonus Tier Optimizer</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                17-Game Mega &amp; Midweek Jackpot Combination Generator
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stop losing 16/17 jackpot slips to a single coin-flip fixture. Lock our <strong>82%+ AI Bankers</strong> on high-consensus matches and toggle <strong>Double Chance hedges (1X, X2, 12)</strong> on 3 to 5 high-variance games to automatically generate every individual playable line.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleLoadTopBankersToSlip} className="gap-1.5 text-xs font-bold">
                <Plus className="h-3.5 w-3.5" />
                Load 6 Jackpot Bankers to Acca Slip
              </Button>
              <Button variant="outline" onClick={handleCopyAllCombinations} className="gap-1.5 text-xs font-bold">
                <Copy className="h-3.5 w-3.5" />
                Copy All {generatedLines.length} Lines
              </Button>
            </div>
          </div>

          {/* Provider Selector Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
            {JACKPOT_PROVIDERS.map((provider) => {
              const isSelected = provider.id === selectedProviderId;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setSelectedProviderId(provider.id)}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      {provider.countryFlag} {provider.totalGames} Games
                    </span>
                    <span className="font-mono font-bold text-primary">
                      {provider.currency} {provider.lineCost}/line
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">{provider.name}</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {provider.jackpotPool}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Control Bar: Preset Hedging Strategies + Live Cost Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                1-Click AI Hedging Presets
              </CardTitle>
              <CardDescription className="text-xs">
                Automatically assign Double Chances (1X / X2 / 12) to the lowest-confidence coin-flip matches while locking Single Bankers on the rest.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={hedgedCount === 0 ? 'default' : 'outline'}
                onClick={() => applyStrategyPreset(0)}
                className="text-xs font-semibold"
              >
                Pure Banker (1 Line · {activeProvider.currency} {activeProvider.lineCost})
              </Button>
              <Button
                size="sm"
                variant={hedgedCount === 2 ? 'default' : 'outline'}
                onClick={() => applyStrategyPreset(2)}
                className="text-xs font-semibold"
              >
                2 Double Chances (4 Lines · {activeProvider.currency} {(4 * activeProvider.lineCost).toLocaleString()})
              </Button>
              <Button
                size="sm"
                variant={hedgedCount === 3 ? 'default' : 'outline'}
                onClick={() => applyStrategyPreset(3)}
                className="text-xs font-semibold"
              >
                3 Double Chances (8 Lines · {activeProvider.currency} {(8 * activeProvider.lineCost).toLocaleString()})
              </Button>
              <Button
                size="sm"
                variant={hedgedCount === 4 ? 'default' : 'outline'}
                onClick={() => applyStrategyPreset(4)}
                className="text-xs font-semibold"
              >
                4 Double Chances (16 Lines · {activeProvider.currency} {(16 * activeProvider.lineCost).toLocaleString()})
              </Button>
              <Button
                size="sm"
                variant={hedgedCount === 5 ? 'default' : 'outline'}
                onClick={() => applyStrategyPreset(5)}
                className="text-xs font-semibold"
              >
                5 Double Chances (32 Lines · {activeProvider.currency} {(32 * activeProvider.lineCost).toLocaleString()})
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/25">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Combination Telemetry</span>
                <span className="font-mono text-xs text-primary">
                  2^{hedgedCount} = {generatedLines.length} Slips
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Single Bankers Locked:</span>
                <span className="font-bold text-foreground">{activeFixtures.length - hedgedCount} Games</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Double Chance Hedges:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {hedgedCount} / {MAX_HEDGED_GAMES} Max
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                <span className="font-semibold text-foreground">Total Combination Stake:</span>
                <span className="text-base font-black text-primary">
                  {activeProvider.currency} {totalCost.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Eligible for: {activeProvider.bonusTiers.join(' · ')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Jackpot Fixture Matrix */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Interactive {activeProvider.totalGames}-Game Selection Matrix
                </CardTitle>
                <CardDescription className="text-xs">
                  Click 1, X, or 2 to toggle outcomes. Selecting 2 outcomes on a fixture turns it into a Double Chance hedge across your generated slips.
                </CardDescription>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Click any 2 buttons per row for Double Chance (1X / X2 / 12)
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-muted-foreground uppercase">
                  <th className="py-2.5 px-3 font-semibold">#</th>
                  <th className="py-2.5 px-3 font-semibold">Fixture &amp; Tactical Note</th>
                  <th className="py-2.5 px-3 font-semibold">AI Risk Classification</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Select Outcomes (1 / X / 2)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Active Pick</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeFixtures.map((fixture) => {
                  const selected = picksMap[fixture.gameNo] || [fixture.aiBanker];
                  const isHedged = selected.length > 1;
                  const activePickCode = selected.slice().sort().join('');

                  return (
                    <tr
                      key={fixture.gameNo}
                      className={`hover:bg-muted/30 transition-colors ${isHedged ? 'bg-amber-500/5' : ''}`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-muted-foreground">
                        {fixture.gameNo}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                          <TeamLogo team={fixture.homeTeam} size="xs" />
                          <span>{fixture.homeTeam}</span>
                          <span className="text-muted-foreground font-normal text-xs">vs</span>
                          <TeamLogo team={fixture.awayTeam} size="xs" />
                          <span>{fixture.awayTeam}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span>{fixture.league}</span>
                          <span aria-hidden="true">·</span>
                          <span>{fixture.kickoff}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-foreground/80">{fixture.tacticalNote}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span
                            className={`font-bold text-[11px] ${
                              fixture.varianceLevel === 'BANKER LOCK'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : fixture.varianceLevel === 'HIGH VARIANCE COIN-FLIP'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-sky-600 dark:text-sky-400'
                            }`}
                          >
                            {fixture.varianceLevel}
                          </span>
                          <p className="text-[11px] text-muted-foreground">
                            AI Confidence: <strong>{fixture.aiConfidence}%</strong> (Banker: {fixture.aiBanker})
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {(
                            [
                              { opt: '1' as PickOption, odds: fixture.odds1 },
                              { opt: 'X' as PickOption, odds: fixture.oddsX },
                              { opt: '2' as PickOption, odds: fixture.odds2 },
                            ] as const
                          ).map(({ opt, odds }) => {
                            const active = selected.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleTogglePick(fixture.gameNo, opt)}
                                className={`min-w-[68px] py-1.5 px-2.5 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                                  active
                                    ? isHedged
                                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                                      : 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-background hover:bg-muted text-foreground border-border'
                                }`}
                              >
                                <span className="block">{opt}</span>
                                <span className="block text-[10px] font-mono opacity-85">{odds.toFixed(2)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-mono font-black text-xs ${
                            isHedged ? 'text-amber-600 dark:text-amber-400' : 'text-primary'
                          }`}
                        >
                          {isHedged ? `HEDGE (${activePickCode})` : `BANKER (${activePickCode})`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Generated Playable Combination Slips Grid */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Generated Single-Line Jackpot Combinations ({generatedLines.length} Playable Slips)
              </h2>
              <p className="text-xs text-muted-foreground">
                Each card below is an independent single-line entry covering a unique permutation of your Double Chance hedges.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/254721418238?text=${encodeURIComponent(
                  `Hello PredictPro VIP, I generated ${generatedLines.length} lines for the ${activeProvider.name} and want the official VIP Syndicate Split.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                VIP Jackpot Syndicate (+254721418238)
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {generatedLines.map((line) => (
              <Card key={line.lineNo} className="border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Combination #{line.lineNo}
                    </span>
                    <span className="font-mono text-xs font-bold text-primary">{line.code}</span>
                  </div>

                  <div className="grid grid-cols-6 gap-1 p-2 rounded-lg bg-muted/40 border border-border/60 font-mono text-[11px]">
                    {line.picks.map((pick, idx) => {
                      const isHedgedGame = (picksMap[idx + 1]?.length || 1) > 1;
                      return (
                        <div
                          key={idx}
                          className={`text-center py-0.5 rounded ${
                            isHedgedGame
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold'
                              : 'text-foreground'
                          }`}
                        >
                          <span className="text-[9px] text-muted-foreground block">G{idx + 1}</span>
                          <span>{pick}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Stake: <strong>{activeProvider.currency} {activeProvider.lineCost}</strong>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${activeProvider.name} Line #${line.lineNo} [${line.code}]: ${line.picks
                            .map((p, i) => `${i + 1}:${p}`)
                            .join(', ')}`
                        );
                        toast.success(`Copied Line #${line.lineNo} (${line.code})!`);
                      }}
                      className="h-7 px-2 text-xs gap-1 font-semibold"
                    >
                      <Copy className="h-3 w-3" />
                      Copy Line
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <SEOAuthorityHub />
      </main>

      <Footer />
    </div>
  );
};

export default JackpotGeneratorPage;
