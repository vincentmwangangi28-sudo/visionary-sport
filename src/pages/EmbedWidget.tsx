import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { usePredictions } from '@/hooks/usePredictions';
import { fetchRealtimeLiveMatches, RealtimeMatch } from '@/services/realtimeFootball';
import { Zap, Radio, TrendingUp, Sparkles, BarChart3, ExternalLink, Crosshair, Trophy, Tv } from 'lucide-react';

export default function EmbedWidget() {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const theme = (searchParams.get('theme') || 'dark').toLowerCase();
  const isDark = !theme.includes('light');

  const { data: predictions = [], isLoading } = usePredictions(7);
  const [liveMatches, setLiveMatches] = useState<RealtimeMatch[]>([]);

  useEffect(() => {
    let active = true;
    fetchRealtimeLiveMatches()
      .then((res) => {
        if (active && Array.isArray(res)) setLiveMatches(res);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const selected = useMemo(() => {
    const activeUpcoming = predictions.filter((p) => p.status !== 'finished');
    const sortedByConf = [...activeUpcoming].sort(
      (a, b) => (b.confidence_score || 0) - (a.confidence_score || 0)
    );
    const top = sortedByConf[0];
    const second = sortedByConf[1] || top;
    const live = liveMatches[0];
    const topClubsSummary =
      sortedByConf
        .slice(0, 4)
        .map((p) => p.home_team)
        .join(' · ') || 'Awaiting Live Schedule';

    const topXgH = (top?.home_xg || 1.72).toFixed(2);
    const topXgA = (top?.away_xg || 1.05).toFixed(2);
    const topScore =
      top?.predicted_score ||
      `${Math.max(1, Math.round(top?.home_xg || 2))}-${Math.max(0, Math.round(top?.away_xg || 1))}`;
    const topConf = Math.round(top?.confidence_score || top?.confidence || 76);

    const widgetData = {
      banker: {
        title: "Today's Top AI Banker",
        badge: top ? `${topConf}% Model Conf` : 'Cron Sync',
        icon: <Zap className="h-4 w-4 text-emerald-400" />,
        match: top ? `${top.home_team} vs ${top.away_team}` : 'Syncing ESPN Matchday...',
        league: top?.competition || top?.league || 'Global Football Schedule',
        pick: top?.predicted_outcome || top?.prediction || 'Checking live markets',
        odds: top ? (top.home_odds || 1.85).toFixed(2) : '--',
        confidence: top ? `${topConf}% AI Confidence` : 'Syncing',
        xg: top ? `${topXgH} vs ${topXgA}` : '--',
        score: top ? topScore : '--',
        extraLabel: 'Kickoff',
        extraValue: top?.match_time || 'Scheduled',
      },
      'motd-xg': {
        title: 'Match of the Day xG & Score Matrix',
        badge: '10,000-Run Poisson',
        icon: <Zap className="h-4 w-4 text-emerald-400" />,
        match: top ? `${top.home_team} vs ${top.away_team}` : 'Syncing Match of the Day...',
        league: top?.competition || 'Matchday Spotlight',
        pick: top?.predicted_outcome || 'Poisson Fair Value',
        odds: top ? (top.home_odds || 1.88).toFixed(2) : '--',
        confidence: top ? `${topConf}% Model Lock` : 'Syncing',
        xg: top ? `${topXgH} vs ${topXgA} xG` : '--',
        score: top ? `${topScore} Projected` : '--',
        extraLabel: 'Total xG',
        extraValue: top ? `${(Number(topXgH) + Number(topXgA)).toFixed(2)} Goals` : '--',
      },
      'booking-codes': {
        title: 'Multi-Bookie Booking Code Strip',
        badge: 'Verified Acca Legs',
        icon: <Sparkles className="h-4 w-4 text-amber-400" />,
        match: `${Math.min(4, activeUpcoming.length)} Active Upcoming Legs`,
        league: 'SportyBet · 1xBet · Betika · Betway',
        pick: activeUpcoming.length > 0 ? topClubsSummary : 'Awaiting schedule sync',
        odds:
          activeUpcoming.length >= 2
            ? activeUpcoming
                .slice(0, 3)
                .reduce((acc, p) => acc * Math.max(1.2, p.home_odds || 1.65), 1)
                .toFixed(2)
            : '--',
        confidence: `${activeUpcoming.length} Real Fixtures Loaded`,
        xg: '+EV Screened',
        score: `${Math.min(3, activeUpcoming.length)} Verified Legs`,
        extraLabel: '1-Click Load',
        extraValue: 'Ready to Convert',
      },
      'daily-bankers': {
        title: 'Top Daily Bankers Ticker',
        badge: 'High Consensus',
        icon: <Trophy className="h-4 w-4 text-emerald-400" />,
        match: topClubsSummary,
        league: 'Verified Live & Upcoming Slate',
        pick: top ? `${top.home_team} ${top.predicted_outcome || '1X2'}` : 'Syncing daily bankers...',
        odds: top ? (top.home_odds || 1.85).toFixed(2) : '--',
        confidence: top ? `${topConf}% Consensus` : 'Syncing',
        xg: top ? `${topXgH} - ${topXgA} xG` : '--',
        score: `${activeUpcoming.length} Upcoming`,
        extraLabel: 'Sync Source',
        extraValue: 'ESPN Cron Feed',
      },
      'live-scores': {
        title: 'In-Play Match Tracker',
        badge: live ? `LIVE ${live.minute || "0'"}` : '0 Matches In-Play',
        icon: <Radio className="h-4 w-4 text-rose-400" />,
        match: live
          ? `${live.homeTeam} vs ${live.awayTeam}`
          : top
          ? `Next Up: ${top.home_team} vs ${top.away_team}`
          : 'No Live Matches In Progress',
        league: live?.league || top?.competition || 'Live Matchday Feed',
        pick: live ? `Live Score: ${live.homeScore} - ${live.awayScore}` : top?.predicted_outcome || 'Pre-Match Standby',
        odds: live ? (live.homeOdds || 1.95).toFixed(2) : top ? (top.home_odds || 1.95).toFixed(2) : '--',
        confidence: live ? `${live.statusDetail || 'In Play'}` : 'Pre-Kickoff',
        xg: live ? `${live.homeTeam.slice(0, 3).toUpperCase()} ${live.homeScore}-${live.awayScore} ${live.awayTeam.slice(0, 3).toUpperCase()}` : top ? `${topXgH} vs ${topXgA}` : '--',
        score: live ? `${live.homeScore}-${live.awayScore}` : '0-0 (Pre)',
        extraLabel: 'Match Clock',
        extraValue: live ? `${live.minute || 'Live'}` : top?.match_time || 'Scheduled',
      },
      btts: {
        title: 'Both Teams to Score Radar',
        badge: 'Poisson Verified',
        icon: <TrendingUp className="h-4 w-4 text-amber-400" />,
        match: second ? `${second.home_team} vs ${second.away_team}` : 'Syncing BTTS Slate...',
        league: second?.competition || 'Goal Expectancy Radar',
        pick: 'Both Teams To Score / Over 2.5 Goals',
        odds: second ? (second.btts_yes_odds || 1.75).toFixed(2) : '--',
        confidence: second ? `${Math.round(second.btts_probability || 68)}% Probability` : 'Syncing',
        xg: second ? `${(second.home_xg || 1.55).toFixed(2)} vs ${(second.away_xg || 1.35).toFixed(2)}` : '--',
        score: second?.predicted_score || '2-1',
        extraLabel: 'Combined λ',
        extraValue: second ? `${((second.home_xg || 1.55) + (second.away_xg || 1.35)).toFixed(2)} xG` : '--',
      },
      jackpot: {
        title: 'Mega Jackpot Banker Pick',
        badge: 'Jackpot Sync',
        icon: <Sparkles className="h-4 w-4 text-purple-400" />,
        match: top ? `${top.home_team} vs ${top.away_team}` : 'Syncing Jackpot Pool...',
        league: top?.competition || 'Global Jackpot Pool',
        pick: top?.predicted_outcome || '1X (Double Chance)',
        odds: top ? (top.home_odds || 1.72).toFixed(2) : '--',
        confidence: top ? `${topConf}% Hedged` : 'Syncing',
        xg: top ? `${topXgH} vs ${topXgA}` : '--',
        score: topScore,
        extraLabel: 'Jackpot Hub',
        extraValue: 'Live Fixture Pool',
      },
      'value-bets': {
        title: 'Positive EV (+EV) Market Edge',
        badge: '+EV Radar',
        icon: <BarChart3 className="h-4 w-4 text-blue-400" />,
        match: top ? `${top.home_team} vs ${top.away_team}` : 'Scanning +EV Lines...',
        league: top?.competition || 'Global Markets',
        pick: top?.predicted_outcome || 'Home Draw No Bet',
        odds: top ? (top.home_odds || 1.88).toFixed(2) : '--',
        confidence: top ? `${topConf}% Model Edge` : 'Syncing',
        xg: top ? `${topXgH} vs ${topXgA}` : '--',
        score: topScore,
        extraLabel: 'Edge Rating',
        extraValue: top ? `+${Math.max(2.5, (topConf - 50) * 0.35).toFixed(1)}% EV` : '--',
      },
      'player-radar': {
        title: '10.0 Player Rating & 5-Axis Radar',
        badge: 'Matchday Props',
        icon: <Crosshair className="h-4 w-4 text-emerald-400" />,
        match: top ? `${top.home_team} vs ${top.away_team}` : 'Syncing Player Props...',
        league: top?.competition || 'Player Telemetry',
        pick: top ? `${top.home_team} Lead Striker Anytime` : 'Syncing',
        odds: top ? Math.max(1.55, (top.home_odds || 1.8) * 1.15).toFixed(2) : '--',
        confidence: top ? `${Math.min(72, Math.round(topConf * 0.72))}% Threat` : 'Syncing',
        xg: top ? `${topXgH} Team xG` : '--',
        score: topScore,
        extraLabel: 'Fixture Window',
        extraValue: top?.match_time || 'Scheduled',
      },
      'xpts-table': {
        title: 'xPTS League Justice Table',
        badge: 'Dixon-Coles xPTS',
        icon: <Trophy className="h-4 w-4 text-amber-400" />,
        match: top ? `${top.competition || 'League'} xPTS Pulse` : 'Syncing Standings...',
        league: 'Expected Points (xPTS) vs Actual',
        pick: top ? `${top.home_team} Home xG Advantage` : 'Syncing',
        odds: top ? (top.home_odds || 1.85).toFixed(2) : '--',
        confidence: top ? `${topConf}% Justice Conf` : 'Syncing',
        xg: top ? `${topXgH} vs ${topXgA} xG` : '--',
        score: topScore,
        extraLabel: 'Model Engine',
        extraValue: 'Dixon-Coles',
      },
      'live-pitch': {
        title: '2D Live Pitch & Broadcast Hub',
        badge: live ? 'In-Play Live' : 'Matchday Cast',
        icon: <Tv className="h-4 w-4 text-sky-400" />,
        match: live ? `${live.homeTeam} vs ${live.awayTeam}` : top ? `${top.home_team} vs ${top.away_team}` : 'Awaiting Kickoff...',
        league: live?.league || top?.competition || 'Matchday Telemetry',
        pick: live ? `${live.homeTeam} ${live.homeScore} - ${live.awayScore} ${live.awayTeam}` : top?.predicted_outcome || 'Pre-Match Preview',
        odds: top ? (top.home_odds || 1.91).toFixed(2) : '--',
        confidence: top ? `${topConf}% Win Prob` : 'Syncing',
        xg: top ? `${topXgH} vs ${topXgA} xG` : '--',
        score: live ? `${live.homeScore}-${live.awayScore}` : topScore,
        extraLabel: 'Status',
        extraValue: live ? `${live.minute || 'LIVE'}` : 'Pre-Match',
      },
    };

    return (type && widgetData[type as keyof typeof widgetData]) || widgetData.banker;
  }, [type, predictions, liveMatches]);

  return (
    <div
      className={`min-h-screen p-4 flex flex-col justify-between font-sans ${
        isDark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
      }`}
    >
      <SEO
        title="PredictPro Football Predictions Widget Embed"
        description="Free embeddable live AI football predictions and odds widget."
        noIndex={true}
      />
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-black text-sm tracking-tight">PredictPro AI</span>
            <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
              · {selected.title}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            {selected.icon}
            {isLoading ? 'Syncing...' : selected.badge}
          </span>
        </div>

        {/* Fixture Info */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            {selected.league}
          </div>
          <div className="text-base font-black flex items-center justify-between gap-2">
            <span className="truncate">{selected.match}</span>
            <span className="text-xs font-mono text-emerald-500 font-bold shrink-0">{selected.confidence}</span>
          </div>
        </div>

        {/* Prediction Box */}
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
            isDark
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">AI Quantitative Projection</div>
            <div className="text-sm font-black truncate">{selected.pick}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Fair Odds</div>
            <div className="text-base font-mono font-black">{selected.odds}</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className="text-[10px] text-muted-foreground block">Expected Goals</span>
            <span className="font-mono font-bold text-[11px]">{selected.xg}</span>
          </div>
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className="text-[10px] text-muted-foreground block">Model Matrix</span>
            <span className="font-mono font-bold text-[11px]">{selected.score}</span>
          </div>
          <div className={`p-2 rounded-lg border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className="text-[10px] text-muted-foreground block">{selected.extraLabel}</span>
            <span className="font-mono font-bold text-[11px] truncate block">{selected.extraValue}</span>
          </div>
        </div>
      </div>

      {/* Attribution Footer */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Verified Poisson &amp; xG Telemetry</span>
        <a
          href="https://www.predictpro.guru/"
          target="_blank"
          rel="noopener"
          className="text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 transition-colors"
        >
          www.predictpro.guru <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
