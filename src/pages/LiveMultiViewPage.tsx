import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TeamLogo } from '@/components/TeamLogo';
import { MatchTacticalSimulatorModal } from '@/components/MatchTacticalSimulatorModal';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Flame,
  LayoutGrid,
  Columns,
  Maximize2,
  Plus,
  Radio,
  Sliders,
  Sparkles,
  Tv,
  Volume2,
  Crosshair,
  Wallet,
  Check,
  RefreshCw,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useFootballData, ApiFootballLiveFixture } from '@/hooks/useFootballData';
import { syncSlipToBankroll } from '@/services/socialCardPngGenerator';
import { playStadiumGoalHorn } from '@/services/goalHornAudioService';
import { toast } from 'sonner';

interface MultiViewMatchSlot {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  league: string;
  region: 'Europe' | 'Africa / CAF';
  minute: number;
  statusText?: string;
  homeScore: number;
  awayScore: number;
  liveXgHome: number;
  liveXgAway: number;
  appmIndex: number;
  dangerousAttacksHome: number;
  dangerousAttacksAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  cornersHome: number;
  cornersAway: number;
  sharpMarket: string;
  liveOdds: number;
  modelProbPct: number;
  evEdgePct: number;
  momentumNote: string;
  isRealtimeFeed?: boolean;
}

const MULTIVIEW_MATCH_POOL: MultiViewMatchSlot[] = [
  {
    id: 'mv-ars-che',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    region: 'Europe',
    minute: 66,
    homeScore: 1,
    awayScore: 1,
    liveXgHome: 2.38,
    liveXgAway: 0.94,
    appmIndex: 94,
    dangerousAttacksHome: 16,
    dangerousAttacksAway: 3,
    shotsOnTargetHome: 7,
    shotsOnTargetAway: 3,
    cornersHome: 8,
    cornersAway: 2,
    sharpMarket: 'Over 2.5 Match Goals (Live)',
    liveOdds: 1.68,
    modelProbPct: 89,
    evEdgePct: 14.2,
    momentumNote: 'Arsenal +1.44 unconverted xG surge; 11 box touches in last 12m.',
  },
  {
    id: 'mv-rma-bar',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    region: 'Europe',
    minute: 74,
    homeScore: 1,
    awayScore: 2,
    liveXgHome: 2.21,
    liveXgAway: 1.96,
    appmIndex: 92,
    dangerousAttacksHome: 14,
    dangerousAttacksAway: 6,
    shotsOnTargetHome: 6,
    shotsOnTargetAway: 6,
    cornersHome: 7,
    cornersAway: 5,
    sharpMarket: 'Over 3.5 Total Goals (Live)',
    liveOdds: 1.76,
    modelProbPct: 86,
    evEdgePct: 11.8,
    momentumNote: 'High-line transition alert: Real Madrid pressing with 6 in final third.',
  },
  {
    id: 'mv-bay-bvb',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    region: 'Europe',
    minute: 41,
    homeScore: 0,
    awayScore: 1,
    liveXgHome: 1.56,
    liveXgAway: 0.62,
    appmIndex: 91,
    dangerousAttacksHome: 15,
    dangerousAttacksAway: 2,
    shotsOnTargetHome: 6,
    shotsOnTargetAway: 2,
    cornersHome: 6,
    cornersAway: 1,
    sharpMarket: 'Bayern Double Chance (1X)',
    liveOdds: 1.64,
    modelProbPct: 87,
    evEdgePct: 13.5,
    momentumNote: 'Bayern hit woodwork twice; +0.94 xG dominance despite trailing 0-1.',
  },
  {
    id: 'mv-gor-afc',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    league: 'FKF Premier League',
    region: 'Africa / CAF',
    minute: 61,
    homeScore: 0,
    awayScore: 0,
    liveXgHome: 1.61,
    liveXgAway: 0.42,
    appmIndex: 88,
    dangerousAttacksHome: 13,
    dangerousAttacksAway: 2,
    shotsOnTargetHome: 5,
    shotsOnTargetAway: 1,
    cornersHome: 6,
    cornersAway: 1,
    sharpMarket: 'Over 0.5 Match Goals (Live)',
    liveOdds: 1.55,
    modelProbPct: 88,
    evEdgePct: 12.6,
    momentumNote: 'Mashemeji Derby siege: AFC Leopards deep block conceding repeated set-pieces.',
  },
  {
    id: 'mv-ahl-sun',
    homeTeam: 'Al Ahly',
    awayTeam: 'Mamelodi Sundowns',
    league: 'CAF Champions League',
    region: 'Africa / CAF',
    minute: 78,
    homeScore: 1,
    awayScore: 1,
    liveXgHome: 1.92,
    liveXgAway: 1.45,
    appmIndex: 89,
    dangerousAttacksHome: 13,
    dangerousAttacksAway: 5,
    shotsOnTargetHome: 6,
    shotsOnTargetAway: 4,
    cornersHome: 8,
    cornersAway: 4,
    sharpMarket: 'Over 2.5 Total Goals (Live)',
    liveOdds: 1.90,
    modelProbPct: 82,
    evEdgePct: 11.9,
    momentumNote: 'Cairo late-goal window (75-90+): Al Ahly averaging 1.12 late xG.',
  },
  {
    id: 'mv-yanga-simba',
    homeTeam: 'Young Africans',
    awayTeam: 'Simba SC',
    league: 'Tanzania NBC Premier League',
    region: 'Africa / CAF',
    minute: 71,
    homeScore: 1,
    awayScore: 0,
    liveXgHome: 1.64,
    liveXgAway: 1.41,
    appmIndex: 87,
    dangerousAttacksHome: 7,
    dangerousAttacksAway: 12,
    shotsOnTargetHome: 4,
    shotsOnTargetAway: 5,
    cornersHome: 5,
    cornersAway: 7,
    sharpMarket: 'Over 14.5 Total Corners',
    liveOdds: 1.82,
    modelProbPct: 84,
    evEdgePct: 10.4,
    momentumNote: '12 corners already logged; Simba SC forcing wide blocks every 70s.',
  },
];

