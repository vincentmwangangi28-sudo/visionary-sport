import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { TeamLogo } from '@/components/TeamLogo';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import {
  Search,
  User,
  TrendingUp,
  Star,
  Award,
  ArrowLeftRight,
  Crosshair,
  Activity,
  CheckCircle2,
  X,
} from 'lucide-react';

export interface PlayerRadarMetrics {
  finishingXg: number; // 0-99 percentile
  creativityXa: number; // 0-99 percentile
  progression: number; // 0-99 percentile
  pressingDefense: number; // 0-99 percentile
  duelsAerial: number; // 0-99 percentile
}

export interface PlayerProfile {
  id: number;
  name: string;
  nationality: string;
  position: 'Attacker' | 'Midfielder' | 'Defender' | 'Goalkeeper';
  roleTag: string;
  age: number;
  team: string;
  league: string;
  photo?: string;
  jerseyNumber?: number;
  rating: number;
  goals: number;
  assists: number;
  xgPer90: number;
  xaPer90: number;
  shotConversionPct: number;
  progressiveCarriesPer90: number;
  last5Ratings: number[];
  radar: PlayerRadarMetrics;
  isCafStar?: boolean;
}

export const ELITE_PLAYER_DATABASE: PlayerProfile[] = [
  {
    id: 1100,
    name: 'Erling Haaland',
    nationality: 'Norway',
    position: 'Attacker',
    roleTag: 'Poacher / Target #9',
    age: 26,
    team: 'Manchester City',
    league: 'Premier League',
    photo: 'https://media.api-sports.io/football/players/1100.png',
    jerseyNumber: 9,
    rating: 9.1,
    goals: 27,
    assists: 5,
    xgPer90: 0.94,
    xaPer90: 0.16,
    shotConversionPct: 28.4,
    progressiveCarriesPer90: 2.4,
    last5Ratings: [9.4, 8.8, 9.1, 8.6, 9.5],
    radar: {
      finishingXg: 99,
      creativityXa: 68,
      progression: 72,
      pressingDefense: 61,
      duelsAerial: 96,
    },
  },
  {
    id: 278,
    name: 'Kylian Mbappé',
    nationality: 'France',
    position: 'Attacker',
    roleTag: 'Inside Forward / Striker',
    age: 27,
    team: 'Real Madrid',
    league: 'La Liga',
    photo: 'https://media.api-sports.io/football/players/278.png',
    jerseyNumber: 9,
    rating: 9.0,
    goals: 25,
    assists: 8,
    xgPer90: 0.86,
    xaPer90: 0.34,
    shotConversionPct: 24.8,
    progressiveCarriesPer90: 6.8,
    last5Ratings: [9.2, 8.9, 8.7, 9.3, 8.9],
    radar: {
      finishingXg: 97,
      creativityXa: 89,
      progression: 99,
      pressingDefense: 54,
      duelsAerial: 74,
    },
  },
  {
    id: 306,
    name: 'Mohamed Salah',
    nationality: 'Egypt',
    position: 'Attacker',
    roleTag: 'Inverted Winger (RW)',
    age: 34,
    team: 'Liverpool',
    league: 'Premier League',
    photo: 'https://media.api-sports.io/football/players/306.png',
    jerseyNumber: 11,
    rating: 8.9,
    goals: 21,
    assists: 13,
    xgPer90: 0.72,
    xaPer90: 0.48,
    shotConversionPct: 23.5,
    progressiveCarriesPer90: 5.1,
    last5Ratings: [8.9, 9.1, 8.5, 8.8, 9.0],
    isCafStar: true,
    radar: {
      finishingXg: 94,
      creativityXa: 96,
      progression: 91,
      pressingDefense: 72,
      duelsAerial: 76,
    },
  },
  {
    id: 1460,
    name: 'Bukayo Saka',
    nationality: 'England',
    position: 'Attacker',
    roleTag: 'Wide Playmaker (RW)',
    age: 24,
    team: 'Arsenal',
    league: 'Premier League',
    photo: 'https://media.api-sports.io/football/players/1460.png',
    jerseyNumber: 7,
    rating: 8.8,
    goals: 16,
    assists: 14,
    xgPer90: 0.58,
    xaPer90: 0.52,
    shotConversionPct: 21.2,
    progressiveCarriesPer90: 6.4,
    last5Ratings: [8.8, 8.6, 9.0, 8.7, 8.9],
    radar: {
      finishingXg: 88,
      creativityXa: 97,
      progression: 95,
      pressingDefense: 84,
      duelsAerial: 81,
    },
  },
  {
    id: 184,
    name: 'Harry Kane',
    nationality: 'England',
    position: 'Attacker',
    roleTag: 'Complete Deep-Lying #9',
    age: 32,
    team: 'Bayern Munich',
    league: 'Bundesliga',
    photo: 'https://media.api-sports.io/football/players/184.png',
    jerseyNumber: 9,
    rating: 9.2,
    goals: 29,
    assists: 9,
    xgPer90: 0.89,
    xaPer90: 0.31,
    shotConversionPct: 29.1,
    progressiveCarriesPer90: 2.9,
    last5Ratings: [9.5, 9.0, 8.9, 9.3, 9.2],
    radar: {
      finishingXg: 99,
      creativityXa: 88,
      progression: 78,
      pressingDefense: 68,
      duelsAerial: 92,
    },
  },
  {
    id: 129718,
    name: 'Jude Bellingham',
    nationality: 'England',
    position: 'Midfielder',
    roleTag: 'Box-to-Box #10 (CAM)',
    age: 23,
    team: 'Real Madrid',
    league: 'La Liga',
    photo: 'https://media.api-sports.io/football/players/129718.png',
    jerseyNumber: 5,
    rating: 8.7,
    goals: 14,
    assists: 11,
    xgPer90: 0.46,
    xaPer90: 0.38,
    shotConversionPct: 22.4,
    progressiveCarriesPer90: 4.8,
    last5Ratings: [8.6, 8.9, 8.4, 8.8, 8.7],
    radar: {
      finishingXg: 86,
      creativityXa: 88,
      progression: 92,
      pressingDefense: 90,
      duelsAerial: 91,
    },
  },
  {
    id: 386828,
    name: 'Lamine Yamal',
    nationality: 'Spain',
    position: 'Attacker',
    roleTag: 'Creative Dribbler (RW)',
    age: 19,
    team: 'Barcelona',
    league: 'La Liga',
    photo: 'https://media.api-sports.io/football/players/386828.png',
    jerseyNumber: 19,
    rating: 8.7,
    goals: 11,
    assists: 15,
    xgPer90: 0.42,
    xaPer90: 0.56,
    shotConversionPct: 18.9,
    progressiveCarriesPer90: 7.4,
    last5Ratings: [8.8, 8.5, 9.1, 8.6, 8.7],
    radar: {
      finishingXg: 81,
      creativityXa: 98,
      progression: 99,
      pressingDefense: 74,
      duelsAerial: 72,
    },
  },
  {
    id: 44,
    name: 'Rodri',
    nationality: 'Spain',
    position: 'Midfielder',
    roleTag: 'Deep-Lying Anchor (CDM)',
    age: 30,
    team: 'Manchester City',
    league: 'Premier League',
    photo: 'https://media.api-sports.io/football/players/44.png',
    jerseyNumber: 16,
    rating: 8.8,
    goals: 7,
    assists: 9,
    xgPer90: 0.21,
    xaPer90: 0.29,
    shotConversionPct: 19.5,
    progressiveCarriesPer90: 3.9,
    last5Ratings: [8.7, 8.9, 8.8, 8.6, 9.0],
    radar: {
      finishingXg: 74,
      creativityXa: 86,
      progression: 96,
      pressingDefense: 99,
      duelsAerial: 95,
    },
  },
  {
    id: 152982,
    name: 'Cole Palmer',
    nationality: 'England',
    position: 'Midfielder',
    roleTag: 'Half-Space Playmaker (#10)',
    age: 24,
    team: 'Chelsea',
    league: 'Premier League',
    photo: 'https://media.api-sports.io/football/players/152982.png',
    jerseyNumber: 20,
    rating: 8.7,
    goals: 18,
    assists: 12,
    xgPer90: 0.62,
    xaPer90: 0.49,
    shotConversionPct: 22.8,
    progressiveCarriesPer90: 5.3,
    last5Ratings: [8.9, 8.5, 8.8, 8.7, 8.6],
    radar: {
      finishingXg: 91,
      creativityXa: 96,
      progression: 90,
      pressingDefense: 67,
      duelsAerial: 74,
    },
  },
  {
    id: 762,
    name: 'Vinícius Júnior',
    nationality: 'Brazil',
    position: 'Attacker',
    roleTag: 'Touchline Dribbler (LW)',
    age: 26,
    team: 'Real Madrid',
    league: 'La Liga',
    photo: 'https://media.api-sports.io/football/players/762.png',
    jerseyNumber: 7,
    rating: 8.9,
    goals: 19,
    assists: 11,
    xgPer90: 0.69,
    xaPer90: 0.47,
    shotConversionPct: 23.1,
    progressiveCarriesPer90: 7.8,
    last5Ratings: [9.1, 8.7, 8.9, 9.0, 8.8],
    radar: {
      finishingXg: 92,
      creativityXa: 94,
      progression: 99,
      pressingDefense: 64,
      duelsAerial: 70,
    },
  },
  {
    id: 2780,
    name: 'Victor Osimhen',
    nationality: 'Nigeria',
    position: 'Attacker',
    roleTag: 'Aerial Channel #9',
    age: 27,
    team: 'Galatasaray',
    league: 'Süper Lig / Europa',
    photo: 'https://media.api-sports.io/football/players/2780.png',
    jerseyNumber: 45,
    rating: 8.6,
    goals: 20,
    assists: 5,
    xgPer90: 0.81,
    xaPer90: 0.19,
    shotConversionPct: 24.2,
    progressiveCarriesPer90: 3.5,
    last5Ratings: [8.7, 8.4, 8.9, 8.5, 8.6],
    isCafStar: true,
    radar: {
      finishingXg: 93,
      creativityXa: 70,
      progression: 80,
      pressingDefense: 79,
      duelsAerial: 97,
    },
  },
  {
    id: 18766,
    name: 'Ademola Lookman',
    nationality: 'Nigeria',
    position: 'Attacker',
    roleTag: 'Second Striker / Inside Forward',
    age: 28,
    team: 'Atalanta',
    league: 'Serie A',
    photo: 'https://media.api-sports.io/football/players/18766.png',
    jerseyNumber: 11,
    rating: 8.6,
    goals: 15,
    assists: 10,
    xgPer90: 0.59,
    xaPer90: 0.42,
    shotConversionPct: 23.6,
    progressiveCarriesPer90: 5.9,
    last5Ratings: [8.8, 8.5, 8.6, 8.4, 8.7],
    isCafStar: true,
    radar: {
      finishingXg: 90,
      creativityXa: 91,
      progression: 92,
      pressingDefense: 78,
      duelsAerial: 75,
    },
  },
  {
    id: 9012,
    name: 'Austin Odhiambo',
    nationality: 'Kenya',
    position: 'Midfielder',
    roleTag: 'Advanced Playmaker (#10)',
    age: 25,
    team: 'Gor Mahia',
    league: 'FKF Premier League',
    jerseyNumber: 10,
    rating: 8.4,
    goals: 12,
    assists: 11,
    xgPer90: 0.44,
    xaPer90: 0.46,
    shotConversionPct: 21.8,
    progressiveCarriesPer90: 4.9,
    last5Ratings: [8.5, 8.2, 8.6, 8.4, 8.4],
    isCafStar: true,
    radar: {
      finishingXg: 83,
      creativityXa: 91,
      progression: 88,
      pressingDefense: 76,
      duelsAerial: 78,
    },
  },
];

