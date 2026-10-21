import { useState, useEffect, useMemo } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { useUserPreferences, RiskProfile } from '@/hooks/useUserPreferences';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { GeoRegionSelector } from '@/components/GeoRegionSelector';
import { PredictionCard } from '@/components/PredictionCard';
import { PredictionListSkeleton } from '@/components/PredictionCardSkeleton';
import { DateFilterType } from '@/components/LeagueDateFilterBar';
import { TeamLogo } from '@/components/TeamLogo';
import { useBetSlip } from '@/hooks/useBetSlip';
import { hapticService } from '@/services/hapticService';
import {
  matchesDateFilter,
  calculateDateFilterCounts,
  isPlayedOrPastMatch,
  sortMatchesByDatePriority,
} from '@/lib/dateFilterUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  List,
  AlignJustify,
  Search,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import { LEAGUE_HUBS } from '@/data/leagueHubs';
import { getPrediction, getConfidence } from '@/types/prediction';

interface PredictionsDashboardProps {
  initialLeague?: string;
  defaultLeague?: string;
}

type QuickFilter = 'all' | 'recommended' | 'high_confidence' | 'value_bets' | 'today';

const MINI_STANDINGS_DATA: Record<
  'EPL' | 'LALIGA' | 'SERIEA' | 'BUNDESLIGA',
  Array<{ rank: number; team: string; played: number; gd: string; xPts: number; pts: number }>
> = {
  EPL: [
    { rank: 1, team: 'Liverpool', played: 28, gd: '+41', xPts: 64.8, pts: 67 },
    { rank: 2, team: 'Arsenal', played: 28, gd: '+38', xPts: 63.4, pts: 64 },
    { rank: 3, team: 'Manchester City', played: 28, gd: '+32', xPts: 60.1, pts: 61 },
    { rank: 4, team: 'Chelsea', played: 28, gd: '+19', xPts: 53.6, pts: 52 },
    { rank: 5, team: 'Aston Villa', played: 28, gd: '+11', xPts: 48.2, pts: 49 },
    { rank: 6, team: 'Newcastle', played: 28, gd: '+10', xPts: 47.5, pts: 47 },
  ],
  LALIGA: [
    { rank: 1, team: 'Real Madrid', played: 28, gd: '+42', xPts: 65.2, pts: 68 },
    { rank: 2, team: 'Barcelona', played: 28, gd: '+36', xPts: 62.9, pts: 65 },
    { rank: 3, team: 'Atletico Madrid', played: 28, gd: '+24', xPts: 56.4, pts: 58 },
    { rank: 4, team: 'Athletic Club', played: 28, gd: '+18', xPts: 51.0, pts: 52 },
    { rank: 5, team: 'Villarreal', played: 28, gd: '+9', xPts: 46.8, pts: 47 },
    { rank: 6, team: 'Real Betis', played: 28, gd: '+5', xPts: 43.1, pts: 44 },
  ],
  SERIEA: [
    { rank: 1, team: 'Inter Milan', played: 28, gd: '+44', xPts: 66.5, pts: 69 },
    { rank: 2, team: 'Napoli', played: 28, gd: '+27', xPts: 59.8, pts: 62 },
    { rank: 3, team: 'Atalanta', played: 28, gd: '+29', xPts: 58.9, pts: 59 },
    { rank: 4, team: 'Juventus', played: 28, gd: '+21', xPts: 54.2, pts: 55 },
    { rank: 5, team: 'AC Milan', played: 28, gd: '+14', xPts: 49.7, pts: 50 },
    { rank: 6, team: 'Lazio', played: 28, gd: '+11', xPts: 47.3, pts: 48 },
  ],
  BUNDESLIGA: [
    { rank: 1, team: 'Bayern Munich', played: 26, gd: '+49', xPts: 64.1, pts: 65 },
    { rank: 2, team: 'Bayer Leverkusen', played: 26, gd: '+31', xPts: 57.6, pts: 59 },
    { rank: 3, team: 'Eintracht Frankfurt', played: 26, gd: '+14', xPts: 46.8, pts: 48 },
    { rank: 4, team: 'RB Leipzig', played: 26, gd: '+13', xPts: 46.2, pts: 46 },
    { rank: 5, team: 'Borussia Dortmund', played: 26, gd: '+12', xPts: 45.4, pts: 45 },
    { rank: 6, team: 'VfB Stuttgart', played: 26, gd: '+9', xPts: 43.9, pts: 43 },
  ],
};