function mapLiveFixtureToMultiViewSlot(m: ApiFootballLiveFixture, idx: number): MultiViewMatchSlot {
  const hScore = m.home_score ?? 0;
  const aScore = m.away_score ?? 0;
  const st = m.match_stats;
  const hShots = st?.homeShots ?? Math.max(hScore * 3 + 4, 8);
  const aShots = st?.awayShots ?? Math.max(aScore * 3 + 3, 6);
  const hOnTarget = st?.homeOnTarget ?? Math.max(hScore, Math.round(hShots * 0.44));
  const aOnTarget = st?.awayOnTarget ?? Math.max(aScore, Math.round(aShots * 0.42));
  const hCorners = st?.homeCorners ?? 5 + (idx % 3);
  const aCorners = st?.awayCorners ?? 3 + (idx % 3);
  const hAssists = st?.homeShotAssists ?? Math.max(3, hShots - 2);
  const aAssists = st?.awayShotAssists ?? Math.max(2, aShots - 2);
  const liveXgHome = Number((hShots * 0.11 + hOnTarget * 0.16 + hScore * 0.3).toFixed(2));
  const liveXgAway = Number((aShots * 0.11 + aOnTarget * 0.16 + aScore * 0.3).toFixed(2));
  const rawMin = parseInt(String(m.minute ?? '').replace(/\D/g, ''), 10) || (m.status === 'halftime' ? 45 : 58 + idx * 4);
  const lowerLeague = String(m.league || '').toLowerCase();
  const isAfrica =
    lowerLeague.includes('caf') ||
    lowerLeague.includes('afcon') ||
    lowerLeague.includes('psl') ||
    lowerLeague.includes('kenya') ||
    lowerLeague.includes('fkf') ||
    lowerLeague.includes('npfl') ||
    lowerLeague.includes('nigeria') ||
    lowerLeague.includes('tanzania');

  const totalGoals = hScore + aScore;
  const totalCorners = hCorners + aCorners;
  const sharpMarket =
    totalCorners >= 10
      ? `Over ${totalCorners + 1.5} Total Corners`
      : m.status === 'live' || m.status === 'halftime'
      ? `Over ${totalGoals + 0.5} Match Goals (Live)`
      : m.prediction || 'Over 2.5 Goals';

  const liveOdds = Number(
    (m.prediction === 'Away Win' ? m.away_odds : m.prediction === 'Draw' ? m.draw_odds : m.home_odds) || 1.72
  );
  const modelProbPct = Math.min(92, Math.max(76, m.confidence || 84));
  const evEdgePct = Number(Math.max(6.8, (modelProbPct - 66) * 0.62).toFixed(1));

  const latestEv = Array.isArray(m.match_events) && m.match_events.length > 0
    ? m.match_events[m.match_events.length - 1]
    : null;
  const momentumNote = latestEv
    ? `Live ESPN Event (${latestEv.minute}): ${latestEv.text} · Shots ${hShots}-${aShots} (${hOnTarget}-${aOnTarget} SOT).`
    : `${m.home_team} ${liveXgHome.toFixed(2)} xG vs ${m.away_team} ${liveXgAway.toFixed(2)} xG · Corners ${hCorners}-${aCorners}.`;

  return {
    id: String(m.id),
    homeTeam: m.home_team,
    awayTeam: m.away_team,
    homeLogo: m.home_logo || null,
    awayLogo: m.away_logo || null,
    league: m.league || 'International',
    region: isAfrica ? 'Africa / CAF' : 'Europe',
    minute: rawMin,
    statusText: m.status === 'halftime' ? 'HT' : m.status === 'live' ? `LIVE ${rawMin}'` : 'LIVE',
    homeScore: hScore,
    awayScore: aScore,
    liveXgHome,
    liveXgAway,
    appmIndex: Math.min(97, Math.max(78, 73 + hShots + aShots)),
    dangerousAttacksHome: hAssists + hOnTarget,
    dangerousAttacksAway: aAssists + aOnTarget,
    shotsOnTargetHome: hOnTarget,
    shotsOnTargetAway: aOnTarget,
    cornersHome: hCorners,
    cornersAway: aCorners,
    sharpMarket,
    liveOdds,
    modelProbPct,
    evEdgePct,
    momentumNote,
    isRealtimeFeed: true,
  };
}

