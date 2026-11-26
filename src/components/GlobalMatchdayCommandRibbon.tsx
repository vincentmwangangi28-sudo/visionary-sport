import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Tv, Trophy, Users, Radio } from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';
import { TeamLogo } from '@/components/TeamLogo';
import { getPrediction, getConfidence } from '@/types/prediction';
import { isPlayedOrPastMatch, sortMatchesByDatePriority } from '@/lib/dateFilterUtils';

const TV_CHANNELS = ['Sky Sports', 'TNT Sports', 'SuperSport', 'Canal+', 'CBS Golazo', 'DAZN'];

interface LiveRibbonItem {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  homeScore: number;
  awayScore: number;
  minute: string;
  isLive: boolean;
  confidence: number;
  prediction: string;
}

function formatMatchSlug(homeTeam: string, awayTeam: string): string {
  const clean = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  return `${clean(homeTeam)}-vs-${clean(awayTeam)}`;
}

export const GlobalMatchdayCommandRibbon: React.FC = () => {
  const { predictions, data } = usePredictions(1);
  const [filterMode, setFilterMode] = useState<'all' | 'live' | 'tv'>('all');
  const [liveItems, setLiveItems] = useState<LiveRibbonItem[]>([]);
  const [liveMap, setLiveMap] = useState<
    Record<string, { homeScore: number; awayScore: number; minute: string; isLive: boolean }>
  >({});

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return;
    }

    let cancelled = false;
    const loadLiveRibbon = async () => {
      try {
        let json: any = null;
        try {
          const r = await fetch('/api/football?type=live', { headers: { Accept: 'application/json' } });
          if (r.ok && (r.headers.get('content-type') || '').includes('application/json')) {
            json = await r.json();
          }
        } catch {
          // Fall back to direct handler on static hosts
        }
        if (json?.offline || !Array.isArray(json?.matches) || json.matches.length === 0) {
          const { handleFootballRequest } = await import('@/server/footballHandler');
          json = await handleFootballRequest({ type: 'live' });
        }
        if (cancelled || !Array.isArray(json?.matches)) return;
        const map: Record<string, { homeScore: number; awayScore: number; minute: string; isLive: boolean }> = {};
        const fetchedLive: LiveRibbonItem[] = [];
        for (const m of json.matches) {
          const isLive = m.status === 'live' || m.status === 'halftime';
          const minStr = m.status === 'halftime' ? 'HT' : m.minute ? `${m.minute}'` : 'LIVE';
          const key = `${String(m.home_team || '').toLowerCase()}|${String(m.away_team || '').toLowerCase()}`;
          map[key] = {
            homeScore: typeof m.home_score === 'number' ? m.home_score : 0,
            awayScore: typeof m.away_score === 'number' ? m.away_score : 0,
            minute: minStr,
            isLive,
          };
          if (isLive) {
            fetchedLive.push({
              id: String(m.id),
              homeTeam: String(m.home_team),
              awayTeam: String(m.away_team),
              league: String(m.league || 'Football'),
              homeScore: typeof m.home_score === 'number' ? m.home_score : 0,
              awayScore: typeof m.away_score === 'number' ? m.away_score : 0,
              minute: minStr,
              isLive: true,
              confidence: typeof m.confidence === 'number' ? m.confidence : 82,
              prediction: String(m.prediction || 'Home Win'),
            });
          }
        }
        setLiveMap(map);
        setLiveItems(fetchedLive.slice(0, 10));
      } catch {
        // silent fallback
      }
    };

    loadLiveRibbon();

    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingStrip = useMemo(() => {
    const rawPool = data?.allPredictions ?? predictions;
    const valid = sortMatchesByDatePriority(rawPool.filter((p) => !isPlayedOrPastMatch(p)));
    return valid.slice(0, 8).map((item, idx) => {
      const key = `${item.home_team.toLowerCase()}|${item.away_team.toLowerCase()}`;
      const liveInfo = liveMap[key];
      const tvChannel = TV_CHANNELS[idx % TV_CHANNELS.length];
      return {
        item,
        liveInfo,
        tvChannel,
      };
    });
  }, [data?.allPredictions, predictions, liveMap]);

  return (
    <div
      className="w-full bg-card border-b border-border min-h-[41px]"
      role="region"
      aria-label="Live Matchday Scoreboard and Fixtures"
      data-testid="global-matchday-command-ribbon"
    >
      <div className="container mx-auto max-w-7xl px-4 h-10 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Left: Mode Filter */}
        <div
          className="flex items-center gap-1 shrink-0 pr-2 border-r border-border"
          role="group"
          aria-label="Filter matchday ticker mode"
        >
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            aria-pressed={filterMode === 'all'}
            aria-label="Show upcoming fixtures in matchday ticker"
            data-testid="ribbon-filter-all"
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all select-none cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              filterMode === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Fixtures
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('live')}
            aria-pressed={filterMode === 'live'}
            aria-label={`Show ${liveItems.length} live matches in matchday ticker`}
            data-testid="ribbon-filter-live"
            className={`px-2 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition-all select-none cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              filterMode === 'live'
                ? 'bg-rose-700 text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="h-3 w-3" aria-hidden="true" />
            <span>Live ({liveItems.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('tv')}
            aria-pressed={filterMode === 'tv'}
            aria-label="Show TV broadcast channels in matchday ticker"
            data-testid="ribbon-filter-tv"
            className={`px-2 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition-all select-none cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              filterMode === 'tv'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tv className="h-3 w-3" aria-hidden="true" />
            <span>TV</span>
          </button>
        </div>

        {/* Center: Compact Match Ticker */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-1">
          {filterMode === 'live'
            ? liveItems.length === 0 ? (
                <Link
                  to="/live"
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                >
                  No live fixtures in play right now — view Upcoming or 2D Live Center
                </Link>
              ) : liveItems.map((m) => (
                <Link
                  key={m.id}
                  to="/live"
                  className="shrink-0 flex items-center gap-2 px-2.5 py-1 rounded-md border border-rose-500/30 bg-rose-500/[0.04] hover:border-rose-500/60 transition-colors text-xs"
                  title={`${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam} (${m.minute})`}
                >
                  <span className="font-mono tabular-nums text-[10px] font-black text-rose-900 dark:text-rose-200">
                    {m.minute}
                  </span>
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <TeamLogo team={m.homeTeam} size="xs" badgeOnly />
                    <span className="max-w-[75px] truncate font-bold">{m.homeTeam}</span>
                    <span className="font-mono tabular-nums font-black px-1 rounded bg-rose-800 text-white text-[10px]">
                      {m.homeScore}-{m.awayScore}
                    </span>
                    <TeamLogo team={m.awayTeam} size="xs" badgeOnly />
                    <span className="max-w-[75px] truncate font-bold">{m.awayTeam}</span>
                  </div>
                  <span className="font-mono tabular-nums text-[10px] font-bold text-primary">
                    {m.confidence}%
                  </span>
                </Link>
              ))
            : upcomingStrip.map(({ item, liveInfo, tvChannel }) => {
                const conf = getConfidence(item);
                const slug = formatMatchSlug(item.home_team, item.away_team);
                const timeStr = (() => {
                  const d = new Date(item.match_date);
                  if (isNaN(d.getTime())) return '19:45';
                  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                })();

                return (
                  <Link
                    key={item.id}
                    to={`/match/${slug}`}
                    className="shrink-0 flex items-center gap-2 px-2.5 py-1 rounded-md border border-border/70 bg-background hover:border-primary/40 transition-colors text-xs"
                    title={`${item.home_team} vs ${item.away_team} (${getPrediction(item)} - ${conf}%)`}
                  >
                    {liveInfo?.isLive ? (
                      <span className="font-mono tabular-nums text-[10px] font-bold text-rose-900 dark:text-rose-200">
                        {liveInfo.minute}
                      </span>
                    ) : filterMode === 'tv' ? (
                      <span className="font-mono text-[10px] font-semibold text-primary">
                        {tvChannel}
                      </span>
                    ) : (
                      <span className="font-mono tabular-nums text-[10px] text-muted-foreground">
                        {timeStr}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <TeamLogo team={item.home_team} size="xs" badgeOnly />
                      <span className="max-w-[75px] truncate">{item.home_team}</span>
                      {liveInfo?.isLive ? (
                        <span className="font-mono tabular-nums font-bold px-1 rounded bg-muted text-foreground">
                          {liveInfo.homeScore}-{liveInfo.awayScore}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">v</span>
                      )}
                      <TeamLogo team={item.away_team} size="xs" badgeOnly />
                      <span className="max-w-[75px] truncate">{item.away_team}</span>
                    </div>

                    <span className="font-mono tabular-nums text-[10px] font-bold text-primary">
                      {conf}%
                    </span>
                  </Link>
                );
              })}
        </div>

        {/* Right: Essential Quick Links */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0 pl-2 border-l border-border">
          <Link
            to="/live"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold text-rose-900 dark:text-rose-200 hover:bg-rose-500/10 transition-colors"
          >
            <Radio className="h-3 w-3 animate-pulse" aria-hidden="true" />
            <span>2D Live Center</span>
          </Link>
          <Link
            to="/community-slips"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-emerald-950 dark:text-emerald-200 hover:bg-emerald-500/10 transition-colors"
          >
            <Users className="h-3 w-3" aria-hidden="true" />
            <span>Copy Slips</span>
          </Link>
          <Link
            to="/pick-em-challenge"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-amber-950 dark:text-amber-200 hover:bg-amber-500/10 transition-colors"
          >
            <Trophy className="h-3 w-3" aria-hidden="true" />
            <span>Pick&apos;em</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