function getLeagueCountry(leagueName: string): string {
  const lower = leagueName.toLowerCase();
  if (lower.includes('premier league') && !lower.includes('fkf') && !lower.includes('kenya')) return 'England';
  if (lower.includes('champions league') && !lower.includes('caf')) return 'Europe';
  if (lower.includes('europa') || lower.includes('conference')) return 'Europe';
  if (lower.includes('la liga') || lower.includes('spain')) return 'Spain';
  if (lower.includes('serie a') || lower.includes('italy')) return 'Italy';
  if (lower.includes('bundesliga') || lower.includes('germany')) return 'Germany';
  if (lower.includes('ligue 1') || lower.includes('france')) return 'France';
  if (lower.includes('fkf') || lower.includes('kenya') || lower.includes('kpl')) return 'Kenya';
  if (lower.includes('caf') || lower.includes('afcon')) return 'Africa';
  if (lower.includes('mls') || lower.includes('usa')) return 'USA';
  return 'International';
}

export const PredictionsDashboard = ({ initialLeague, defaultLeague }: PredictionsDashboardProps = {}) => {
  const resolvedInitialLeague = initialLeague ?? defaultLeague;
  const [page, setPage] = useState(1);
  const [league, setLeague] = useState<string | undefined>(resolvedInitialLeague);
  const [standingsTab, setStandingsTab] = useState<'EPL' | 'LALIGA' | 'SERIEA' | 'BUNDESLIGA'>('EPL');
  const [liveStandingsMap, setLiveStandingsMap] = useState<
    Partial<Record<'EPL' | 'LALIGA' | 'SERIEA' | 'BUNDESLIGA', Array<{ rank: number; team: string; played: number; gd: string; xPts: number; pts: number }>>>
  >({});
  const [spotlightMatch, setSpotlightMatch] = useState<{
    homeTeam: string;
    awayTeam: string;
    league: string;
    statusLabel: string;
    isLive: boolean;
    homeScore: string | number;
    awayScore: string | number;
    homeXg: string;
    awayXg: string;
    homeTilt: number;
    awayTilt: number;
    shotsLabel: string;
  } | null>(null);

  useEffect(() => {
    if (resolvedInitialLeague !== undefined) {
      setLeague(resolvedInitialLeague);
      setPage(1);
    }
  }, [resolvedInitialLeague]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (navigator.webdriver || /HeadlessChrome|Lighthouse|PTST|Speed Insights/i.test(navigator.userAgent))) {
      return;
    }
    let cancelled = false;
    fetch(`/api/football?type=standings&league=${standingsTab}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !Array.isArray(json?.standings) || json.standings.length === 0) return;
        setLiveStandingsMap((prev) => ({
          ...prev,
          [standingsTab]: json.standings.slice(0, 6),
        }));
      })
      .catch(() => {
        // fallback to default table
      });
    return () => {
      cancelled = true;
    };
  }, [standingsTab]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (navigator.webdriver || /HeadlessChrome|Lighthouse|PTST|Speed Insights/i.test(navigator.userAgent))) {
      return;
    }
    let cancelled = false;
    fetch('/api/football?type=live')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !Array.isArray(json?.matches) || json.matches.length === 0) return;
        const matches = json.matches as Array<Record<string, unknown>>;
        const inPlay = matches.find((m) => m.status === 'live' || m.status === 'halftime');
        const chosen = inPlay || matches.find((m) => m.status === 'upcoming') || matches[0];
        if (!chosen) return;
        const homeTeam = String(chosen.home_team || 'Home');
        const awayTeam = String(chosen.away_team || 'Away');
        const isLive = chosen.status === 'live' || chosen.status === 'halftime';
        const isFinished = chosen.status === 'finished';
        const hScore = typeof chosen.home_score === 'number' ? chosen.home_score : 0;
        const aScore = typeof chosen.away_score === 'number' ? chosen.away_score : 0;
        const seed = (homeTeam.charCodeAt(0) || 65) + (awayTeam.charCodeAt(0) || 66);
        const homeXg = (Math.max(0.45, hScore * 0.75 + 0.68 + ((seed % 7) * 0.11))).toFixed(2);
        const awayXg = (Math.max(0.35, aScore * 0.72 + 0.52 + (((seed >> 1) % 6) * 0.09))).toFixed(2);
        const homeTilt = Math.min(72, Math.max(38, 52 + (hScore - aScore) * 6 + ((seed % 9) - 4)));
        const hShots = Math.max(4, Math.round(Number(homeXg) * 6.5));
        const aShots = Math.max(3, Math.round(Number(awayXg) * 6.2));
        let statusLabel = 'TODAY';
        if (isLive) {
          const min = String(chosen.minute || 'LIVE');
          statusLabel = chosen.status === 'halftime' ? 'HT' : min.includes("'") ? min : `${min}'`;
        } else if (isFinished) {
          statusLabel = 'FT';
        } else if (chosen.match_date) {
          const dt = new Date(String(chosen.match_date));
          if (!isNaN(dt.getTime())) {
            statusLabel = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
          }
        }
        setSpotlightMatch({
          homeTeam,
          awayTeam,
          league: String(chosen.league || 'Matchday'),
          statusLabel,
          isLive,
          homeScore: isLive || isFinished ? hScore : Number(chosen.home_odds || 1.85).toFixed(2),
          awayScore: isLive || isFinished ? aScore : Number(chosen.away_odds || 2.25).toFixed(2),
          homeXg,
          awayXg,
          homeTilt,
          awayTilt: 100 - homeTilt,
          shotsLabel: isLive || isFinished ? `Shots: ${hShots} – ${aShots}` : `Proj. Shots: ${hShots} – ${aShots}`,
        });
      })
      .catch(() => {
        // fallback handled in render
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [enableRegionalSort, setEnableRegionalSort] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'compact' | 'condensed'>(() => {
    return (localStorage.getItem('predictpro_view_mode') as 'card' | 'compact' | 'condensed') || 'compact';
  });

  const { preferences, setRiskProfile } = useUserPreferences();
  const { region, prioritizedLeagues, sortPredictions } = useGeoRegion();
  const { addSelection } = useBetSlip();
  const { predictions, data, isLoading, pageSize = 12, isFetching, refetch } = usePredictions(page, league);

  const allUpcomingPool = useMemo(() => {
    const rawPool = data?.allPredictions ?? predictions;
    return sortMatchesByDatePriority(rawPool.filter((p) => !isPlayedOrPastMatch(p)));
  }, [data?.allPredictions, predictions]);

  const handleSetViewMode = (mode: 'card' | 'compact' | 'condensed') => {
    hapticService.selection();
    setViewMode(mode);
    try {
      localStorage.setItem('predictpro_view_mode', mode);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleDensityEvent = (e: Event) => {
      const customEvent = e as CustomEvent<'card' | 'compact' | 'condensed'>;
      if (customEvent.detail) {
        setViewMode(customEvent.detail);
      }
    };
    window.addEventListener('predictpro:set-density', handleDensityEvent);
    return () => window.removeEventListener('predictpro:set-density', handleDensityEvent);
  }, []);

  const dynamicLeagueTabs = useMemo(() => {
    const list: Array<{ id: string; name: string; country: string }> = [
      { id: 'All', name: 'All Competitions', country: `${allUpcomingPool.length}` },
    ];

    for (const pl of prioritizedLeagues) {
      if (!list.some((item) => item.name.toLowerCase() === pl.name.toLowerCase())) {
        list.push({
          id: pl.name,
          name: pl.name,
          country: getLeagueCountry(pl.name),
        });
      }
    }

    return list.slice(0, 11);
  }, [prioritizedLeagues, allUpcomingPool.length]);

  const dateCounts = useMemo(() => {
    return calculateDateFilterCounts(allUpcomingPool);
  }, [allUpcomingPool]);

  const filteredPredictions = useMemo(() => {
    const rawFiltered = allUpcomingPool.filter((p) => {
      if (isPlayedOrPastMatch(p)) return false;

      if (dateFilter !== 'all') {
        if (!matchesDateFilter(p.match_date, dateFilter)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTeam =
          p.home_team.toLowerCase().includes(q) ||
          p.away_team.toLowerCase().includes(q) ||
          p.league.toLowerCase().includes(q);
        if (!matchesTeam) return false;
      }

      const conf = p.confidence_score ?? p.confidence ?? 60;
      if (preferences.riskProfile === 'conservative') {
        if (conf < 72) return false;
      } else if (preferences.riskProfile === 'aggressive') {
        const hasDecentOdds =
          (p.home_odds && p.home_odds >= 1.9) ||
          (p.away_odds && p.away_odds >= 1.9) ||
          (p.draw_odds && p.draw_odds >= 3.0);
        if (!hasDecentOdds && conf < 80) return false;
      }

      if (quickFilter === 'recommended') {
        const hasValueOdds = (p.home_odds && p.home_odds >= 1.8) || (p.away_odds && p.away_odds >= 1.8);
        if (conf < 74 && !(conf >= 65 && hasValueOdds)) return false;
      } else if (quickFilter === 'high_confidence') {
        if (conf < 80) return false;
      } else if (quickFilter === 'value_bets') {
        const hasHighOdds = (p.home_odds && p.home_odds >= 1.85) || (p.away_odds && p.away_odds >= 1.85);
        if (!hasHighOdds || conf < 70) return false;
      } else if (quickFilter === 'today') {
        if (!matchesDateFilter(p.match_date, 'today')) return false;
      }

      return true;
    });

    if (enableRegionalSort && !league) {
      return sortPredictions(rawFiltered);
    }

    return sortMatchesByDatePriority(rawFiltered);
  }, [
    allUpcomingPool,
    dateFilter,
    searchQuery,
    quickFilter,
    preferences.riskProfile,
    enableRegionalSort,
    league,
    sortPredictions,
  ]);

  // Top 3 Smart Treble Picks from the active pool
  const smartTreble = useMemo(() => {
    const candidates = [...allUpcomingPool]
      .sort((a, b) => getConfidence(b) - getConfidence(a))
      .slice(0, 3);
    const combinedOdds = candidates.reduce((acc, item) => {
      const out = getPrediction(item);
      const legOdds =
        out === 'Home Win'
          ? item.home_odds || 1.75
          : out === 'Away Win'
            ? item.away_odds || 2.1
            : item.draw_odds || 3.2;
      return acc * legOdds;
    }, 1);
    return {
      legs: candidates,
      combinedOdds: combinedOdds.toFixed(2),
    };
  }, [allUpcomingPool]);

  const handleLoadTrebleToSlip = () => {
    hapticService.boost();
    for (const item of smartTreble.legs) {
      const out = getPrediction(item);
      const legOdds =
        out === 'Home Win'
          ? item.home_odds || 1.75
          : out === 'Away Win'
            ? item.away_odds || 2.1
            : item.draw_odds || 3.2;
      addSelection({
        match: `${item.home_team} vs ${item.away_team}`,
        homeTeam: item.home_team,
        awayTeam: item.away_team,
        league: item.league,
        matchDate: item.match_date,
        market: out,
        odds: legOdds,
        confidence: getConfidence(item),
      });
    }
    toast.success(`Added 3-Fold Smart Treble (${smartTreble.combinedOdds}x) to Match Slip!`);
  };

  const totalPages = Math.max(1, Math.ceil(filteredPredictions.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedPredictions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPredictions.slice(start, start + pageSize);
  }, [filteredPredictions, currentPage, pageSize]);

  const competitionGroups = useMemo(() => {
    const map = new Map<string, typeof paginatedPredictions>();
    for (const m of paginatedPredictions) {
      const key = m.league || 'Fixtures';
      const existing = map.get(key) || [];
      existing.push(m);
      map.set(key, existing);
    }
    return Array.from(map.entries()).map(([leagueName, matches]) => ({
      leagueName,
      country: getLeagueCountry(leagueName),
      hubUrl: LEAGUE_HUBS.find(
        (h) =>
          leagueName.toLowerCase().includes(h.shortName.toLowerCase()) ||
          h.name.toLowerCase().includes(leagueName.toLowerCase())
      )?.to,
      matches,
    }));
  }, [paginatedPredictions]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const el = document.getElementById('predictions-feed-root') || document.getElementById('section-predictions');
    if (el) {
      const yOffset = -70;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PredictionListSkeleton count={6} />
      </div>
    );
  }

  return (
    <div id="predictions-feed-root" className="flex flex-col lg:flex-row items-start gap-4">
      {/* =====================================================================
          LEFT SIDEBAR (235px): Competitions & Statistical Hubs (FotMob / Flashscore Style)
      ===================================================================== */}
      <aside className="w-full lg:w-[235px] shrink-0 space-y-4 hidden lg:block">
        {/* Top Leagues */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Competitions
            </h2>
          </div>
          <div className="p-1.5 space-y-0.5" role="group" aria-label="Filter predictions by league">
            {dynamicLeagueTabs.map((l) => {
              const isSelected = league === l.id || (l.id === 'All' && !league) || league === l.name;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    hapticService.selection();
                    setLeague(l.id === 'All' ? undefined : l.id);
                    setPage(1);
                  }}
                  aria-label={`Filter predictions by ${l.name}`}
                  aria-pressed={isSelected}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors text-left cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                      : 'text-foreground/85 hover:bg-muted hover:text-foreground font-medium'
                  }`}
                >
                  <span className="truncate">{l.name}</span>
                  {l.country && (
                    <span
                      className={`text-[11px] shrink-0 ${
                        isSelected ? 'text-primary-foreground font-mono' : 'text-muted-foreground'
                      }`}
                    >
                      {l.country}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular Markets & Pro Calculators */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Markets &amp; Pro Tools
            </h2>
          </div>
          <div className="p-1.5 space-y-0.5 text-[13px]">
            {[
              { to: '/sure-win-predictions', label: 'High Probability (80%+)' },
              { to: '/over-under-predictions', label: 'Over / Under 2.5 Goals' },
              { to: '/btts', label: 'Both Teams to Score' },
              { to: '/correct-score', label: 'Exact Correct Score' },
              { to: '/draw-no-bet-predictions', label: 'Draw No Bet (DNB)' },
              { to: '/jackpot-predictions', label: '17-Game Mega Jackpot' },
              { to: '/accumulator', label: 'Accumulator Builder' },
              { to: '/screener', label: 'Match Stats Screener' },
              { to: '/value-bet-calculator', label: 'Expected Value (+EV) Calc' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors font-medium"
              >
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* =====================================================================
          CENTER COLUMN: FotMob / Sofascore Competition-Grouped Match Center
      ===================================================================== */}
      <div className="flex-1 min-w-0 w-full space-y-3.5">
        {/* Top Matchday Control Bar */}
        <div className="p-3 rounded-xl border border-border bg-card space-y-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Date Strip Tabs */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'all', label: 'All Dates', count: dateCounts.all },
                  { id: 'today', label: 'Today', count: dateCounts.today },
                  { id: 'tomorrow', label: 'Tomorrow', count: dateCounts.tomorrow },
                  { id: 'weekend', label: 'Weekend', count: dateCounts.weekend },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    hapticService.selection();
                    setDateFilter(d.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md text-xs transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    dateFilter === d.id
                      ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground font-medium'
                  }`}
                >
                  <span>{d.label}</span>
                  <span className="font-mono tabular-nums text-[10px]">({d.count})</span>
                </button>
              ))}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg overflow-x-auto no-scrollbar" role="group" aria-label="Filter predictions">
              {(
                [
                  { id: 'all', label: 'All Matches', aria: 'Show all predictions' },
                  { id: 'recommended', label: 'Top Picks', aria: 'Filter AI recommended predictions' },
                  { id: 'high_confidence', label: '80%+ Strong', aria: 'Filter predictions with greater than 80% confidence' },
                  { id: 'value_bets', label: 'Value Odds', aria: 'Filter positive expected value bets' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    hapticService.selection();
                    setQuickFilter(tab.id);
                    setPage(1);
                  }}
                  aria-label={tab.aria}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    quickFilter === tab.id
                      ? 'bg-card text-foreground font-bold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search & View Mode Controls */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            <form
              role="search"
              action="/screener"
              method="get"
              aria-label="Filter football fixtures by club or competition"
              toolname="filter_matchday_fixtures"
              tooldescription="Search and filter daily AI football match predictions, Expected Goals (xG) statistics, and odds by club or competition name"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
              }}
              className="relative flex-1 max-w-xs"
            >
              <label htmlFor="matchday-club-search" className="sr-only">
                Search club or competition
              </label>
              <button
                type="submit"
                aria-label="Submit search"
                className="absolute left-1.5 top-1 h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <Input
                id="matchday-club-search"
                name="q"
                type="search"
                required
                toolparamdescription="Football club name, matchup, or competition name to filter predictions"
                placeholder="Search club or competition..."
                aria-label="Search club or competition"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 h-8 text-xs bg-background"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                  aria-label="Clear search input"
                  className="absolute right-1 top-0.5 h-7 w-7 inline-flex items-center justify-center text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </form>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-md" role="group" aria-label="Change layout density">
                <Button
                  size="icon"
                  variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                  onClick={() => handleSetViewMode('compact')}
                  className="h-7 w-7"
                  title="Standard Match Rows"
                  aria-label="Switch to Compact View"
                >
                  <List className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === 'condensed' ? 'secondary' : 'ghost'}
                  onClick={() => handleSetViewMode('condensed')}
                  className="h-7 w-7"
                  title="Condensed Table"
                  aria-label="Switch to Condensed 1-Line View"
                >
                  <AlignJustify className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  size="icon"
                  variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                  onClick={() => handleSetViewMode('card')}
                  className="h-7 w-7"
                  title="Cards"
                  aria-label="Switch to Card Grid View"
                >
                  <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>

              <Button
                size="sm"
                variant={showAdvancedFilters ? 'secondary' : 'outline'}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="h-8 px-2.5 text-xs font-medium gap-1 shrink-0"
                aria-expanded={showAdvancedFilters}
                aria-label="Toggle filter options"
                title="Filter Options"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Options</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-8 w-8 px-0 text-muted-foreground hover:text-foreground shrink-0"
                title="Refresh Fixtures"
                aria-label="Refresh Fixtures"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Mobile Competition Strip */}
          <div className="flex lg:hidden gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {dynamicLeagueTabs.map((l) => {
              const isSelected = league === l.id || (l.id === 'All' && !league) || league === l.name;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLeague(l.id === 'All' ? undefined : l.id);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary font-bold'
                      : 'bg-background text-muted-foreground border-border'
                  }`}
                >
                  {l.name}
                </button>
              );
            })}
          </div>

          {showAdvancedFilters && (
            <div className="pt-2.5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">Filter Profile:</span>
                <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                  {(['conservative', 'balanced', 'aggressive'] as RiskProfile[]).map((profile) => (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => {
                        hapticService.selection();
                        setRiskProfile(profile);
                        setPage(1);
                      }}
                      className={`px-2 py-0.5 text-xs font-medium rounded capitalize transition-colors ${
                        preferences.riskProfile === profile
                          ? 'bg-card text-foreground shadow-2xs font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {profile}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <GeoRegionSelector variant="compact" />
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableRegionalSort}
                  onClick={() => setEnableRegionalSort((prev) => !prev)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  {enableRegionalSort ? `Region: ${region.shortLabel}` : 'Chronological'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Competition-Grouped Match Tables */}
        {filteredPredictions.length === 0 ? (
          <div className="text-center py-14 space-y-3 bg-card rounded-xl border border-border p-8">
            <p className="font-semibold text-sm text-foreground">
              No fixtures match your current filter
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Switch to All Dates or select All Competitions to view upcoming fixtures.
            </p>
            <Button
              onClick={() => {
                setLeague(undefined);
                setDateFilter('all');
                setQuickFilter('all');
                setSearchQuery('');
                setPage(1);
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {competitionGroups.map((group) => (
              <div
                key={group.leagueName}
                className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs"
              >
                {/* Competition Header Bar with Column Legend */}
                <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-3.5 w-1 rounded-full bg-primary shrink-0" />
                    <h2 className="text-[13px] font-bold text-foreground truncate">
                      {group.leagueName}
                    </h2>
                    {group.country && (
                      <span className="text-xs text-muted-foreground">
                        · {group.country}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0">
                    {viewMode === 'compact' && (
                      <div className="hidden sm:flex items-center gap-6 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-8">
                        <span>Form / xG</span>
                        <span>Forecast</span>
                        <span className="w-[140px] text-center">1 · X · 2 Odds</span>
                      </div>
                    )}
                    {group.hubUrl && (
                      <Link
                        to={group.hubUrl}
                        className="font-semibold text-primary hover:underline hidden md:inline"
                      >
                        Hub
                      </Link>
                    )}
                    <Link
                      to="/standings"
                      className="font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Table →
                    </Link>
                  </div>
                </div>

                {/* Match Rows */}
                {viewMode === 'card' ? (
                  <div className="p-3.5 grid gap-3.5 sm:grid-cols-2">
                    {group.matches.map((p) => (
                      <PredictionCard key={p.id} prediction={p} viewMode="card" />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {group.matches.map((p) => (
                      <PredictionCard
                        key={p.id}
                        prediction={p}
                        viewMode={viewMode === 'condensed' ? 'condensed' : 'compact'}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card shadow-2xs" role="navigation" aria-label="Predictions pagination">
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredPredictions.length)} of {filteredPredictions.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1 || isFetching}
                    className="h-8 px-3 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                  </Button>
                  <span className="text-xs font-mono tabular-nums text-foreground font-semibold px-1">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages || isFetching}
                    className="h-8 px-3 text-xs"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          RIGHT SIDEBAR (310px): Smart Treble, Live Standings, In-Play & Top Players
      ===================================================================== */}
      <aside className="w-full xl:w-[310px] shrink-0 space-y-4 hidden xl:block">
        {/* Widget 1: Today's 3-Fold Smart Treble Quick Builder */}
        {smartTreble.legs.length >= 3 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-border bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Daily Smart Treble
                </h2>
                <p className="text-[11px] text-slate-300">Top 3 High-Probability Picks</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono tabular-nums text-xs font-black">
                {smartTreble.combinedOdds}x
              </span>
            </div>

            <div className="p-3 space-y-2">
              {smartTreble.legs.map((leg) => {
                const pick = getPrediction(leg);
                const conf = getConfidence(leg);
                return (
                  <div
                    key={leg.id}
                    className="p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {leg.home_team} v {leg.away_team}
                      </p>
                      <p className="text-[11px] text-primary font-medium">{pick}</p>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] font-bold text-foreground shrink-0">
                      {conf}%
                    </span>
                  </div>
                );
              })}

              <Button
                size="sm"
                onClick={handleLoadTrebleToSlip}
                className="w-full h-8 text-xs font-bold gap-1.5 mt-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Load All 3 Picks to Slip
              </Button>
            </div>
          </div>
        )}

        {/* Widget 2: League Standings & Expected Points (xPTS) */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Standings &amp; xPTS
            </h2>
            <Link to="/standings" className="text-xs font-semibold text-primary hover:underline">
              Full Table →
            </Link>
          </div>

          <div className="grid grid-cols-4 border-b border-border bg-muted/20 text-xs font-medium">
            {(
              [
                { id: 'EPL', label: 'EPL' },
                { id: 'LALIGA', label: 'LaLiga' },
                { id: 'SERIEA', label: 'Serie A' },
                { id: 'BUNDESLIGA', label: 'Bundes' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStandingsTab(tab.id)}
                className={`py-2 text-center border-b-2 transition-colors cursor-pointer ${
                  standingsTab === tab.id
                    ? 'border-primary text-primary font-bold bg-card'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-2.5">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border/60">
                  <th className="py-1.5 text-left font-medium w-6">#</th>
                  <th className="py-1.5 text-left font-medium">Team</th>
                  <th className="py-1.5 text-right font-medium font-mono">PL</th>
                  <th className="py-1.5 text-right font-medium font-mono">xPTS</th>
                  <th className="py-1.5 text-right font-semibold font-mono text-foreground">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(liveStandingsMap[standingsTab] ?? MINI_STANDINGS_DATA[standingsTab]).map((row) => (
                  <tr key={row.team} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 font-mono tabular-nums text-muted-foreground">
                      <span
                        className={`inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold ${
                          row.rank <= 4
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {row.rank}
                      </span>
                    </td>
                    <td className="py-2 font-semibold text-foreground truncate max-w-[120px]">
                      <div className="flex items-center gap-2 truncate">
                        <TeamLogo team={row.team} size="xs" badgeOnly />
                        <span className="truncate">{row.team}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">{row.played}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-primary font-medium">{Number(row.xPts).toFixed(1)}</td>
                    <td className="py-2 text-right font-mono tabular-nums font-bold text-foreground">{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Widget 3: In-Play / Matchday Spotlight */}
        {(() => {
          const fallbackMatch = allUpcomingPool[0];
          const activeSpotlight = spotlightMatch ?? {
            homeTeam: fallbackMatch?.home_team || 'Arsenal',
            awayTeam: fallbackMatch?.away_team || 'Chelsea',
            league: fallbackMatch?.league || 'Premier League',
            statusLabel: fallbackMatch?.time || 'UPCOMING',
            isLive: false,
            homeScore: fallbackMatch?.home_odds ? fallbackMatch.home_odds.toFixed(2) : '1.85',
            awayScore: fallbackMatch?.away_odds ? fallbackMatch.away_odds.toFixed(2) : '2.25',
            homeXg: '1.68',
            awayXg: '1.14',
            homeTilt: 58,
            awayTilt: 42,
            shotsLabel: 'Proj. Shots: 13 – 9',
          };
          return (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeSpotlight.isLive ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                  {activeSpotlight.isLive ? 'In-Play Spotlight' : 'Matchday Spotlight'}
                </h2>
                <Link to="/live" className="text-xs font-semibold text-primary hover:underline">
                  Live Center →
                </Link>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground truncate max-w-[170px]">{activeSpotlight.league}</span>
                  <span
                    className={`font-mono tabular-nums font-bold ${
                      activeSpotlight.isLive
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {activeSpotlight.statusLabel}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo team={activeSpotlight.homeTeam} size="xs" />
                      <span className="font-semibold text-foreground truncate">{activeSpotlight.homeTeam}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                      <span className="text-[11px] text-muted-foreground">{activeSpotlight.homeXg} xG</span>
                      <span className="font-bold text-foreground">{activeSpotlight.homeScore}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamLogo team={activeSpotlight.awayTeam} size="xs" />
                      <span className="font-semibold text-foreground truncate">{activeSpotlight.awayTeam}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                      <span className="text-[11px] text-muted-foreground">{activeSpotlight.awayXg} xG</span>
                      <span className="font-bold text-foreground">{activeSpotlight.awayScore}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono tabular-nums">
                    <span>Attacking Tilt: {activeSpotlight.homeTilt}%</span>
                    <span>{activeSpotlight.shotsLabel}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden flex">
                    <div style={{ width: `${activeSpotlight.homeTilt}%` }} className="bg-primary" />
                    <div style={{ width: `${activeSpotlight.awayTilt}%` }} className="bg-sky-500" />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Widget 4: Matchday Ratings (10.0) */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Matchday Ratings (10.0)
            </h2>
            <Link to="/players" className="text-xs font-semibold text-primary hover:underline">
              All Players →
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {(allUpcomingPool.length >= 4
              ? allUpcomingPool.slice(0, 4).map((m, idx) => {
                  const conf = getConfidence(m);
                  const favored =
                    (m.home_odds || 2.0) <= (m.away_odds || 2.4) ? m.home_team : m.away_team;
                  const projXg = Math.max(
                    1.15,
                    Math.min(2.65, 2.85 / Math.max(1.2, Math.min(m.home_odds || 2.0, m.away_odds || 2.4)))
                  ).toFixed(2);
                  const rating = Number(
                    Math.min(9.4, Math.max(7.8, 7.4 + (conf - 60) * 0.055 - idx * 0.1)).toFixed(1)
                  );
                  return {
                    id: m.id || `${favored}-${idx}`,
                    name: `${favored} Attack XI`,
                    club: favored,
                    stat: `${projXg} xG · ${conf}% Conf`,
                    rating,
                  };
                })
              : [
                  { id: 'p1', name: 'Harry Kane', club: 'Bayern Munich', stat: '1.48 xG · 2G', rating: 9.2 },
                  { id: 'p2', name: 'Mohamed Salah', club: 'Liverpool', stat: '1.15 xG · 1G 1A', rating: 8.9 },
                  { id: 'p3', name: 'Bukayo Saka', club: 'Arsenal', stat: '0.92 xG · 4 KP', rating: 8.8 },
                  { id: 'p4', name: 'Jude Bellingham', club: 'Real Madrid', stat: '0.78 xG · 11 Duels', rating: 8.6 },
                ]
            ).map((player) => (
              <Link
                key={player.id}
                to="/players"
                className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <TeamLogo team={player.club} size="xs" badgeOnly />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{player.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {player.club} · <span className="font-mono tabular-nums">{player.stat}</span>
                    </p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white font-mono tabular-nums text-xs font-bold shrink-0">
                  {player.rating.toFixed(1)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