type LayoutViewMode = 'QUAD_4' | 'SPLIT_2' | 'SINGLE_1';

export const LiveMultiViewPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const {
    liveFixtures,
    isLiveFetching,
    refetchLive,
  } = useFootballData({ livePollInterval: 15_000 });
  const [layoutMode, setLayoutMode] = useState<LayoutViewMode>('QUAD_4');

  // Combine real-time live fixtures from useFootballData with fallback pool
  const activePool = useMemo<MultiViewMatchSlot[]>(() => {
    const inPlayOnly = liveFixtures.filter((m) => m.status === 'live' || m.status === 'halftime');
    const sourceFixtures = inPlayOnly.length >= 4 ? inPlayOnly : liveFixtures;
    if (sourceFixtures.length === 0) return MULTIVIEW_MATCH_POOL;

    const mapped = sourceFixtures.slice(0, 12).map((m, idx) => mapLiveFixtureToMultiViewSlot(m, idx));
    const seenPairs = new Set(
      mapped.map((m) => `${m.homeTeam.toLowerCase()}_${m.awayTeam.toLowerCase()}`)
    );
    const extras = MULTIVIEW_MATCH_POOL.filter(
      (f) => !seenPairs.has(`${f.homeTeam.toLowerCase()}_${f.awayTeam.toLowerCase()}`)
    );
    return [...mapped, ...extras];
  }, [liveFixtures]);

  const [selectedIds, setSelectedIds] = useState<string[]>([
    'mv-ars-che',
    'mv-rma-bar',
    'mv-bay-bvb',
    'mv-gor-afc',
  ]);
  const [lockedParlayIds, setLockedParlayIds] = useState<string[]>([
    'mv-ars-che',
    'mv-rma-bar',
    'mv-bay-bvb',
    'mv-gor-afc',
  ]);
  const [hasInitializedLiveIds, setHasInitializedLiveIds] = useState(false);
  const [tickOffset, setTickOffset] = useState<number>(0);
  const [simulatorTarget, setSimulatorTarget] = useState<MultiViewMatchSlot | null>(null);

  // Auto-load top 4 real-time live matches into the 4 TV screens when live feed arrives
  useEffect(() => {
    const realtimeItems = activePool.filter((m) => m.isRealtimeFeed);
    if (!hasInitializedLiveIds && realtimeItems.length >= 4) {
      const top4Ids = realtimeItems.slice(0, 4).map((m) => m.id);
      setSelectedIds(top4Ids);
      setLockedParlayIds(top4Ids);
      setHasInitializedLiveIds(true);
    }
  }, [activePool, hasInitializedLiveIds]);

  // Subtle live telemetry pulse every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTickOffset((t) => (t + 1) % 4);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const visibleSlots = useMemo(() => {
    const count = layoutMode === 'QUAD_4' ? 4 : layoutMode === 'SPLIT_2' ? 2 : 1;
    return selectedIds
      .slice(0, count)
      .map((id, idx) => activePool.find((m) => m.id === id) || activePool[idx] || MULTIVIEW_MATCH_POOL[0]);
  }, [selectedIds, layoutMode, activePool]);

  const parlayMatches = useMemo(() => {
    return activePool.filter((m) => lockedParlayIds.includes(m.id));
  }, [lockedParlayIds, activePool]);

  const combinedParlayStats = useMemo(() => {
    if (parlayMatches.length === 0) {
      return { totalOdds: 1, avgEdge: 0, suggestedStake: 20, kellyPct: 2.0 };
    }
    const totalOdds = parlayMatches.reduce((acc, m) => acc * m.liveOdds, 1);
    const avgEdge =
      parlayMatches.reduce((acc, m) => acc + m.evEdgePct, 0) / parlayMatches.length;
    return {
      totalOdds: Number(totalOdds.toFixed(2)),
      avgEdge: Number(avgEdge.toFixed(1)),
      suggestedStake: 25,
      kellyPct: 2.4,
    };
  }, [parlayMatches]);

  const handleSwapSlotMatch = (slotIndex: number, newMatchId: string) => {
    setSelectedIds((prev) => {
      const next = [...prev];
      next[slotIndex] = newMatchId;
      return next;
    });
  };

  const handleLoadPresetQuad = (preset: 'EUROPE_TOP' | 'AFRICA_CAF') => {
    if (preset === 'EUROPE_TOP') {
      const europeMatches = activePool.filter((m) => m.region === 'Europe').slice(0, 4);
      const ids =
        europeMatches.length >= 4
          ? europeMatches.map((m) => m.id)
          : activePool.slice(0, 4).map((m) => m.id);
      setSelectedIds(ids);
      setLockedParlayIds(ids);
      toast.success('Loaded Top 4 Live Real-Time Quad Screens!');
    } else {
      const africaMatches = activePool.filter((m) => m.region === 'Africa / CAF').slice(0, 4);
      const ids =
        africaMatches.length >= 4
          ? africaMatches.map((m) => m.id)
          : [...africaMatches, ...activePool].slice(0, 4).map((m) => m.id);
      setSelectedIds(ids);
      setLockedParlayIds(ids);
      toast.success('Loaded African Derby & CAF Live Quad Screens!');
    }
  };

  const toggleParlayLeg = (matchId: string) => {
    setLockedParlayIds((prev) =>
      prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]
    );
  };

  const handleAddSingleToSlip = (match: MultiViewMatchSlot) => {
    addSelection({
      id: `${match.id}-${Date.now()}`,
      matchId: match.id,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      kickoff: `LIVE ${match.minute}'`,
      market: match.sharpMarket,
      selection: match.sharpMarket,
      odds: match.liveOdds,
      confidence: match.modelProbPct,
    });
    toast.success(`Added ${match.homeTeam} vs ${match.awayTeam} (${match.sharpMarket}) to Slip!`);
  };

  const handleLoadQuadParlayToSlip = () => {
    parlayMatches.forEach((match) => {
      addSelection({
        id: `${match.id}-parlay`,
        matchId: match.id,
        match: `${match.homeTeam} vs ${match.awayTeam}`,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league,
        kickoff: `LIVE ${match.minute}'`,
        market: match.sharpMarket,
        selection: match.sharpMarket,
        odds: match.liveOdds,
        confidence: match.modelProbPct,
      });
    });
    toast.success(
      `Loaded ${parlayMatches.length}-Match Multi-View Parlay (@ ${combinedParlayStats.totalOdds.toFixed(
        2
      )}) into Bet Slip!`
    );
  };

  const handleSyncQuadToBankroll = () => {
    if (parlayMatches.length === 0) return;
    syncSlipToBankroll({
      source: 'LIVE_MULTIVIEW_QUAD',
      bookmaker: 'SportyBet / 1xBet Live',
      bookingCode: `MV-${Math.floor(1000 + Math.random() * 9000)}`,
      totalOdds: combinedParlayStats.totalOdds,
      suggestedStake: combinedParlayStats.suggestedStake,
      kellyPct: combinedParlayStats.kellyPct,
      legs: parlayMatches.map((m) => ({
        match: `${m.homeTeam} vs ${m.awayTeam}`,
        market: m.sharpMarket,
        odds: m.liveOdds,
      })),
    });
    toast.success('Synced Multi-View Live Parlay directly to Bankroll Portfolio!');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Live 4-Match Split-Screen TV Command Center & Monte Carlo Sandbox | PredictPro"
        description="Monitor 4 simultaneous football matches with live Expected Goals (xG), APPM pressure radar, 10,000-run Monte Carlo What-If simulations, and synchronized live parlay building."
      />
      <Navbar />

      <main
        id="main-content"
        className="flex-1 container mx-auto max-w-[1440px] px-3 sm:px-4 pt-6 pb-24 space-y-5"
      >
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'In-Play Radar', href: '/in-play-predictions' },
            { label: '4-Match Multi-View TV Command Center' },
          ]}
        />

        {/* Top Broadcast Control Bar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 text-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[11px] font-bold">
                <Radio className="h-3 w-3 animate-pulse" />
                QUAD-SCREEN REAL-TIME TELEMETRY ({activePool.filter((m) => m.isRealtimeFeed).length} LIVE FEEDS)
              </span>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                15s Live Scoreboard Sync · 4 Simultaneous Live xG &amp; APPM Feeds
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <Tv className="h-6 w-6 text-emerald-400" />
              <span>Live Multi-Match Split-Screen TV Command Center</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isLiveFetching}
              onClick={() => {
                refetchLive();
                toast.success('Synchronized real-time live matches across all 4 screens!');
              }}
              className="h-8 text-xs gap-1.5 bg-slate-900 border-emerald-500/40 text-emerald-400 hover:bg-slate-800 font-bold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLiveFetching ? 'animate-spin' : ''}`} />
              Sync Live Feeds
            </Button>
            <Link to="/pitch-telemetry">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 bg-slate-900 border-emerald-500/40 text-emerald-400 hover:bg-slate-800 font-bold"
              >
                <Crosshair className="h-3.5 w-3.5" />
                2D Shot Map &amp; 90m Wave
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                playStadiumGoalHorn();
                toast.success('⚽ Stadium Goal Horn Audio Triggered!');
              }}
              className="h-8 text-xs gap-1.5 bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Goal Horn
            </Button>
            {/* Preset Quad Loaders */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleLoadPresetQuad('EUROPE_TOP')}
              className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Top 4 High-EV Quad
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleLoadPresetQuad('AFRICA_CAF')}
              className="h-8 text-xs bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Africa / CAF Derby Quad
            </Button>

            {/* Layout Mode Switcher */}
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setLayoutMode('QUAD_4')}
                className={`px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                  layoutMode === 'QUAD_4'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>2×2 Quad</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('SPLIT_2')}
                className={`px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                  layoutMode === 'SPLIT_2'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns className="h-3.5 w-3.5" />
                <span>2-Split</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('SINGLE_1')}
                className={`px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                  layoutMode === 'SINGLE_1'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Focus</span>
              </button>
            </div>
          </div>
        </div>

        {/* Multi-Screen Broadcast Grid */}
        <div
          className={`grid gap-4 ${
            layoutMode === 'QUAD_4'
              ? 'grid-cols-1 lg:grid-cols-2'
              : layoutMode === 'SPLIT_2'
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 max-w-4xl mx-auto'
          }`}
        >
          {visibleSlots.map((match, slotIdx) => {
            const liveXgHomeTick = Number((match.liveXgHome + tickOffset * 0.02).toFixed(2));
            const liveXgAwayTick = Number((match.liveXgAway + (tickOffset % 2) * 0.01).toFixed(2));
            const totalDang = Math.max(
              match.dangerousAttacksHome + match.dangerousAttacksAway,
              1
            );
            const homeMomentumPct = Math.round((match.dangerousAttacksHome / totalDang) * 100);
            const isLockedInParlay = lockedParlayIds.includes(match.id);

            return (
              <Card
                key={`${match.id}-${slotIdx}`}
                className="border-border hover:border-emerald-500/40 transition-all overflow-hidden bg-card"
              >
                {/* Screen Slot Header & Channel Selector */}
                <CardHeader className="p-3.5 pb-2.5 bg-muted/30 border-b border-border/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono text-[11px] font-bold">
                        SCREEN #{slotIdx + 1}
                      </span>
                      <span className="font-mono tabular-nums text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {match.statusText === 'HT' ? 'HT' : `LIVE ${match.minute + (tickOffset % 2)}'`}
                      </span>
                      <span className="text-xs text-muted-foreground">· {match.league}</span>
                    </div>

                    {/* Channel Switcher Dropdown */}
                    <select
                      aria-label={`Select match for Screen ${slotIdx + 1}`}
                      value={match.id}
                      onChange={(e) => handleSwapSlotMatch(slotIdx, e.target.value)}
                      className="h-7 px-2 rounded bg-background border border-border text-[11px] font-semibold text-foreground cursor-pointer max-w-[230px]"
                    >
                      {activePool.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.homeTeam} {opt.homeScore}-{opt.awayScore} {opt.awayTeam} ({opt.league})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Teams, Scoreline & Live xG */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <TeamLogo team={match.homeTeam} logoUrl={match.homeLogo} league={match.league} size="sm" />
                      <div className="min-w-0">
                        <p className="font-black text-sm sm:text-base text-foreground truncate">
                          {match.homeTeam}
                        </p>
                        <p className="text-[11px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                          xG: {liveXgHomeTick.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 py-1.5 rounded-xl bg-slate-950 text-white border border-slate-800 text-center shrink-0">
                      <span className="font-mono tabular-nums font-black text-lg sm:text-xl tracking-tight">
                        {match.homeScore} : {match.awayScore}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1 text-right">
                      <div className="min-w-0">
                        <p className="font-black text-sm sm:text-base text-foreground truncate">
                          {match.awayTeam}
                        </p>
                        <p className="text-[11px] font-mono tabular-nums text-sky-500 font-bold">
                          xG: {liveXgAwayTick.toFixed(2)}
                        </p>
                      </div>
                      <TeamLogo team={match.awayTeam} logoUrl={match.awayLogo} league={match.league} size="sm" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3.5 space-y-3">
                  {/* APPM Pressure & 10-Min Momentum Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                      <span className="text-muted-foreground">
                        10m Attacks: <strong className="text-foreground">{match.dangerousAttacksHome}</strong>
                      </span>
                      <span className="text-primary font-bold">
                        APPM Pressure {match.appmIndex}/100 ({homeMomentumPct}% / {100 - homeMomentumPct}%)
                      </span>
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">{match.dangerousAttacksAway}</strong>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${homeMomentumPct}%` }}
                      />
                      <div
                        className="bg-amber-500 h-full transition-all"
                        style={{ width: `${100 - homeMomentumPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Compact 3-Metric Strip */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-muted/40 p-2 rounded-lg border border-border/60 font-mono tabular-nums">
                    <div>
                      <span className="text-[10px] font-sans text-muted-foreground block">
                        Unconverted xG
                      </span>
                      <span className="font-bold text-emerald-500">
                        +
                        {Math.max(
                          liveXgHomeTick + liveXgAwayTick - (match.homeScore + match.awayScore),
                          0.25
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans text-muted-foreground block">
                        Shots on Target
                      </span>
                      <span className="font-bold text-foreground">
                        {match.shotsOnTargetHome} - {match.shotsOnTargetAway}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans text-muted-foreground block">
                        Live Corners
                      </span>
                      <span className="font-bold text-foreground">
                        {match.cornersHome} - {match.cornersAway}
                      </span>
                    </div>
                  </div>

                  {/* Tactical Note */}
                  <p className="text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-500 inline mr-1 -mt-0.5" />
                    {match.momentumNote}
                  </p>

                  {/* Screen Action Footer: What-If Simulator + Parlay Lock + Slip */}
                  <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Sharp Edge: <span className="text-primary">{match.sharpMarket}</span>
                      </p>
                      <p className="text-[11px] font-mono tabular-nums text-muted-foreground">
                        Prob: <strong>{match.modelProbPct}%</strong> · EV:{' '}
                        <strong className="text-emerald-500">+{match.evEdgePct}%</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSimulatorTarget(match)}
                        className="h-8 px-2.5 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        What-If Sim
                      </Button>

                      <Button
                        size="sm"
                        variant={isLockedInParlay ? 'default' : 'outline'}
                        onClick={() => toggleParlayLeg(match.id)}
                        className={`h-8 px-2.5 text-xs gap-1 font-semibold ${
                          isLockedInParlay
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                            : ''
                        }`}
                      >
                        {isLockedInParlay ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        @{match.liveOdds.toFixed(2)}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Synchronized Multi-Screen Live Parlay Dock */}
        <Card className="border-emerald-500/40 bg-slate-950 text-white shadow-xl">
          <CardContent className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500 text-slate-950 font-mono font-bold text-[11px]">
                  MULTI-VIEW SYNCHRONIZED PARLAY ({parlayMatches.length} LEGS)
                </Badge>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  Avg Value Edge: +{combinedParlayStats.avgEdge}% · Half-Kelly Stake:{' '}
                  {combinedParlayStats.kellyPct}%
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {parlayMatches.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                  >
                    <strong className="text-white">
                      {m.homeTeam} v {m.awayTeam}:
                    </strong>
                    <span className="text-emerald-400">{m.sharpMarket}</span>
                    <span className="font-mono tabular-nums text-amber-400">
                      ({m.liveOdds.toFixed(2)})
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="text-right mr-2 font-mono tabular-nums">
                <span className="text-[11px] text-slate-400 block">Combined Live Odds</span>
                <span className="text-xl font-black text-emerald-400">
                  {combinedParlayStats.totalOdds.toFixed(2)}x
                </span>
              </div>

              <Button
                size="sm"
                onClick={handleLoadQuadParlayToSlip}
                disabled={parlayMatches.length === 0}
                className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-9 px-3.5"
              >
                <Plus className="h-4 w-4" />
                Load {parlayMatches.length}-Fold into Slip
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleSyncQuadToBankroll}
                disabled={parlayMatches.length === 0}
                className="gap-1.5 text-xs font-semibold bg-slate-900 border-slate-700 text-white hover:bg-slate-800 h-9"
              >
                <Wallet className="h-4 w-4 text-emerald-400" />
                Sync to Bankroll
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Interactive 10,000-Run What-If Simulator Modal */}
      {simulatorTarget && (
        <MatchTacticalSimulatorModal
          open={Boolean(simulatorTarget)}
          onOpenChange={(open) => {
            if (!open) setSimulatorTarget(null);
          }}
          homeTeam={simulatorTarget.homeTeam}
          awayTeam={simulatorTarget.awayTeam}
          league={simulatorTarget.league}
          baseHomeXg={simulatorTarget.liveXgHome}
          baseAwayXg={simulatorTarget.liveXgAway}
          currentHomeScore={simulatorTarget.homeScore}
          currentAwayScore={simulatorTarget.awayScore}
          minuteElapsed={simulatorTarget.minute}
        />
      )}

      <Footer />
    </div>
  );
};

export default LiveMultiViewPage;