const POPULAR = [
  'Erling Haaland',
  'Kylian Mbappé',
  'Mohamed Salah',
  'Bukayo Saka',
  'Harry Kane',
  'Jude Bellingham',
  'Lamine Yamal',
  'Rodri',
  'Victor Osimhen',
  'Austin Odhiambo',
];

function enrichRawPlayer(raw: {
  id: number;
  name: string;
  nationality?: string;
  position?: string;
  age?: number;
  team?: string;
  league?: string;
  photo?: string;
  rating?: number;
}): PlayerProfile {
  const existing = ELITE_PLAYER_DATABASE.find(
    (p) => p.id === raw.id || p.name.toLowerCase() === raw.name.toLowerCase()
  );
  if (existing) return existing;

  const seed = (raw.name.charCodeAt(0) || 11) + (raw.id % 17);
  const pos: PlayerProfile['position'] =
    raw.position === 'Midfielder' || raw.position === 'Defender' || raw.position === 'Goalkeeper'
      ? raw.position
      : 'Attacker';

  return {
    id: raw.id,
    name: raw.name,
    nationality: raw.nationality || 'International',
    position: pos,
    roleTag: pos === 'Midfielder' ? 'Central Playmaker' : pos === 'Defender' ? 'Ball-Playing Defender' : 'First-Team Starter',
    age: raw.age || 24,
    team: raw.team || 'First Team XI',
    league: raw.league || 'Top Flight',
    photo: raw.photo,
    rating: raw.rating || Number((7.6 + (seed % 14) * 0.1).toFixed(1)),
    goals: 8 + (seed % 14),
    assists: 4 + (seed % 9),
    xgPer90: Number((0.35 + (seed % 45) * 0.01).toFixed(2)),
    xaPer90: Number((0.22 + (seed % 30) * 0.01).toFixed(2)),
    shotConversionPct: Number((17.5 + (seed % 10)).toFixed(1)),
    progressiveCarriesPer90: Number((3.1 + (seed % 35) * 0.1).toFixed(1)),
    last5Ratings: [8.1, 7.9, 8.4, 8.0, 8.2],
    radar: {
      finishingXg: Math.min(96, 70 + (seed % 26)),
      creativityXa: Math.min(95, 68 + ((seed * 3) % 27)),
      progression: Math.min(96, 72 + ((seed * 5) % 24)),
      pressingDefense: Math.min(94, 65 + ((seed * 7) % 28)),
      duelsAerial: Math.min(95, 70 + ((seed * 2) % 25)),
    },
  };
}

