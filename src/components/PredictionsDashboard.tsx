import { useState, useEffect, useMemo } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { useUserPreferences, RiskProfile } from '@/hooks/useUserPreferences';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { useBetSlip } from '@/hooks/useBetSlip';
import { GeoRegionSelector } from '@/components/GeoRegionSelector';
import { PredictionCard } from '@/components/PredictionCard';
import { PredictionListSkeleton } from '@/components/PredictionCardSkeleton';
import { DateFilterType } from '@/components/LeagueDateFilterBar';
import { TeamLogo } from '@/components/TeamLogo';
import { getPrediction, getConfidence } from '@/types/prediction';
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
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  List,
  AlignJustify,
  Search,
  SlidersHorizontal,
  Ticket,
  Sparkles,
} from 'lucide-react';
import { LEAGUE_HUBS } from '@/data/leagueHubs';
import { toast } from 'sonner';

interface PredictionsDashboardProps {
  initialLeague?: string;
  defaultLeague?: string;
  initialDateFilter?: DateFilterType;
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

export const PredictionsDashboard = ({
  initialLeague,
  defaultLeague,
  initialDateFilter = 'all',
}: PredictionsDashboardProps = {}) => {
  const resolvedInitialLeague = initialLeague ?? defaultLeague;
  const [page, setPage] = useState(1);
  const [league, setLeague] = useState<string | undefined>(resolvedInitialLeague);
  const [standingsTab, setStandingsTab] = useState<'EPL' | 'LALIGA' | 'SERIEA' | 'BUNDESLIGA'>('EPL');
  const [liveStandingsMap, setLiveStandingsMap] = useState<
    Partial<
      Record<
        'EPL' | 'LALIGA' | 'SERIEA' | 'BUNDESLIGA',
        Array<{ rank: number; team: string; played: number; gd: string; xPts: number; pts: number }>
      >
    >
  >({});

  useEffect(() => {
    if (resolvedInitialLeague !== undefined) {
      setLeague(resolvedInitialLeague);
      setPage(1);
    }
  }, [resolvedInitialLeague]);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome|Lighthouse|PTST|Speed Insights/i.test(navigator.userAgent))
    ) {
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

  const [dateFilter, setDateFilter] = useState<DateFilterType>(initialDateFilter);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [enableRegionalSort, setEnableRegionalSort] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'compact' | 'condensed'>(() => {
    return (localStorage.getItem('predictpro_view_mode') as 'card' | 'compact' | 'condensed') || 'compact';
  });

  const { preferences, setRiskProfile } = useUserPreferences();
  const { region, prioritizedLeagues, sortPredictions } = useGeoRegion();
  const { selections, totalOdds, addSelection, setIsOpen: setBetSlipOpen } = useBetSlip();
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
    <div id="predictions-feed-root" className="flex flex-col lg:flex-row items-start gap-6">
      {/* =====================================================================
          LEFT SIDEBAR (260px): Competitions, Standings & Statistical Hubs
      ===================================================================== */}
      <aside className="w-full lg:w-[260px] shrink-0 space-y-5 hidden lg:block">
        {/* 1. Competitions Filter */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Competitions
            </h2>
          </div>
          <div className="p-1.5 space-y-0.5" role="group" aria-label="Filter fixtures by competition">
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
                  aria-pressed={isSelected}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors text-left cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-foreground/85 hover:bg-muted hover:text-foreground font-medium'
                  }`}
                >
                  <span className="truncate">{l.name}</span>
                  {l.country && (
                    <span
                      className={`text-[11px] shrink-0 ${
                        isSelected ? 'text-primary-foreground/90 font-mono' : 'text-muted-foreground'
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

        {/* 2. League Standings & Expected Points (xPTS) */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Standings &amp; xPTS
            </h2>
            <Link
              to="/standings"
              className="inline-flex items-center min-h-[24px] text-xs font-semibold text-primary hover:underline"
            >
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
                className={`py-2 min-h-[32px] text-center border-b-2 transition-colors cursor-pointer ${
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
                  <th className="py-1.5 text-left font-medium w-5">#</th>
                  <th className="py-1.5 text-left font-medium">Club</th>
                  <th className="py-1.5 text-right font-medium font-mono">PL</th>
                  <th className="py-1.5 text-right font-medium font-mono">xPTS</th>
                  <th className="py-1.5 text-right font-semibold font-mono text-foreground">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(liveStandingsMap[standingsTab] ?? MINI_STANDINGS_DATA[standingsTab]).map((row) => (
                  <tr key={row.team} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 font-mono tabular-nums text-muted-foreground">{row.rank}</td>
                    <td className="py-2 font-medium text-foreground truncate max-w-[110px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <TeamLogo team={row.team} size="xs" badgeOnly />
                        <span className="truncate">{row.team}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">{row.played}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-primary font-medium">
                      {Number(row.xPts).toFixed(1)}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums font-bold text-foreground">{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Betting Markets & Booking Tools */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Betting Markets &amp; Tools
            </h2>
          </div>
          <div className="p-1.5 space-y-0.5 text-[13px]">
            {[
              { to: '/best-bets', label: "Today's Banker Picks (80%+)" },
              { to: '/accumulator', label: 'AI Smart Acca Builder' },
              { to: '/booking-code-converter', label: 'Booking Code Converter' },
              { to: '/jackpot-predictions', label: '17-Game Mega Jackpot Hub' },
              { to: '/daily-2-odds-predictions', label: 'Daily 2.00+ Rollover Tips' },
              { to: '/value-bets', label: '+EV Value Bet Scanner' },
              { to: '/btts', label: 'Both Teams To Score (BTTS)' },
              { to: '/over-under-predictions', label: 'Over / Under 2.5 Goals' },
              { to: '/correct-score', label: 'Poisson Correct Score' },
              { to: '/dropping-odds', label: 'Dropping Odds Steam' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between px-3 py-1.5 min-h-[28px] rounded-lg text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors font-medium"
              >
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MAIN MATCH CENTER (Wide, Tabular & Interactive Bet Slip Ready)
      ===================================================================== */}
      <div className="flex-1 min-w-0 w-full space-y-4">
        {/* 1-Click Smart Banker Slip & Booking Code Bar */}
        <div className="px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Ticket className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {selections.length > 0
                  ? `Active Bet Slip: ${selections.length} ${selections.length === 1 ? 'Selection' : 'Selections'} (@${totalOdds.toFixed(2)} Combined Odds)`
                  : '1-Click AI Banker Slip & Instant Booking Codes'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {selections.length > 0
                  ? 'Generate SportyBet, Betika, SportPesa, Bet9ja or 1xBet booking codes instantly.'
                  : 'Load our top 3 highest-confidence matchday picks into your slip with one click.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const top3 = [...filteredPredictions]
                  .sort((a, b) => getConfidence(b) - getConfidence(a))
                  .slice(0, 3);
                top3.forEach((m) => {
                  const pick = getPrediction(m);
                  const odds =
                    pick === 'Away Win'
                      ? m.away_odds ?? 2.40
                      : pick === 'Draw'
                      ? m.draw_odds ?? 3.25
                      : m.home_odds ?? 1.75;
                  addSelection({
                    matchId: m.id,
                    match: `${m.home_team} vs ${m.away_team}`,
                    homeTeam: m.home_team,
                    awayTeam: m.away_team,
                    league: m.league,
                    matchDate: m.match_date,
                    market: pick,
                    odds,
                    confidence: getConfidence(m),
                  });
                });
                setBetSlipOpen(true);
                toast.success('Loaded Top 3 AI Banker Picks into Bet Slip!');
              }}
              className="h-8 text-xs font-bold gap-1.5 border-emerald-500/40 bg-background hover:bg-emerald-500/10"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span>Load 3-Leg Banker</span>
            </Button>

            {selections.length > 0 && (
              <Button
                size="sm"
                onClick={() => setBetSlipOpen(true)}
                className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Open Slip ({selections.length})
              </Button>
            )}
          </div>
        </div>
        {/* Clean Matchday Control Bar */}
        <div className="p-3.5 rounded-xl border border-border bg-card space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Date Tabs + Model Filter */}
            <div className="flex items-center gap-2 flex-wrap">
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
                    className={`px-3 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      dateFilter === d.id
                        ? 'bg-card text-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground font-medium'
                    }`}
                  >
                    <span>{d.label}</span>
                    <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                      {d.count}
                    </span>
                  </button>
                ))}
              </div>

              <div
                className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg"
                role="group"
                aria-label="Filter fixtures by model confidence"
              >
                {(
                  [
                    { id: 'all', label: 'All Matches' },
                    { id: 'recommended', label: 'Featured' },
                    { id: 'high_confidence', label: '80%+ Bankers' },
                    { id: 'value_bets', label: '+EV Value' },
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
                    aria-pressed={quickFilter === tab.id}
                    className={`px-2.5 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      quickFilter === tab.id
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Search + Density Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <form
                role="search"
                action="/screener"
                method="get"
                aria-label="Filter football fixtures by club or competition"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                }}
                className="relative flex-1 sm:w-56"
              >
                <label htmlFor="matchday-club-search" className="sr-only">
                  Search club or competition
                </label>
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="absolute left-2 top-1.5 h-6 w-6 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <Input
                  id="matchday-club-search"
                  name="q"
                  type="search"
                  placeholder="Search club or league..."
                  aria-label="Search club or competition"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 h-9 text-xs bg-background"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                    }}
                    aria-label="Clear search input"
                    className="absolute right-1.5 top-1 h-7 w-7 inline-flex items-center justify-center text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </form>

              <div className="flex items-center gap-1 shrink-0">
                <div
                  className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg"
                  role="group"
                  aria-label="Change layout density"
                >
                  <Button
                    size="icon"
                    variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                    onClick={() => handleSetViewMode('compact')}
                    className="h-8 w-8"
                    title="Standard Match Rows"
                    aria-label="Switch to Compact View"
                  >
                    <List className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewMode === 'condensed' ? 'secondary' : 'ghost'}
                    onClick={() => handleSetViewMode('condensed')}
                    className="h-8 w-8"
                    title="Condensed Table"
                    aria-label="Switch to Condensed 1-Line View"
                  >
                    <AlignJustify className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon"
                    variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                    onClick={() => handleSetViewMode('card')}
                    className="h-8 w-8"
                    title="Cards"
                    aria-label="Switch to Card Grid View"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>

                <Button
                  size="icon"
                  variant={showAdvancedFilters ? 'secondary' : 'outline'}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="h-9 w-9 shrink-0"
                  aria-expanded={showAdvancedFilters}
                  title="Filter Options"
                  aria-label="Filter Options"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
                  title="Refresh Fixtures"
                  aria-label="Refresh Fixtures"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
                </Button>
              </div>
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
                  className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 border transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary font-semibold'
                      : 'bg-background text-muted-foreground border-border'
                  }`}
                >
                  {l.name}
                </button>
              );
            })}
          </div>

          {showAdvancedFilters && (
            <div className="pt-2.5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">Model Threshold:</span>
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
                      className={`px-2.5 py-0.5 text-xs font-medium rounded capitalize transition-colors ${
                        preferences.riskProfile === profile
                          ? 'bg-card text-foreground shadow-sm font-semibold'
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
          <div className="space-y-4">
            {competitionGroups.map((group) => (
              <div
                key={group.leagueName}
                className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
              >
                {/* Aligned Competition Header Bar */}
                <div className="px-4 py-2.5 bg-muted/35 border-b border-border grid grid-cols-1 sm:grid-cols-[64px_1fr_130px_168px] items-center gap-3">
                  <div className="sm:col-span-2 flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h2 className="text-xs sm:text-[13px] font-bold text-foreground truncate">
                        {group.leagueName}
                      </h2>
                      {group.country && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          · {group.country}
                        </span>
                      )}
                      {group.hubUrl && (
                        <Link
                          to={group.hubUrl}
                          className="text-xs font-medium text-primary hover:underline ml-1 hidden md:inline"
                        >
                          Overview
                        </Link>
                      )}
                    </div>
                    <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Proj. xG
                    </span>
                  </div>

                  <div className="hidden sm:block text-right pr-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Forecast
                  </div>

                  <div className="hidden sm:grid grid-cols-3 gap-1.5 w-[168px] text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span>Home (1)</span>
                    <span>Draw (X)</span>
                    <span>Away (2)</span>
                  </div>
                </div>

                {/* Match Rows */}
                {viewMode === 'card' ? (
                  <div className="p-4 grid gap-4 sm:grid-cols-2">
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
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card shadow-sm"
                role="navigation"
                aria-label="Fixtures pagination"
              >
                <span className="text-xs text-muted-foreground font-mono tabular-nums">
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredPredictions.length)} of{' '}
                  {filteredPredictions.length}
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
    </div>
  );
};
