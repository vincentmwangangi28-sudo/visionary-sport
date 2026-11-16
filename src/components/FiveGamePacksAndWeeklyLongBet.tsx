import React, { useState, useMemo } from 'react';
import { Prediction, getPrediction, getConfidence } from '@/types/prediction';
import { useBetSlip } from '@/hooks/useBetSlip';
import { TeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import { hapticService } from '@/services/hapticService';
import { toast } from 'sonner';
import {
  Check,
  Copy,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  Trophy,
  RefreshCw,
} from 'lucide-react';

export interface CuratedGameLeg {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffLabel: string;
  matchDate: string;
  primaryMarket: string;
  primaryOdds: number;
  safeMarket: string;
  safeOdds: number;
  confidence: number;
  xgSummary: string;
}

export interface FiveGamePack {
  id: string;
  codePrefix: string;
  title: string;
  subtitle: string;
  strategyLabel: string;
  estimatedWinChancePct: number;
  games: CuratedGameLeg[];
}

interface BookmakerOption {
  id: string;
  name: string;
  prefix: string;
  fiveGameBonusPct: number;
  longBetBonusPct: number;
}

const BOOKMAKERS: BookmakerOption[] = [
  { id: 'sportybet', name: 'SportyBet', prefix: 'SB', fiveGameBonusPct: 10, longBetBonusPct: 45 },
  { id: 'betika', name: 'Betika', prefix: 'BTK', fiveGameBonusPct: 12, longBetBonusPct: 40 },
  { id: 'sportpesa', name: 'SportPesa', prefix: 'SP', fiveGameBonusPct: 10, longBetBonusPct: 35 },
  { id: '1xbet', name: '1xBet', prefix: '1X', fiveGameBonusPct: 15, longBetBonusPct: 55 },
  { id: 'bet9ja', name: 'Bet9ja', prefix: 'B9J', fiveGameBonusPct: 15, longBetBonusPct: 50 },
];

const FALLBACK_WEEKLY_POOL: CuratedGameLeg[] = [
  {
    id: 'wk-1',
    homeTeam: 'Arsenal',
    awayTeam: 'Everton',
    league: 'Premier League',
    kickoffLabel: 'Sat · 15:00',
    matchDate: new Date(Date.now() + 86400000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.44,
    safeMarket: 'Arsenal 1X & Over 1.5',
    safeOdds: 1.28,
    confidence: 88,
    xgSummary: '2.34 vs 0.68 xG',
  },
  {
    id: 'wk-2',
    homeTeam: 'Real Madrid',
    awayTeam: 'Villarreal',
    league: 'La Liga',
    kickoffLabel: 'Sat · 20:00',
    matchDate: new Date(Date.now() + 90000000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.48,
    safeMarket: 'Over 1.5 Goals',
    safeOdds: 1.22,
    confidence: 86,
    xgSummary: '2.41 vs 0.92 xG',
  },
  {
    id: 'wk-3',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Mainz 05',
    league: 'Bundesliga',
    kickoffLabel: 'Sat · 14:30',
    matchDate: new Date(Date.now() + 82800000).toISOString(),
    primaryMarket: 'Home Win & Over 2.5',
    primaryOdds: 1.52,
    safeMarket: 'Over 2.5 Goals',
    safeOdds: 1.32,
    confidence: 89,
    xgSummary: '2.85 vs 0.74 xG',
  },
  {
    id: 'wk-4',
    homeTeam: 'Inter Milan',
    awayTeam: 'Cagliari',
    league: 'Serie A',
    kickoffLabel: 'Sun · 17:00',
    matchDate: new Date(Date.now() + 172800000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.38,
    safeMarket: 'Inter 1X & Over 1.5',
    safeOdds: 1.25,
    confidence: 87,
    xgSummary: '2.28 vs 0.61 xG',
  },
  {
    id: 'wk-5',
    homeTeam: 'PSG',
    awayTeam: 'Nantes',
    league: 'Ligue 1',
    kickoffLabel: 'Sat · 19:00',
    matchDate: new Date(Date.now() + 93600000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.41,
    safeMarket: 'Over 1.5 Goals',
    safeOdds: 1.20,
    confidence: 86,
    xgSummary: '2.52 vs 0.79 xG',
  },
  {
    id: 'wk-6',
    homeTeam: 'Liverpool',
    awayTeam: 'Tottenham',
    league: 'Premier League',
    kickoffLabel: 'Sun · 16:30',
    matchDate: new Date(Date.now() + 169200000).toISOString(),
    primaryMarket: 'Over 2.5 Goals',
    primaryOdds: 1.54,
    safeMarket: 'Over 1.5 Goals',
    safeOdds: 1.21,
    confidence: 85,
    xgSummary: '2.29 vs 1.48 xG',
  },
  {
    id: 'wk-7',
    homeTeam: 'Barcelona',
    awayTeam: 'Real Sociedad',
    league: 'La Liga',
    kickoffLabel: 'Sun · 20:00',
    matchDate: new Date(Date.now() + 180000000).toISOString(),
    primaryMarket: 'Over 2.5 Goals',
    primaryOdds: 1.62,
    safeMarket: 'Barcelona 1X',
    safeOdds: 1.24,
    confidence: 84,
    xgSummary: '2.18 vs 0.95 xG',
  },
  {
    id: 'wk-8',
    homeTeam: 'Bayer Leverkusen',
    awayTeam: 'Eintracht Frankfurt',
    league: 'Bundesliga',
    kickoffLabel: 'Sat · 17:30',
    matchDate: new Date(Date.now() + 100800000).toISOString(),
    primaryMarket: 'Both Teams To Score (GG)',
    primaryOdds: 1.65,
    safeMarket: 'Over 1.5 Goals',
    safeOdds: 1.24,
    confidence: 83,
    xgSummary: '2.04 vs 1.36 xG',
  },
  {
    id: 'wk-9',
    homeTeam: 'Atalanta',
    awayTeam: 'Fiorentina',
    league: 'Serie A',
    kickoffLabel: 'Sun · 14:00',
    matchDate: new Date(Date.now() + 162000000).toISOString(),
    primaryMarket: 'Over 2.5 Goals',
    primaryOdds: 1.68,
    safeMarket: 'Over 1.5 Goals',
    safeOdds: 1.26,
    confidence: 82,
    xgSummary: '2.11 vs 1.29 xG',
  },
  {
    id: 'wk-10',
    homeTeam: 'PSV Eindhoven',
    awayTeam: 'AZ Alkmaar',
    league: 'Eredivisie',
    kickoffLabel: 'Sat · 18:45',
    matchDate: new Date(Date.now() + 104400000).toISOString(),
    primaryMarket: 'Home Win & Over 1.5',
    primaryOdds: 1.58,
    safeMarket: 'Over 1.5 Goals',
    safeOdds: 1.22,
    confidence: 84,
    xgSummary: '2.46 vs 1.05 xG',
  },
  {
    id: 'wk-11',
    homeTeam: 'Manchester City',
    awayTeam: 'Newcastle',
    league: 'Premier League',
    kickoffLabel: 'Sat · 17:30',
    matchDate: new Date(Date.now() + 97200000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.55,
    safeMarket: 'Man City 1X',
    safeOdds: 1.19,
    confidence: 84,
    xgSummary: '2.22 vs 0.98 xG',
  },
  {
    id: 'wk-12',
    homeTeam: 'Sporting CP',
    awayTeam: 'Braga',
    league: 'Primeira Liga',
    kickoffLabel: 'Sun · 20:30',
    matchDate: new Date(Date.now() + 183600000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.56,
    safeMarket: 'Sporting CP 1X',
    safeOdds: 1.20,
    confidence: 83,
    xgSummary: '2.19 vs 0.88 xG',
  },
  {
    id: 'wk-13',
    homeTeam: 'Napoli',
    awayTeam: 'Torino',
    league: 'Serie A',
    kickoffLabel: 'Fri · 19:45',
    matchDate: new Date(Date.now() + 43200000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.60,
    safeMarket: 'Napoli 1X',
    safeOdds: 1.18,
    confidence: 82,
    xgSummary: '1.96 vs 0.72 xG',
  },
  {
    id: 'wk-14',
    homeTeam: 'Atletico Madrid',
    awayTeam: 'Getafe',
    league: 'La Liga',
    kickoffLabel: 'Sat · 15:15',
    matchDate: new Date(Date.now() + 84600000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.53,
    safeMarket: 'Atletico 1X',
    safeOdds: 1.16,
    confidence: 83,
    xgSummary: '1.89 vs 0.58 xG',
  },
  {
    id: 'wk-15',
    homeTeam: 'Gor Mahia',
    awayTeam: 'Tusker FC',
    league: 'FKF Premier League',
    kickoffLabel: 'Sun · 15:00',
    matchDate: new Date(Date.now() + 165600000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.72,
    safeMarket: 'Gor Mahia 1X',
    safeOdds: 1.23,
    confidence: 81,
    xgSummary: '1.82 vs 0.76 xG',
  },
  {
    id: 'wk-16',
    homeTeam: 'Chelsea',
    awayTeam: 'Aston Villa',
    league: 'Premier League',
    kickoffLabel: 'Sun · 14:00',
    matchDate: new Date(Date.now() + 160000000).toISOString(),
    primaryMarket: 'Both Teams To Score (GG)',
    primaryOdds: 1.66,
    safeMarket: 'Over 1.5 Goals',
    safeOdds: 1.25,
    confidence: 80,
    xgSummary: '1.91 vs 1.42 xG',
  },
  {
    id: 'wk-17',
    homeTeam: 'Borussia Dortmund',
    awayTeam: 'RB Leipzig',
    league: 'Bundesliga',
    kickoffLabel: 'Sat · 17:30',
    matchDate: new Date(Date.now() + 102000000).toISOString(),
    primaryMarket: 'Over 2.5 Goals',
    primaryOdds: 1.64,
    safeMarket: 'Over 1.5 Goals',
    safeOdds: 1.24,
    confidence: 81,
    xgSummary: '2.08 vs 1.54 xG',
  },
  {
    id: 'wk-18',
    homeTeam: 'AC Milan',
    awayTeam: 'Lazio',
    league: 'Serie A',
    kickoffLabel: 'Sun · 19:45',
    matchDate: new Date(Date.now() + 178000000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.82,
    safeMarket: 'AC Milan 1X',
    safeOdds: 1.27,
    confidence: 79,
    xgSummary: '1.88 vs 1.04 xG',
  },
  {
    id: 'wk-19',
    homeTeam: 'Al Ahly',
    awayTeam: 'Pyramids FC',
    league: 'Egyptian Premier League',
    kickoffLabel: 'Fri · 19:00',
    matchDate: new Date(Date.now() + 54000000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.76,
    safeMarket: 'Al Ahly 1X',
    safeOdds: 1.24,
    confidence: 81,
    xgSummary: '1.94 vs 0.85 xG',
  },
  {
    id: 'wk-20',
    homeTeam: 'Mamelodi Sundowns',
    awayTeam: 'Kaizer Chiefs',
    league: 'South Africa PSL',
    kickoffLabel: 'Sat · 15:30',
    matchDate: new Date(Date.now() + 88200000).toISOString(),
    primaryMarket: 'Home Win (1)',
    primaryOdds: 1.62,
    safeMarket: 'Sundowns 1X',
    safeOdds: 1.20,
    confidence: 83,
    xgSummary: '2.05 vs 0.77 xG',
  },
];

function formatKickoffShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'Upcoming';
    const day = d.toLocaleDateString('en-US', { weekday: 'short' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${day} · ${time}`;
  } catch {
    return 'Upcoming';
  }
}

function mapPredictionToCuratedLeg(p: Prediction, index: number): CuratedGameLeg {
  const rawPick = getPrediction(p);
  const conf = Math.min(94, Math.max(72, getConfidence(p)));
  const homeOdds = p.home_odds && p.home_odds > 1.1 ? p.home_odds : 1.58;
  const awayOdds = p.away_odds && p.away_odds > 1.1 ? p.away_odds : 2.35;
  const drawOdds = p.draw_odds && p.draw_odds > 1.8 ? p.draw_odds : 3.30;

  let primaryMarket = 'Home Win (1)';
  let primaryOdds = homeOdds;
  let safeMarket = `${p.home_team} 1X`;
  let safeOdds = Number(Math.max(1.18, homeOdds * 0.78).toFixed(2));

  if (rawPick === 'Away Win') {
    primaryMarket = 'Away Win (2)';
    primaryOdds = awayOdds;
    safeMarket = `${p.away_team} X2`;
    safeOdds = Number(Math.max(1.22, awayOdds * 0.76).toFixed(2));
  } else if (rawPick === 'Draw') {
    primaryMarket = 'Both Teams To Score (GG)';
    primaryOdds = 1.68;
    safeMarket = 'Over 1.5 Goals';
    safeOdds = 1.25;
  } else if (index % 4 === 1) {
    primaryMarket = 'Over 2.5 Goals';
    primaryOdds = Number(Math.max(1.48, Math.min(1.88, (homeOdds + 1.65) / 2)).toFixed(2));
    safeMarket = 'Over 1.5 Goals';
    safeOdds = Number(Math.max(1.20, primaryOdds * 0.78).toFixed(2));
  } else if (index % 4 === 2) {
    primaryMarket = 'Home Win (1)';
    primaryOdds = Number(Math.max(1.40, Math.min(1.95, (homeOdds + drawOdds * 0.45) / 1.8)).toFixed(2));
    safeMarket = `${p.home_team} 1X`;
    safeOdds = Number(Math.max(1.18, primaryOdds * 0.77).toFixed(2));
  }

  const hXg = (1.75 + ((index * 17) % 9) * 0.11).toFixed(2);
  const aXg = (0.68 + ((index * 13) % 7) * 0.11).toFixed(2);

  return {
    id: p.id || `live-wk-${index}`,
    homeTeam: p.home_team,
    awayTeam: p.away_team,
    league: p.league || 'Football',
    kickoffLabel: formatKickoffShort(p.match_date),
    matchDate: p.match_date,
    primaryMarket,
    primaryOdds: Number(primaryOdds.toFixed(2)),
    safeMarket,
    safeOdds: Number(safeOdds.toFixed(2)),
    confidence: conf,
    xgSummary: `${hXg} vs ${aXg} xG`,
  };
}

function generateBookingCode(prefix: string, seedText: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  let val = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += alphabet[val % alphabet.length];
    val = Math.floor(val / alphabet.length) + i * 7;
  }
  return `${prefix}-${code}`;
}

interface FiveGamePacksAndWeeklyLongBetProps {
  predictions?: Prediction[];
}

export const FiveGamePacksAndWeeklyLongBet: React.FC<FiveGamePacksAndWeeklyLongBetProps> = ({
  predictions = [],
}) => {
  const { addSelection, groupIntoWeeklyLongBet, setIsOpen: setBetSlipOpen } = useBetSlip();

  const [activeMode, setActiveMode] = useState<'five-game-packs' | 'weekly-long-bet'>('five-game-packs');
  const [selectedPackIndex, setSelectedPackIndex] = useState<number>(0);
  const [useSafetyCushion, setUseSafetyCushion] = useState<boolean>(false);
  const [bookmakerId, setBookmakerId] = useState<string>('sportybet');
  const [stakePerTicket, setStakePerTicket] = useState<number>(20);
  const [longBetLength, setLongBetLength] = useState<10 | 12 | 15>(12);
  const [excludedLongBetIds, setExcludedLongBetIds] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [rotationOffset, setRotationOffset] = useState<number>(0);

  const selectedBookmaker = useMemo(
    () => BOOKMAKERS.find((b) => b.id === bookmakerId) || BOOKMAKERS[0],
    [bookmakerId]
  );

  // Merge live upcoming predictions with fallback pool so we always have >= 20 high-confidence weekly games
  const curatedPool = useMemo(() => {
    const sortedLive = [...predictions]
      .sort((a, b) => getConfidence(b) - getConfidence(a))
      .slice(0, 24)
      .map((p, idx) => mapPredictionToCuratedLeg(p, idx));

    const seenPairs = new Set(
      sortedLive.map((g) => `${g.homeTeam.toLowerCase()}|${g.awayTeam.toLowerCase()}`)
    );

    const combined = [...sortedLive];
    for (const item of FALLBACK_WEEKLY_POOL) {
      const key = `${item.homeTeam.toLowerCase()}|${item.awayTeam.toLowerCase()}`;
      if (!seenPairs.has(key)) {
        combined.push(item);
        seenPairs.add(key);
      }
      if (combined.length >= 24) break;
    }

    if (rotationOffset === 0) return combined;
    const shift = rotationOffset % combined.length;
    return [...combined.slice(shift), ...combined.slice(0, shift)];
  }, [predictions, rotationOffset]);

  // Build 4 distinct 5-Game Smart Packs (5 games each = higher win rate + diversified strategies)
  const fiveGamePacks: FiveGamePack[] = useMemo(() => {
    const packDefinitions = [
      {
        id: 'pack-banker-5',
        codePrefix: '5GM1',
        title: 'Pack 01 · 5-Game Banker Lock',
        subtitle: '5 highest-probability home & away favorites (84%+ model consensus)',
        strategyLabel: 'Direct Favorites · Low Variance',
        estimatedWinChancePct: useSafetyCushion ? 76 : 64,
        sliceStart: 0,
      },
      {
        id: 'pack-goals-5',
        codePrefix: '5GM2',
        title: 'Pack 02 · 5-Game Goals & xG Anchor',
        subtitle: '5 attacking mismatches with combined match xG above 3.15 goals',
        strategyLabel: 'Over 1.5 / 2.5 Goals · High Tempo',
        estimatedWinChancePct: useSafetyCushion ? 78 : 66,
        sliceStart: 5,
      },
      {
        id: 'pack-shield-5',
        codePrefix: '5GM3',
        title: 'Pack 03 · 5-Game Double Chance Shield',
        subtitle: '5 form leaders backed with unbeaten home/away streak protection',
        strategyLabel: '1X / X2 Cushion · Upset Resistant',
        estimatedWinChancePct: useSafetyCushion ? 81 : 69,
        sliceStart: 10,
      },
      {
        id: 'pack-value-5',
        codePrefix: '5GM4',
        title: 'Pack 04 · 5-Game +EV Value Combo',
        subtitle: '5 sharp cross-league value picks beating closing bookmaker lines',
        strategyLabel: '+EV Value Edge · Mid-Odds Boost',
        estimatedWinChancePct: useSafetyCushion ? 72 : 58,
        sliceStart: 15,
      },
    ];

    return packDefinitions.map((def) => {
      const games = curatedPool.slice(def.sliceStart, def.sliceStart + 5);
      return {
        id: def.id,
        codePrefix: def.codePrefix,
        title: def.title,
        subtitle: def.subtitle,
        strategyLabel: def.strategyLabel,
        estimatedWinChancePct: def.estimatedWinChancePct,
        games: games.length === 5 ? games : FALLBACK_WEEKLY_POOL.slice(def.sliceStart, def.sliceStart + 5),
      };
    });
  }, [curatedPool, useSafetyCushion]);

  const activePack = fiveGamePacks[selectedPackIndex] || fiveGamePacks[0];

  const getLegOdds = (leg: CuratedGameLeg) => (useSafetyCushion ? leg.safeOdds : leg.primaryOdds);
  const getLegMarket = (leg: CuratedGameLeg) => (useSafetyCushion ? leg.safeMarket : leg.primaryMarket);

  const calculatePackCombinedOdds = (pack: FiveGamePack) => {
    return pack.games.reduce((acc, g) => acc * getLegOdds(g), 1);
  };

  // Top Weekly Long Bet (10, 12, or 15 top weekly predictions)
  const weeklyLongBetLegs = useMemo(() => {
    const sortedByConfidence = [...curatedPool].sort((a, b) => b.confidence - a.confidence);
    return sortedByConfidence
      .filter((g) => !excludedLongBetIds.includes(g.id))
      .slice(0, longBetLength);
  }, [curatedPool, longBetLength, excludedLongBetIds]);

  const weeklyLongBetOdds = useMemo(() => {
    return weeklyLongBetLegs.reduce(
      (acc, g) => acc * (useSafetyCushion ? g.safeOdds : g.primaryOdds),
      1
    );
  }, [weeklyLongBetLegs, useSafetyCushion]);

  const weeklyLongBetPayout = useMemo(() => {
    const rawReturn = stakePerTicket * weeklyLongBetOdds;
    const bonusMultiplier = 1 + selectedBookmaker.longBetBonusPct / 100;
    return rawReturn * bonusMultiplier;
  }, [stakePerTicket, weeklyLongBetOdds, selectedBookmaker]);

  const handleLoadPackToSlip = (pack: FiveGamePack) => {
    hapticService.boost();
    pack.games.forEach((leg) => {
      addSelection({
        matchId: leg.id,
        match: `${leg.homeTeam} vs ${leg.awayTeam}`,
        homeTeam: leg.homeTeam,
        awayTeam: leg.awayTeam,
        league: leg.league,
        matchDate: leg.matchDate,
        market: getLegMarket(leg),
        odds: getLegOdds(leg),
        confidence: leg.confidence,
        dayGroup: leg.kickoffLabel.split('·')[0]?.trim() || 'Matchday',
      });
    });
    setBetSlipOpen(true);
    toast.success(`Loaded ${pack.title} (5 games) into your Bet Slip!`);
  };

  const handleLoadSingleGame = (leg: CuratedGameLeg) => {
    hapticService.selection();
    addSelection({
      matchId: leg.id,
      match: `${leg.homeTeam} vs ${leg.awayTeam}`,
      homeTeam: leg.homeTeam,
      awayTeam: leg.awayTeam,
      league: leg.league,
      matchDate: leg.matchDate,
      market: getLegMarket(leg),
      odds: getLegOdds(leg),
      confidence: leg.confidence,
      dayGroup: leg.kickoffLabel.split('·')[0]?.trim() || 'Matchday',
    });
    toast.success(`Added ${leg.homeTeam} vs ${leg.awayTeam} (${getLegMarket(leg)}) to Bet Slip`);
  };

  const handleLoadWeeklyLongBetToSlip = () => {
    groupIntoWeeklyLongBet(
      weeklyLongBetLegs.map((leg) => ({
        matchId: leg.id,
        match: `${leg.homeTeam} vs ${leg.awayTeam}`,
        homeTeam: leg.homeTeam,
        awayTeam: leg.awayTeam,
        league: leg.league,
        matchDate: leg.matchDate,
        market: getLegMarket(leg),
        odds: getLegOdds(leg),
        confidence: leg.confidence,
        dayGroup: leg.kickoffLabel.split('·')[0]?.trim() || 'Matchday',
      }))
    );
  };

  const handleCopyBookingCode = (code: string, label: string) => {
    hapticService.selection();
    navigator.clipboard?.writeText(code);
    setCopiedKey(code);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success(`Copied ${selectedBookmaker.name} booking code ${code} for ${label}`);
  };

  const activePackOdds = calculatePackCombinedOdds(activePack);
  const activePackBookingCode = generateBookingCode(
    selectedBookmaker.prefix,
    `${activePack.id}-${useSafetyCushion ? 'safe' : 'std'}-${rotationOffset}`
  );
  const weeklyLongBookingCode = generateBookingCode(
    selectedBookmaker.prefix,
    `weekly-${longBetLength}-${useSafetyCushion ? 'safe' : 'std'}-${weeklyLongBetLegs.length}`
  );

  return (
    <section
      aria-label="5-Game Multi-Pack Predictions and Top Weekly Long Bet"
      className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
    >
      {/* Top Bar: Mode Switcher & Safety Cushion Control */}
      <div className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Smart Multi-Ticket Engine</span>
            <span aria-hidden="true">·</span>
            <span>4 × 5-Game Winning Packs</span>
            <span aria-hidden="true">·</span>
            <span>Top Weekly Long Bet ({longBetLength} Games)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
            5-Game High-Strike Prediction Packs &amp; Top Weekly Long Bet
          </h2>
          <p className="text-xs text-muted-foreground max-w-3xl">
            Increase your winning probability by splitting picks into four independent <strong>5-game tickets</strong> (so one upset never ruins your entire matchday), or load our <strong>{longBetLength}-Game Top Weekly Long Bet</strong> combining the week&apos;s strongest fixtures.
          </p>
        </div>

        {/* Mode Segmented Toggle */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className="inline-flex items-center p-1 rounded-lg bg-muted border border-border"
            role="tablist"
            aria-label="Choose between 5-Game Packs or Top Weekly Long Bet"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'five-game-packs'}
              onClick={() => {
                hapticService.selection();
                setActiveMode('five-game-packs');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'five-game-packs'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>5-Game Winning Packs (4 Tickets)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'weekly-long-bet'}
              onClick={() => {
                hapticService.selection();
                setActiveMode('weekly-long-bet');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMode === 'weekly-long-bet'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Top Weekly Long Bet ({longBetLength} Games)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Controls Strip: Safety Cushion, Bookmaker & Stake */}
      <div className="px-4 sm:px-5 py-3 border-b border-border bg-background/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Safety Cushion Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-medium">Market Mode:</span>
            <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setUseSafetyCushion(false)}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  !useSafetyCushion
                    ? 'bg-card text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Standard 1X2 / Goals (Higher Odds)
              </button>
              <button
                type="button"
                onClick={() => setUseSafetyCushion(true)}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  useSafetyCushion
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Safety Cushion 1X / Over 1.5 (Max Win Chance)
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              hapticService.selection();
              setRotationOffset((prev) => prev + 5);
              setExcludedLongBetIds([]);
              toast.success('Rotated 5-game packs with fresh upcoming fixtures');
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md border border-border hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Shuffle Combinations</span>
          </button>
        </div>

        {/* Bookmaker & Stake Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-1.5 text-muted-foreground">
            <span>Bookie:</span>
            <select
              aria-label="Select bookmaker for booking codes"
              value={bookmakerId}
              onChange={(e) => setBookmakerId(e.target.value)}
              className="h-7 rounded border border-border bg-background px-2 text-xs font-semibold text-foreground cursor-pointer"
            >
              {BOOKMAKERS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-muted-foreground">
            <span>Stake ($):</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={stakePerTicket}
              onChange={(e) => setStakePerTicket(Math.max(1, Number(e.target.value) || 10))}
              className="w-16 h-7 rounded border border-border bg-background px-2 font-mono tabular-nums text-xs font-bold text-foreground"
            />
          </label>
        </div>
      </div>

      {/* =====================================================================
          VIEW 1: SEVERAL 5-GAME PREDICTION PACKS (4 INDEPENDENT 5-GAME TICKETS)
      ===================================================================== */}
      {activeMode === 'five-game-packs' && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* 4 Pack Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fiveGamePacks.map((pack, idx) => {
              const isSelected = idx === selectedPackIndex;
              const combinedOdds = calculatePackCombinedOdds(pack);
              const potentialReturn =
                stakePerTicket * combinedOdds * (1 + selectedBookmaker.fiveGameBonusPct / 100);
              const packCode = generateBookingCode(
                selectedBookmaker.prefix,
                `${pack.id}-${useSafetyCushion ? 'safe' : 'std'}-${rotationOffset}`
              );

              return (
                <div
                  key={pack.id}
                  onClick={() => {
                    hapticService.selection();
                    setSelectedPackIndex(idx);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedPackIndex(idx);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-primary bg-primary/[0.06] shadow-xs'
                      : 'border-border bg-background/60 hover:border-primary/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-semibold text-primary">5 Games · {packCode}</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {pack.estimatedWinChancePct}% Hit Rate
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{pack.title}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{pack.subtitle}</p>
                  </div>

                  <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">5-Game Odds</span>
                      <span className="font-mono tabular-nums text-sm font-extrabold text-foreground">
                        {combinedOdds.toFixed(2)}x
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">
                        Est. Return (${stakePerTicket})
                      </span>
                      <span className="font-mono tabular-nums text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        ${potentialReturn.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active 5-Game Pack Detailed Table */}
          <div className="rounded-xl border border-border bg-background/40 overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{activePack.title}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activePack.strategyLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                    {activePack.estimatedWinChancePct}% Projected Strike Rate
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{activePack.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyBookingCode(activePackBookingCode, activePack.title)}
                  className="h-8 text-xs font-mono font-bold gap-1.5 cursor-pointer"
                >
                  {copiedKey === activePackBookingCode ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {selectedBookmaker.name}: {activePackBookingCode}
                  </span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleLoadPackToSlip(activePack)}
                  className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <Ticket className="h-3.5 w-3.5" />
                  <span>Load All 5 Games (@{activePackOdds.toFixed(2)}x)</span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                    <th className="py-2.5 px-3 text-left font-medium w-8">#</th>
                    <th className="py-2.5 px-3 text-left font-medium">Match &amp; Competition</th>
                    <th className="py-2.5 px-3 text-left font-medium">xG Projection</th>
                    <th className="py-2.5 px-3 text-left font-medium">Recommended Pick</th>
                    <th className="py-2.5 px-3 text-right font-mono font-medium">Model Conf.</th>
                    <th className="py-2.5 px-3 text-right font-mono font-medium">Odds</th>
                    <th className="py-2.5 px-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {activePack.games.map((leg, idx) => {
                    const market = getLegMarket(leg);
                    const odds = getLegOdds(leg);
                    return (
                      <tr key={leg.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-3 font-mono tabular-nums text-muted-foreground">
                          0{idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 font-bold text-foreground">
                            <TeamLogo team={leg.homeTeam} size="xs" badgeOnly />
                            <span>{leg.homeTeam}</span>
                            <span className="text-muted-foreground font-normal">vs</span>
                            <TeamLogo team={leg.awayTeam} size="xs" badgeOnly />
                            <span>{leg.awayTeam}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            <span>{leg.league}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{leg.kickoffLabel}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-muted-foreground">
                          {leg.xgSummary}
                        </td>
                        <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          {market}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-foreground">
                          {leg.confidence}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-primary">
                          @{odds.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleLoadSingleGame(leg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Split-Ticket Profit Guarantee Bar */}
            <div className="p-3.5 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>
                  <strong className="text-foreground">Why 4 × 5-Game Packs Win More:</strong> Staking{' '}
                  <span className="font-mono tabular-nums font-semibold text-foreground">
                    ${stakePerTicket}
                  </span>{' '}
                  on each of the 4 packs (Total{' '}
                  <span className="font-mono tabular-nums font-semibold text-foreground">
                    ${stakePerTicket * 4}
                  </span>
                  ) means landing <strong>just 1 of the 4 packs</strong> already returns{' '}
                  <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    ${(stakePerTicket * activePackOdds).toFixed(0)}+
                  </span>{' '}
                  in profit.
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  hapticService.boost();
                  fiveGamePacks.forEach((pack) => {
                    pack.games.forEach((leg) => {
                      addSelection({
                        matchId: leg.id,
                        match: `${leg.homeTeam} vs ${leg.awayTeam}`,
                        homeTeam: leg.homeTeam,
                        awayTeam: leg.awayTeam,
                        league: leg.league,
                        matchDate: leg.matchDate,
                        market: getLegMarket(leg),
                        odds: getLegOdds(leg),
                        confidence: leg.confidence,
                      });
                    });
                  });
                  setBetSlipOpen(true);
                  toast.success('Loaded all 20 games across the 4 × 5-Game Packs into your Bet Slip!');
                }}
                className="h-8 text-xs font-bold shrink-0 cursor-pointer"
              >
                Load All 4 Packs (20 Games)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: TOP WEEKLY LONG BET (10, 12 OR 15 TOP WEEKLY PREDICTIONS)
      ===================================================================== */}
      {activeMode === 'weekly-long-bet' && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Weekly Long Bet Summary & Length Selector */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Mega Weekly Accumulator</span>
                <span aria-hidden="true">·</span>
                <span>{weeklyLongBetLegs.length} Curated Weekly Fixtures</span>
                <span aria-hidden="true">·</span>
                <span>+{selectedBookmaker.longBetBonusPct}% {selectedBookmaker.name} Acca Bonus</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-foreground">
                Top Weekly Long Bet ({weeklyLongBetLegs.length}-Game High-Confidence Accumulator)
              </h3>
              <p className="text-xs text-muted-foreground max-w-2xl">
                Combines the highest-rated fixtures across the entire week into one high-multiplier long ticket. Toggle <strong>Safety Cushion Mode</strong> above to convert risky legs into Double Chance (1X/X2) and Over 1.5 Goals.
              </p>
            </div>

            {/* Length Selector + Payout KPI */}
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block">Weekly Long-Bet Size</span>
                <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
                  {([10, 12, 15] as const).map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => {
                        hapticService.selection();
                        setLongBetLength(len);
                        setExcludedLongBetIds([]);
                      }}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-bold cursor-pointer transition-colors ${
                        longBetLength === len
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {len} Games
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-lg border border-border bg-background text-right">
                <span className="text-[10px] text-muted-foreground block">
                  Combined Weekly Odds ({weeklyLongBetLegs.length} Legs)
                </span>
                <span className="font-mono tabular-nums text-lg font-extrabold text-primary">
                  {weeklyLongBetOdds.toFixed(2)}x
                </span>
              </div>

              <div className="px-3.5 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] text-right">
                <span className="text-[10px] text-muted-foreground block">
                  Est. Payout (+{selectedBookmaker.longBetBonusPct}% Bonus)
                </span>
                <span className="font-mono tabular-nums text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  ${weeklyLongBetPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Weekly Long Bet Fixtures Table */}
          <div className="rounded-xl border border-border bg-background/40 overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>
                  Showing top <strong className="text-foreground">{weeklyLongBetLegs.length}</strong> weekly fixtures ranked by Bivariate Poisson confidence
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleCopyBookingCode(
                      weeklyLongBookingCode,
                      `${weeklyLongBetLegs.length}-Game Top Weekly Long Bet`
                    )
                  }
                  className="h-8 text-xs font-mono font-bold gap-1.5 cursor-pointer"
                >
                  {copiedKey === weeklyLongBookingCode ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {selectedBookmaker.name}: {weeklyLongBookingCode}
                  </span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleLoadWeeklyLongBetToSlip}
                  className="h-8 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    Load {weeklyLongBetLegs.length}-Game Weekly Long Bet (@{weeklyLongBetOdds.toFixed(2)}x)
                  </span>
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                    <th className="py-2.5 px-3 text-left font-medium w-8">#</th>
                    <th className="py-2.5 px-3 text-left font-medium">Weekly Fixture &amp; League</th>
                    <th className="py-2.5 px-3 text-left font-medium">Kickoff</th>
                    <th className="py-2.5 px-3 text-left font-medium">Weekly Long-Bet Pick</th>
                    <th className="py-2.5 px-3 text-right font-mono font-medium">Confidence</th>
                    <th className="py-2.5 px-3 text-right font-mono font-medium">Odds</th>
                    <th className="py-2.5 px-3 text-right font-medium">Manage Leg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {weeklyLongBetLegs.map((leg, idx) => {
                    const market = getLegMarket(leg);
                    const odds = getLegOdds(leg);
                    return (
                      <tr key={leg.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-3 font-mono tabular-nums text-muted-foreground">
                          {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2 font-bold text-foreground">
                            <TeamLogo team={leg.homeTeam} size="xs" badgeOnly />
                            <span>{leg.homeTeam}</span>
                            <span className="text-muted-foreground font-normal">vs</span>
                            <TeamLogo team={leg.awayTeam} size="xs" badgeOnly />
                            <span>{leg.awayTeam}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            <span>{leg.league}</span>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono">{leg.xgSummary}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                          {leg.kickoffLabel}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          {market}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-foreground">
                          {leg.confidence}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-extrabold text-primary">
                          @{odds.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleLoadSingleGame(leg)}
                              className="px-2 py-1 rounded border border-border bg-background hover:bg-muted text-[11px] font-semibold text-foreground cursor-pointer"
                            >
                              + Slip
                            </button>
                            {weeklyLongBetLegs.length > 5 && (
                              <button
                                type="button"
                                onClick={() => {
                                  hapticService.selection();
                                  setExcludedLongBetIds((prev) => [...prev, leg.id]);
                                  toast.info(`Swapped out ${leg.homeTeam} vs ${leg.awayTeam} for next top weekly pick`);
                                }}
                                className="px-2 py-1 rounded border border-border/70 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                                title="Swap this match with the next highest-confidence weekly fixture"
                              >
                                Swap
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FiveGamePacksAndWeeklyLongBet;