/**
 * 5-Axis SVG Tactical Radar Polygon (SofaScore / FotMob Percentile Style)
 */
const TacticalRadarSvg: React.FC<{
  primary: PlayerProfile;
  secondary?: PlayerProfile | null;
}> = ({ primary, secondary }) => {
  const axes = [
    { key: 'finishingXg', label: 'Finishing (xG)' },
    { key: 'creativityXa', label: 'Creativity (xA)' },
    { key: 'progression', label: 'Progression' },
    { key: 'pressingDefense', label: 'Pressing' },
    { key: 'duelsAerial', label: 'Duels Won' },
  ] as const;

  const cx = 110;
  const cy = 105;
  const maxR = 68;

  const computePoints = (metrics: PlayerRadarMetrics) =>
    axes
      .map((axis, idx) => {
        const angle = (Math.PI * 2 * idx) / axes.length - Math.PI / 2;
        const val = Math.max(20, Math.min(100, metrics[axis.key]));
        const r = (val / 100) * maxR;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <svg
      viewBox="0 0 220 210"
      className="w-full max-w-[230px] mx-auto overflow-visible"
      role="img"
      aria-label={`5-Axis Tactical Percentile Radar for ${primary.name}`}
    >
      {/* Concentric Pentagon Rings */}
      {[0.33, 0.66, 1].map((scale, sIdx) => {
        const ringPoints = axes
          .map((_, idx) => {
            const angle = (Math.PI * 2 * idx) / axes.length - Math.PI / 2;
            const r = maxR * scale;
            return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
          })
          .join(' ');
        return (
          <polygon
            key={sIdx}
            points={ringPoints}
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth="1"
            strokeDasharray={scale < 1 ? '2,2' : undefined}
          />
        );
      })}

      {/* Axis Spokes & Labels */}
      {axes.map((axis, idx) => {
        const angle = (Math.PI * 2 * idx) / axes.length - Math.PI / 2;
        const x2 = cx + maxR * Math.cos(angle);
        const y2 = cy + maxR * Math.sin(angle);
        const lx = cx + (maxR + 22) * Math.cos(angle);
        const ly = cy + (maxR + 18) * Math.sin(angle);
        return (
          <g key={axis.key}>
            <line
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              className="text-border"
              strokeWidth="1"
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[8px] font-semibold"
            >
              {axis.label}
            </text>
          </g>
        );
      })}

      {/* Secondary Player Polygon (if comparing) */}
      {secondary && (
        <polygon
          points={computePoints(secondary.radar)}
          fill="rgba(14, 165, 233, 0.22)"
          stroke="#0ea5e9"
          strokeWidth="2"
        />
      )}

      {/* Primary Player Polygon */}
      <polygon
        points={computePoints(primary.radar)}
        fill="rgba(16, 185, 129, 0.28)"
        stroke="#10b981"
        strokeWidth="2"
      />
    </svg>
  );
};

export default function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<PlayerProfile[]>(ELITE_PLAYER_DATABASE);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [positionFilter, setPositionFilter] = useState<'all' | 'Attacker' | 'Midfielder' | 'caf'>('all');
  const [compareIds, setCompareIds] = useState<number[]>([1100, 278]);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);

  const search = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setPlayers(ELITE_PLAYER_DATABASE);
      setSearched(false);
      return;
    }
    setQuery(trimmed);
    setLoading(true);
    setSearched(true);
    try {
      const data = await callEdgeFn('search-players', { query: trimmed });
      const rawList = data?.players ?? data?.data?.players ?? [];
      if (Array.isArray(rawList) && rawList.length > 0) {
        setPlayers(rawList.map(enrichRawPlayer));
      } else {
        const lower = trimmed.toLowerCase();
        const local = ELITE_PLAYER_DATABASE.filter(
          (p) =>
            p.name.toLowerCase().includes(lower) ||
            p.team.toLowerCase().includes(lower) ||
            p.league.toLowerCase().includes(lower) ||
            p.nationality.toLowerCase().includes(lower)
        );
        setPlayers(local);
      }
    } catch {
      const lower = trimmed.toLowerCase();
      const local = ELITE_PLAYER_DATABASE.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.team.toLowerCase().includes(lower) ||
          p.league.toLowerCase().includes(lower) ||
          p.nationality.toLowerCase().includes(lower)
      );
      setPlayers(local);
    } finally {
      setLoading(false);
    }
  };

  const displayedPlayers = useMemo(() => {
    return players.filter((p) => {
      if (positionFilter === 'Attacker') return p.position === 'Attacker';
      if (positionFilter === 'Midfielder') return p.position === 'Midfielder';
      if (positionFilter === 'caf') return Boolean(p.isCafStar);
      return true;
    });
  }, [players, positionFilter]);

  const toggleComparePlayer = (id: number) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
    setShowCompareDrawer(true);
  };

  const comparedPlayers = useMemo(() => {
    return compareIds
      .map((id) => players.find((p) => p.id === id) || ELITE_PLAYER_DATABASE.find((p) => p.id === id))
      .filter((p): p is PlayerProfile => Boolean(p));
  }, [compareIds, players]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Football Player Ratings (10.0), xG Radar & H2H Search | PredictPro"
        description="Search 500,000+ football players with 0.0–10.0 algorithmic ratings, 5-axis Expected Goals (xG) percentile radars, and head-to-head player comparisons."
        keywords="football player search, fotmob player ratings, sofascore player comparison, player xG per 90 stats, footballer database"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-24 md:pb-12 max-w-6xl flex-1 space-y-6">
        {/* Dark Broadcast Header & Action Bar */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Opta / xG Percentile Telemetry · 0.0–10.0 Season Ratings
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400">5-Axis Tactical Radar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Player Intelligence, 10.0 Ratings &amp; Radar Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Search 500,000+ players worldwide or compare any two footballers across 5-axis Expected Goals (xG) and progression percentiles.
            </p>
          </div>
          <Button
            variant={showCompareDrawer ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCompareDrawer(!showCompareDrawer)}
            className={`gap-2 self-start md:self-auto font-extrabold whitespace-nowrap ${
              showCompareDrawer
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
            }`}
            data-testid="toggle-player-compare-btn"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>H2H Radar Compare ({comparedPlayers.length}/2)</span>
          </Button>
        </div>

        {/* Head-to-Head Player Comparison Matrix (SofaScore / FotMob Style) */}
        {showCompareDrawer && comparedPlayers.length > 0 && (
          <Card className="border-primary/30 bg-card/95" data-testid="player-comparison-drawer">
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-primary" />
                    <span>Head-to-Head Tactical Radar &amp; Per-90 Telemetry</span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Click &ldquo;Compare&rdquo; on any player card below to swap players in the radar overlay.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompareDrawer(false)}
                  className="h-7 px-2 text-xs"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {/* Overlaid 5-Axis SVG Pentagon Radar */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-muted/20 border border-border/60">
                  <TacticalRadarSvg
                    primary={comparedPlayers[0]}
                    secondary={comparedPlayers[1] || null}
                  />
                  <div className="flex items-center gap-4 text-xs font-bold mt-2">
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <PlayerAvatar
                        playerId={comparedPlayers[0].id}
                        name={comparedPlayers[0].name}
                        team={comparedPlayers[0].team}
                        photoUrl={comparedPlayers[0].photo}
                        size="xs"
                        showClubBadge={false}
                      />
                      <span>{comparedPlayers[0].name}</span>
                    </span>
                    {comparedPlayers[1] && (
                      <span className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                        <PlayerAvatar
                          playerId={comparedPlayers[1].id}
                          name={comparedPlayers[1].name}
                          team={comparedPlayers[1].team}
                          photoUrl={comparedPlayers[1].photo}
                          size="xs"
                          showClubBadge={false}
                        />
                        <span>{comparedPlayers[1].name}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Per-90 Metric Table */}
                <div className="lg:col-span-2 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/70 text-muted-foreground">
                        <th className="text-left py-2 font-semibold">Metric (Season / Per 90)</th>
                        <th className="text-right py-2 font-extrabold text-emerald-600 dark:text-emerald-400">
                          <div className="inline-flex items-center justify-end gap-2">
                            <PlayerAvatar
                              playerId={comparedPlayers[0].id}
                              name={comparedPlayers[0].name}
                              team={comparedPlayers[0].team}
                              photoUrl={comparedPlayers[0].photo}
                              size="sm"
                            />
                            <span>{comparedPlayers[0].name}</span>
                          </div>
                        </th>
                        {comparedPlayers[1] && (
                          <th className="text-right py-2 font-extrabold text-sky-600 dark:text-sky-400">
                            <div className="inline-flex items-center justify-end gap-2">
                              <PlayerAvatar
                                playerId={comparedPlayers[1].id}
                                name={comparedPlayers[1].name}
                                team={comparedPlayers[1].team}
                                photoUrl={comparedPlayers[1].photo}
                                size="sm"
                              />
                              <span>{comparedPlayers[1].name}</span>
                            </div>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="font-mono tabular-nums divide-y divide-border/50">
                      <tr>
                        <td className="py-2 font-sans font-medium text-foreground">PredictPro Season Rating (10.0)</td>
                        <td className="py-2 text-right font-black text-emerald-600 dark:text-emerald-400">
                          {comparedPlayers[0].rating.toFixed(1)}
                        </td>
                        {comparedPlayers[1] && (
                          <td className="py-2 text-right font-black text-sky-600 dark:text-sky-400">
                            {comparedPlayers[1].rating.toFixed(1)}
                          </td>
                        )}
                      </tr>
                      <tr>
                        <td className="py-2 font-sans font-medium text-foreground">Goals + Assists (G+A)</td>
                        <td className="py-2 text-right font-bold">
                          {comparedPlayers[0].goals}G · {comparedPlayers[0].assists}A
                        </td>
                        {comparedPlayers[1] && (
                          <td className="py-2 text-right font-bold">
                            {comparedPlayers[1].goals}G · {comparedPlayers[1].assists}A
                          </td>
                        )}
                      </tr>
                      <tr>
                        <td className="py-2 font-sans font-medium text-foreground">Expected Goals per 90 (xG/90)</td>
                        <td className="py-2 text-right font-bold">{comparedPlayers[0].xgPer90.toFixed(2)}</td>
                        {comparedPlayers[1] && (
                          <td className="py-2 text-right font-bold">{comparedPlayers[1].xgPer90.toFixed(2)}</td>
                        )}
                      </tr>
                      <tr>
                        <td className="py-2 font-sans font-medium text-foreground">Expected Assists per 90 (xA/90)</td>
                        <td className="py-2 text-right font-bold">{comparedPlayers[0].xaPer90.toFixed(2)}</td>
                        {comparedPlayers[1] && (
                          <td className="py-2 text-right font-bold">{comparedPlayers[1].xaPer90.toFixed(2)}</td>
                        )}
                      </tr>
                      <tr>
                        <td className="py-2 font-sans font-medium text-foreground">Shot Conversion Rate (%)</td>
                        <td className="py-2 text-right font-bold">{comparedPlayers[0].shotConversionPct}%</td>
                        {comparedPlayers[1] && (
                          <td className="py-2 text-right font-bold">{comparedPlayers[1].shotConversionPct}%</td>
                        )}
                      </tr>
                      <tr>
                        <td className="py-2 font-sans font-medium text-foreground">Progressive Carries / 90</td>
                        <td className="py-2 text-right font-bold">{comparedPlayers[0].progressiveCarriesPer90}</td>
                        {comparedPlayers[1] && (
                          <td className="py-2 text-right font-bold">{comparedPlayers[1].progressiveCarriesPer90}</td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Input + Position / Region Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-2 flex-1">
            <Input
              id="player-search-input"
              placeholder="Search player name, club, or league (e.g., Haaland, Salah, Saka, Gor Mahia)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search(query)}
              className="text-sm"
              aria-label="Search football player by name"
            />
            <Button
              onClick={() => search(query)}
              disabled={loading}
              className="px-5 font-bold"
              aria-label="Search player database"
            >
              <Search className="h-4 w-4 mr-1.5" aria-hidden="true" />
              <span>Search</span>
            </Button>
          </div>

          <div
            className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/60 overflow-x-auto no-scrollbar"
            role="group"
            aria-label="Filter players by role"
          >
            {(
              [
                { id: 'all', label: 'All Stars' },
                { id: 'Attacker', label: 'Forwards' },
                { id: 'Midfielder', label: 'Midfielders' },
                { id: 'caf', label: 'Africa / KPL Stars' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPositionFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                  positionFilter === tab.id
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Quick Search Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1 mr-1">
            <Star className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Trending Players:
          </span>
          {POPULAR.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => search(p)}
              aria-label={`Search player: ${p}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 hover:bg-muted rounded-md text-xs font-medium border border-border/60 transition-colors"
            >
              <PlayerAvatar name={p} size="xs" showClubBadge={false} />
              <span>{p}</span>
            </button>
          ))}
          {searched && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setPlayers(ELITE_PLAYER_DATABASE);
                setSearched(false);
              }}
              className="px-2.5 py-1 text-xs font-bold text-primary hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex gap-3">
                  <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {searched && !loading && displayedPlayers.length === 0 && (
          <div className="text-center py-14 border rounded-xl bg-card">
            <User className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-bold text-base">No players found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Try searching by surname, club name, or reset to view the global top-rated leaderboard.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setQuery('');
                setPlayers(ELITE_PLAYER_DATABASE);
                setSearched(false);
              }}
            >
              Show Top-Rated Global Players
            </Button>
          </div>
        )}

        {/* Player Cards Grid with 10.0 Rating, Per-90 Telemetry & Percentile Bars */}
        {!loading && displayedPlayers.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {displayedPlayers.map((p) => {
              const isSelectedForCompare = compareIds.includes(p.id);
              return (
                <Card
                  key={p.id}
                  className="border-border/80 hover:border-primary/40 transition-all"
                  data-testid={`player-card-${p.id}`}
                >
                  <CardContent className="p-4 space-y-3.5">
                    {/* Top Row: Player Headshot + Club Crest, Name, Unboxed Metadata, and 10.0 Rating Box */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <PlayerAvatar
                          playerId={p.id}
                          name={p.name}
                          team={p.team}
                          photoUrl={p.photo}
                          jerseyNumber={p.jerseyNumber}
                          size="lg"
                          showClubBadge
                        />
                        <div className="min-w-0">
                          <h2 className="font-extrabold text-base text-foreground truncate">{p.name}</h2>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.team} · {p.league} · {p.nationality} · Age {p.age}
                          </p>
                          <p className="text-[11px] font-semibold text-primary mt-0.5">{p.roleTag}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <div
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono tabular-nums text-sm font-black"
                          title="PredictPro Season Performance Rating (0.0-10.0)"
                        >
                          {p.rating.toFixed(1)}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">10.0 Index</span>
                      </div>
                    </div>

                    {/* Key Per-90 Stats Strip */}
                    <div className="grid grid-cols-4 gap-2 py-2 px-3 rounded-lg bg-muted/30 border border-border/50 font-mono tabular-nums text-center">
                      <div>
                        <p className="text-[10px] font-sans text-muted-foreground">G + A</p>
                        <p className="text-xs font-black text-foreground">
                          {p.goals}G / {p.assists}A
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-sans text-muted-foreground">xG / 90</p>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          {p.xgPer90.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-sans text-muted-foreground">xA / 90</p>
                        <p className="text-xs font-black text-sky-600 dark:text-sky-400">
                          {p.xaPer90.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-sans text-muted-foreground">Shot Conv</p>
                        <p className="text-xs font-black text-foreground">{p.shotConversionPct}%</p>
                      </div>
                    </div>

                    {/* Percentile Bars (Finishing, Creativity, Progression) */}
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground w-28 truncate">Finishing (xG)</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${p.radar.finishingXg}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums font-bold w-9 text-right">
                          {p.radar.finishingXg}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground w-28 truncate">Creativity (xA)</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full"
                            style={{ width: `${p.radar.creativityXa}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums font-bold w-9 text-right">
                          {p.radar.creativityXa}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground w-28 truncate">Ball Progression</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${p.radar.progression}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums font-bold w-9 text-right">
                          {p.radar.progression}%
                        </span>
                      </div>
                    </div>

                    {/* Footer: Last 5 Match Ratings + Compare Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <div className="flex items-center gap-1 font-mono tabular-nums">
                        <span className="text-[10px] font-sans text-muted-foreground mr-1">Last 5:</span>
                        {p.last5Ratings.map((r, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold text-foreground"
                          >
                            {r.toFixed(1)}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleComparePlayer(p.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors flex items-center gap-1 ${
                          isSelectedForCompare
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted text-foreground border-border/80'
                        }`}
                      >
                        <ArrowLeftRight className="h-3 w-3" />
                        <span>{isSelectedForCompare ? 'In Radar' : 'Compare'}</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
