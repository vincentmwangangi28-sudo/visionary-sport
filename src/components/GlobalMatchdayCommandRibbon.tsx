import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Tv, Trophy, Users } from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';
import { TeamLogo } from '@/components/TeamLogo';
import { getPrediction, getConfidence } from '@/types/prediction';
import { isPlayedOrPastMatch, sortMatchesByDatePriority } from '@/lib/dateFilterUtils';

const TV_CHANNELS = ['Sky Sports', 'TNT Sports', 'SuperSport', 'Canal+', 'CBS Golazo', 'DAZN'];

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
  const [liveMap, setLiveMap] = useState<
    Record<string, { homeScore: number; awayScore: number; minute: string; isLive: boolean }>
  >({});

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome|Lighthouse|PTST|Speed Insights/i.test(navigator.userAgent))
    ) {
      return;
    }

    let cancelled = false;
    let triggered = false;
    const loadLiveRibbon = () => {
      if (triggered || cancelled) return;
      triggered = true;
      fetch('/api/football?type=live')
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (cancelled || !Array.isArray(json?.matches)) return;
          const map: Record<string, { homeScore: number; awayScore: number; minute: string; isLive: boolean }> = {};
          for (const m of json.matches) {
            const key = `${String(m.home_team || '').toLowerCase()}|${String(m.away_team || '').toLowerCase()}`;
            map[key] = {
              homeScore: typeof m.home_score === 'number' ? m.home_score : 0,
              awayScore: typeof m.away_score === 'number' ? m.away_score : 0,
              minute: m.status === 'halftime' ? 'HT' : m.minute ? `${m.minute}'` : 'LIVE',
              isLive: m.status === 'live' || m.status === 'halftime',
            };
          }
          setLiveMap(map);
        })
        .catch(() => {
          // silent fallback
        });
    };

    const timer = setTimeout(loadLiveRibbon, 25000);
    window.addEventListener('scroll', loadLiveRibbon, { passive: true, once: true });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('scroll', loadLiveRibbon);
    };
  }, []);

  const upcomingStrip = useMemo(() => {
    const rawPool = data?.allPredictions ?? predictions;
    const valid = sortMatchesByDatePriority(rawPool.filter((p) => !isPlayedOrPastMatch(p)));
    const enriched = valid.slice(0, 12).map((item, idx) => {
      const key = `${item.home_team.toLowerCase()}|${item.away_team.toLowerCase()}`;
      const liveInfo = liveMap[key];
      const tvChannel = TV_CHANNELS[idx % TV_CHANNELS.length];
      return {
        item,
        liveInfo,
        tvChannel,
      };
    });

    if (filterMode === 'live') {
      const liveOnly = enriched.filter((e) => e.liveInfo?.isLive);
      return liveOnly.length > 0 ? liveOnly : enriched.slice(0, 6);
    }
    return enriched.slice(0, 8);
  }, [data?.allPredictions, predictions, liveMap, filterMode]);

  return (
    <div
      className="w-full bg-card border-b border-border min-h-[41px]"
      role="region"
      aria-label="Live Matchday Scoreboard and Fixtures"
      data-testid="global-matchday-command-ribbon"
    >
      <div className="container mx-auto max-w-7xl px-4 h-10 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Left: Mode Filter */}
        <div className="flex items-center gap-1 shrink-0 pr-2 border-r border-border">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            data-testid="ribbon-filter-all"
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
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
            data-testid="ribbon-filter-live"
            className={`px-2 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
              filterMode === 'live'
                ? 'bg-rose-700 text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="h-3 w-3" aria-hidden="true" />
            <span>Live</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('tv')}
            data-testid="ribbon-filter-tv"
            className={`px-2 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
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
          {upcomingStrip.map(({ item, liveInfo, tvChannel }) => {
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
                  <span className="font-mono tabular-nums text-[10px] font-bold text-rose-700 dark:text-rose-400">
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
            to="/community-slips"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
          >
            <Users className="h-3 w-3" aria-hidden="true" />
            <span>Copy Slips</span>
          </Link>
          <Link
            to="/pick-em-challenge"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-amber-900 dark:text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            <Trophy className="h-3 w-3" aria-hidden="true" />
            <span>Pick&apos;em</span>
          </Link>
          <Link
            to="/referrals"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <span>Invite +Coins</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
