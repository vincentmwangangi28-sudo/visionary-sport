import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Activity,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Trophy,
  ShieldAlert,
  Sparkles,
  Send,
  Flame,
  Search,
  Calendar,
  ExternalLink,
  Star,
  Crosshair,
  Tv,
  Play,
  Volume2,
  VolumeX,
  LayoutGrid,
  Columns,
  Check,
  Ticket,
} from 'lucide-react';
import { useFootballData, ApiFootballLiveFixture } from '@/hooks/useFootballData';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useBetSlip } from '@/hooks/useBetSlip';
import { TeamLogo } from '@/components/TeamLogo';
import { LivePitchVisualizer } from '@/components/LivePitchVisualizer';
import { LiveStreamHubModal, WatchableMatchInput } from '@/components/LiveStreamHubModal';
import { LiveParlaySettlementBar } from '@/components/LiveParlaySettlementBar';
import { LiveMomentumRadar } from '@/components/LiveMomentumRadar';
import { InPlayXgMomentumEngine } from '@/components/InPlayXgMomentumEngine';
import { LiveMatchCenterInspector, ComputedLiveStats } from '@/components/LiveMatchCenterInspector';
import { playLiveEventChime } from '@/services/autoSettlementService';
import { getMatchBroadcastInfo } from '@/services/liveBroadcastService';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { evaluateLiveMomentumWithGemini, GeminiLiveMomentumResult } from '@/services/geminiTasksService';
import { useTelegramAlerts } from '@/hooks/useTelegramAlerts';
import {
  speakMatchCommentary,
  stopSpeechCommentary,
  requestGoalPushPermission,
  getGoalPushPermissionState,
  dispatchGoalOrSettlementPush,
} from '@/services/liveCommentaryPushService';
import { Bell, Radio } from 'lucide-react';

const PINNED_STORAGE_KEY = 'predictpro_pinned_live_matches';

interface DateRibbonOption {
  offset: number;
  shortDay: string;
  dateLabel: string;
  isToday: boolean;
}

function buildDateRibbonOptions(): DateRibbonOption[] {
  const now = new Date();
  const offsets = [-2, -1, 0, 1, 2];
  return offsets.map((offset) => {
    const d = new Date(now.getTime() + offset * 86_400_000);
    const shortDay =
      offset === 0
        ? 'TODAY'
        : offset === -1
        ? 'YESTERDAY'
        : offset === 1
        ? 'TOMORROW'
        : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      offset,
      shortDay,
      dateLabel,
      isToday: offset === 0,
    };
  });
}

export default function LiveScores() {
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [statusTab, setStatusTab] = useState<'all' | 'live' | 'watchable' | 'pinned' | 'upcoming' | 'finished'>('all');
  const [dateOffset, setDateOffset] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'split' | 'multiplex'>('split');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});
  const [goalThreatOnly, setGoalThreatOnly] = useState<boolean>(false);
  const [freeStreamOnly, setFreeStreamOnly] = useState<boolean>(false);
  const [watchModalMatch, setWatchModalMatch] = useState<WatchableMatchInput | null>(null);
  const [liveTickSeconds, setLiveTickSeconds] = useState<number>(18);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PINNED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [recentGoalIds, setRecentGoalIds] = useState<Record<string, number>>({});
  const [audioChimeEnabled, setAudioChimeEnabled] = useState<boolean>(true);
  const [voiceCommentaryEnabled, setVoiceCommentaryEnabled] = useState<boolean>(false);
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState<boolean>(() => {
    return getGoalPushPermissionState() === 'granted';
  });

  const dateRibbonOptions = useMemo(() => buildDateRibbonOptions(), []);
  const { regionId, prioritizedLeagues, sortLiveFixtures, getLeagueBadge } = useGeoRegion();
  const { formatKickoff } = useUserPreferences();
  const { addSelection, isInSlip, setIsOpen: setSlipOpen } = useBetSlip();

  const {
    liveFixtures: matches,
    isLiveLoading: loading,
    isLiveFetching,
    refetchLive: refresh,
    isServiceUnavailable,
    serviceUnavailableMessage,
    authErrorStatus,
  } = useFootballData({
    leagueId: selectedLeague === 'all' ? undefined : selectedLeague,
    livePollInterval: 15_000,
  });

  // Real-time 1-second match clock ticker (Sofascore / Flashscore standard)
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTickSeconds((prev) => (prev + 1) % 60);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [inplayMatch, setInplayMatch] = useState<ApiFootballLiveFixture | null>(null);
  const [inplayResult, setInplayResult] = useState<GeminiLiveMomentumResult | null>(null);
  const [loadingInplay, setLoadingInplay] = useState(false);

  const {
    autoAlertsEnabled,
    setAutoAlertsEnabled,
    isSending: sendingTelegramAlert,
    sendLiveScoreAlert,
    autoDispatchLiveScoreChanges,
    chatId: telegramChatId,
  } = useTelegramAlerts({ autoCheckOnMount: true });

  const togglePinMatch = (matchId: string, label?: string) => {
    setPinnedIds((prev) => {
      const exists = prev.includes(matchId);
      const next = exists ? prev.filter((id) => id !== matchId) : [...prev, matchId];
      try {
        localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      if (label) {
        toast.success(exists ? `Removed ${label} from Pinned Watchlist` : `Pinned ${label} to Multi-Match Tracker`);
      }
      return next;
    });
  };

  const handleQuickAddBet = (
    m: ApiFootballLiveFixture,
    marketLabel: string,
    oddsVal: number,
    confVal: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    addSelection({
      id: `${m.id}-${marketLabel}`,
      matchId: String(m.id),
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      match: `${m.home_team} vs ${m.away_team}`,
      league: m.league,
      market: marketLabel,
      selection: marketLabel,
      odds: oddsVal,
      confidence: confVal,
      matchDate: m.match_date,
    });
    toast.success(`Added Live Pick: ${m.home_team} vs ${m.away_team} — ${marketLabel} @ ${oddsVal.toFixed(2)}`, {
      action: {
        label: 'View Slip',
        onClick: () => setSlipOpen(true),
      },
    });
  };

  const handleSendInPlayTelegramAlert = async () => {
    if (!inplayMatch) return;
    const scoreStr =
      inplayMatch.home_score != null && inplayMatch.away_score != null
        ? `${inplayMatch.home_score} - ${inplayMatch.away_score}`
        : '0 - 0';
    const res = await sendLiveScoreAlert({
      id: String(inplayMatch.id),
      homeTeam: inplayMatch.home_team,
      awayTeam: inplayMatch.away_team,
      league: inplayMatch.league,
      homeScore: inplayMatch.home_score ?? 0,
      awayScore: inplayMatch.away_score ?? 0,
      score: scoreStr,
      minute: inplayMatch.minute || inplayMatch.status || 'LIVE',
      eventType: 'LIVE SCORE UPDATE',
      tip: inplayResult ? `${inplayResult.inplay_tip} (${inplayResult.confidence}% Conf)` : inplayMatch.prediction,
      tacticalPulse: inplayResult?.tactical_pulse,
    });
    if (res.success) {
      toast.success(
        res.simulated
          ? `Live score alert formatted for ${telegramChatId} (preview mode)`
          : `Live score alert sent to ${telegramChatId}!`
      );
    } else {
      toast.error(res.error || 'Failed to send Telegram alert');
    }
  };

  const handleOpenInPlayPulse = async (match: ApiFootballLiveFixture) => {
    setInplayMatch(match);
    setInplayResult(null);
    setLoadingInplay(true);

    try {
      const scoreStr =
        match.home_score != null && match.away_score != null
          ? `${match.home_score} - ${match.away_score}`
          : '0 - 0';
      const result = await evaluateLiveMomentumWithGemini({
        match: `${match.home_team} vs ${match.away_team}`,
        minute:
          match.minute ||
          (match.status === 'halftime' ? 'HT' : match.status === 'live' ? 'Live' : 'Upcoming'),
        score: scoreStr,
        league: match.league,
      });
      setInplayResult(result);
    } catch {
      toast.error('Failed to calculate in-play momentum');
    } finally {
      setLoadingInplay(false);
    }
  };

  useEffect(() => {
    if (matches && matches.length > 0) {
      setLastSyncTime(new Date());
      autoDispatchLiveScoreChanges(
        matches
          .filter((m) => m.status === 'live' || m.status === 'halftime' || m.status === 'finished')
          .map((m) => ({
            id: String(m.id),
            homeTeam: m.home_team,
            awayTeam: m.away_team,
            league: m.league,
            homeScore: m.home_score ?? 0,
            awayScore: m.away_score ?? 0,
            minute: m.minute ?? (m.status === 'halftime' ? 'HT' : m.status === 'finished' ? 'FT' : 'LIVE'),
            status: m.status === 'finished' ? 'FT' : m.status === 'halftime' ? 'HT' : 'LIVE',
          }))
      );
    }
  }, [matches, autoDispatchLiveScoreChanges]);

  // Compute live statistics, attack momentum, goal threat index, and real-time match timeline from ESPN feed
  const getMatchStats = React.useCallback(
    (m: ApiFootballLiveFixture): ComputedLiveStats => {
      const idStr = String(m?.id ?? 'match-01');
      const homeScore = m.home_score ?? 0;
      const awayScore = m.away_score ?? 0;
      const realStats = m.match_stats;

      const basePossession = homeScore > awayScore ? 55 : homeScore < awayScore ? 45 : 50;
      const homePossession =
        realStats?.homePossession != null
          ? Math.round(realStats.homePossession)
          : Math.min(68, Math.max(32, basePossession + ((idStr.charCodeAt(0) || 5) % 9) - 4));
      const awayPossession =
        realStats?.awayPossession != null ? Math.round(realStats.awayPossession) : 100 - homePossession;

      const homeShots =
        realStats?.homeShots != null
          ? realStats.homeShots
          : m.status === 'upcoming'
          ? 0
          : Math.max(homeScore * 3, ((idStr.charCodeAt(1) || 7) % 8) + 4);
      const awayShots =
        realStats?.awayShots != null
          ? realStats.awayShots
          : m.status === 'upcoming'
          ? 0
          : Math.max(awayScore * 3, ((idStr.charCodeAt(2) || 3) % 7) + 3);

      const homeOnTarget =
        realStats?.homeOnTarget != null
          ? realStats.homeOnTarget
          : m.status === 'upcoming'
          ? 0
          : Math.max(homeScore, Math.floor(homeShots * 0.45));
      const awayOnTarget =
        realStats?.awayOnTarget != null
          ? realStats.awayOnTarget
          : m.status === 'upcoming'
          ? 0
          : Math.max(awayScore, Math.floor(awayShots * 0.42));

      const homeCorners =
        realStats?.homeCorners != null
          ? realStats.homeCorners
          : m.status === 'upcoming'
          ? 0
          : ((idStr.charCodeAt(0) || 4) % 6) + 2;
      const awayCorners =
        realStats?.awayCorners != null
          ? realStats.awayCorners
          : m.status === 'upcoming'
          ? 0
          : ((idStr.charCodeAt(1) || 3) % 5) + 1;

      const homeXG = Number((homeShots * 0.11 + homeOnTarget * 0.16 + homeScore * 0.32).toFixed(2));
      const awayXG = Number((awayShots * 0.11 + awayOnTarget * 0.16 + awayScore * 0.32).toFixed(2));

      // Calculate probabilities from real sportsbook odds when available
      let homeProb = 45;
      let drawProb = 27;
      let awayProb = 28;
      if (m.home_odds && m.draw_odds && m.away_odds && m.home_odds > 1 && m.away_odds > 1) {
        const invH = 1 / m.home_odds;
        const invD = 1 / m.draw_odds;
        const invA = 1 / m.away_odds;
        const sumInv = invH + invD + invA;
        homeProb = Math.round((invH / sumInv) * 100);
        drawProb = Math.round((invD / sumInv) * 100);
        awayProb = Math.max(5, 100 - homeProb - drawProb);
      } else if (m.confidence) {
        homeProb = Math.min(85, Math.max(40, m.confidence));
        drawProb = 26;
        awayProb = Math.max(10, 100 - homeProb - drawProb);
      }

      const homeMomentum = homePossession > 50 ? Math.min(78, homePossession + 5) : Math.max(22, homePossession - 5);
      const awayMomentum = 100 - homeMomentum;
      const momentumLabel =
        homeMomentum >= 62
          ? `${m.home_team || 'Home'} High Box Pressure`
          : awayMomentum >= 62
          ? `${m.away_team || 'Away'} Counter-Attacking Pressure`
          : 'Balanced Midfield Transition';

      const homeDangerous =
        realStats?.homeShotAssists != null
          ? realStats.homeShotAssists + homeShots * 2
          : Math.floor(homeShots * 3.2);
      const awayDangerous =
        realStats?.awayShotAssists != null
          ? realStats.awayShotAssists + awayShots * 2
          : Math.floor(awayShots * 3.0);

      const totalXG = homeXG + awayXG;
      const totalGoals = homeScore + awayScore;
      const xgSurplus = Math.max(0, totalXG - totalGoals * 0.85);
      const rawThreat = Math.round(52 + xgSurplus * 22 + (Math.max(homeMomentum, awayMomentum) - 50) * 0.6);
      const goalThreatIndex = Math.min(96, Math.max(35, rawThreat));
      const isHighGoalThreat =
        (m.status === 'live' || m.status === 'halftime' || goalThreatOnly) &&
        (goalThreatIndex >= 72 || totalXG >= 1.65);

      const events: ComputedLiveStats['events'] =
        Array.isArray(m.match_events) && m.match_events.length > 0
          ? m.match_events.map((ev) => ({
              minute: ev.minute,
              type: ev.type,
              team: ev.team,
              text: ev.text,
              player: ev.player,
              detailText: ev.detailText,
            }))
          : [];

      return {
        homePossession,
        awayPossession,
        homeShots,
        awayShots,
        homeOnTarget,
        awayOnTarget,
        homeCorners,
        awayCorners,
        homeXG,
        awayXG,
        homeProb,
        drawProb,
        awayProb,
        homeMomentum,
        awayMomentum,
        momentumLabel,
        homeDangerous,
        awayDangerous,
        goalThreatIndex,
        isHighGoalThreat,
        events,
      };
    },
    [goalThreatOnly]
  );

  // Real-Time Goal & Red Card Audio/Toast Alert Engine
  const prevScoresMapRef = React.useRef<Record<string, number>>({});
  const prevRedCardsMapRef = React.useRef<Record<string, number>>({});
  useEffect(() => {
    if (matches && matches.length > 0) {
      const newlyScored: Record<string, number> = {};
      let scoredMatchLabel = '';
      let redCardLabel = '';

      for (const m of matches) {
        const sum = (m.home_score || 0) + (m.away_score || 0);
        const prev = prevScoresMapRef.current[m.id];
        if (prev !== undefined && sum > prev) {
          newlyScored[m.id] = Date.now();
          const latestGoalEv = (m.match_events || [])
            .filter((e) => e.type === 'goal' || e.type === 'penalty' || e.type === 'own_goal')
            .slice(-1)[0];
          scoredMatchLabel = latestGoalEv
            ? `${m.home_team} ${m.home_score ?? 0} - ${m.away_score ?? 0} ${m.away_team} (${latestGoalEv.minute} ${latestGoalEv.player || ''})`
            : `${m.home_team} ${m.home_score ?? 0} - ${m.away_score ?? 0} ${m.away_team}`;
        }
        prevScoresMapRef.current[m.id] = sum;

        const redCount = (m.match_events || []).filter((e) => e.type === 'red_card').length;
        const prevRed = prevRedCardsMapRef.current[m.id];
        if (prevRed !== undefined && redCount > prevRed) {
          const latestRedEv = (m.match_events || []).filter((e) => e.type === 'red_card').slice(-1)[0];
          redCardLabel = `${m.home_team} vs ${m.away_team} (${latestRedEv?.minute || ''} ${latestRedEv?.player || 'Red Card'})`;
        }
        prevRedCardsMapRef.current[m.id] = redCount;
      }

      if (Object.keys(newlyScored).length > 0) {
        setRecentGoalIds((prev) => ({ ...prev, ...newlyScored }));
        if (audioChimeEnabled) {
          playLiveEventChime('goal');
        }
        if (voiceCommentaryEnabled) {
          speakMatchCommentary({
            matchLabel: scoredMatchLabel,
            minute: 'LIVE',
            category: 'goal',
            text: `Goal Alert! ${scoredMatchLabel}`,
          });
        }
        if (pushAlertsEnabled) {
          dispatchGoalOrSettlementPush({
            title: 'PredictPro Live Goal Alert',
            body: scoredMatchLabel,
          });
        }
        toast.success(`GOAL ALERT: ${scoredMatchLabel}`);
      }

      if (redCardLabel) {
        if (audioChimeEnabled) {
          playLiveEventChime('red_card');
        }
        if (voiceCommentaryEnabled) {
          speakMatchCommentary({
            matchLabel: redCardLabel,
            minute: 'LIVE',
            category: 'red_card',
            text: `Red Card Alert! ${redCardLabel}`,
          });
        }
        if (pushAlertsEnabled) {
          dispatchGoalOrSettlementPush({
            title: 'PredictPro Red Card Alert',
            body: redCardLabel,
          });
        }
        toast.error(`RED CARD ALERT: ${redCardLabel}`);
      }
    }
  }, [matches, audioChimeEnabled, voiceCommentaryEnabled, pushAlertsEnabled]);

  // Filter matches based on league, status tab, date offset, goal threat radar, free stream filter, and search query
  const filteredMatches = useMemo(() => {
    let result = matches;

    // Date Ribbon Filter (when user switches to Yesterday / -2d / Tomorrow / +2d)
    const targetDateIso = new Date(Date.now() + dateOffset * 86_400_000).toISOString().slice(0, 10);
    if (dateOffset < 0) {
      const exactDayMatches = result.filter((m) => String(m.match_date || '').slice(0, 10) === targetDateIso);
      if (exactDayMatches.length > 0) {
        result = exactDayMatches;
      } else {
        const finishedOnly = result.filter((m) => m.status === 'finished');
        if (finishedOnly.length > 0) result = finishedOnly;
      }
    } else if (dateOffset > 0) {
      const exactDayMatches = result.filter((m) => String(m.match_date || '').slice(0, 10) === targetDateIso);
      if (exactDayMatches.length > 0) {
        result = exactDayMatches;
      } else {
        const upcomingOnly = result.filter((m) => m.status === 'upcoming');
        if (upcomingOnly.length > 0) result = upcomingOnly;
      }
    }

    // League filter
    if (selectedLeague !== 'all') {
      const selLower = selectedLeague.toLowerCase();
      result = result.filter(
        (m) =>
          String(m.league ?? '').toLowerCase().includes(selLower) ||
          String(m.league_id ?? '') === selectedLeague
      );
    }

    // Status Tab filter
    if (statusTab === 'live') {
      result = result.filter((m) => m.status === 'live' || m.status === 'halftime');
    } else if (statusTab === 'watchable') {
      result = result.filter((m) => {
        const b = getMatchBroadcastInfo({
          matchId: String(m.id ?? ''),
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          league: m.league,
          regionId,
        });
        return b.isAvailableToWatch && (m.status === 'live' || m.status === 'halftime' || m.status === 'upcoming');
      });
    } else if (statusTab === 'pinned') {
      result = result.filter((m) => pinnedIds.includes(m.id));
    } else if (statusTab === 'upcoming') {
      result = result.filter((m) => m.status === 'upcoming');
    } else if (statusTab === 'finished') {
      result = result.filter((m) => m.status === 'finished');
    }

    // Free-to-Air / Free Official Stream filter
    if (freeStreamOnly) {
      result = result.filter((m) => {
        const b = getMatchBroadcastInfo({
          matchId: String(m.id ?? ''),
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          league: m.league,
          regionId,
        });
        return b.hasFreeStream;
      });
    }

    // High Goal Threat Radar filter
    if (goalThreatOnly) {
      result = result.filter((m) => {
        const s = getMatchStats(m);
        return s.goalThreatIndex >= 72 || s.homeXG + s.awayXG >= 1.65;
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          String(m.home_team ?? '').toLowerCase().includes(q) ||
          String(m.away_team ?? '').toLowerCase().includes(q) ||
          String(m.league ?? '').toLowerCase().includes(q)
      );
    }

    return sortLiveFixtures(result);
  }, [
    matches,
    dateOffset,
    selectedLeague,
    statusTab,
    pinnedIds,
    freeStreamOnly,
    goalThreatOnly,
    searchQuery,
    regionId,
    sortLiveFixtures,
    getMatchStats,
  ]);

  // Active Match for the Right-Hand Split-Screen Match Center Inspector
  const activeInspectedMatch = useMemo(() => {
    if (selectedMatchId) {
      const found = filteredMatches.find((m) => String(m.id) === selectedMatchId) || matches.find((m) => String(m.id) === selectedMatchId);
      if (found) return found;
    }
    return filteredMatches.find((m) => m.status === 'live' || m.status === 'halftime') || filteredMatches[0] || matches[0] || null;
  }, [selectedMatchId, filteredMatches, matches]);

  const liveCount = useMemo(
    () => matches.filter((m) => m.status === 'live' || m.status === 'halftime').length,
    [matches]
  );
  const watchableCount = useMemo(
    () => matches.filter((m) => m.status === 'live' || m.status === 'halftime' || m.status === 'upcoming').length,
    [matches]
  );
  const freeStreamCount = useMemo(
    () =>
      matches.filter((m) => {
        const b = getMatchBroadcastInfo({
          matchId: String(m.id),
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          league: m.league,
          regionId,
        });
        return b.hasFreeStream;
      }).length,
    [matches, regionId]
  );
  const pinnedMatchesList = useMemo(
    () => matches.filter((m) => pinnedIds.includes(m.id)),
    [matches, pinnedIds]
  );
  const upcomingCount = useMemo(() => matches.filter((m) => m.status === 'upcoming').length, [matches]);
  const finishedCount = useMemo(() => matches.filter((m) => m.status === 'finished').length, [matches]);
  const highThreatCount = useMemo(
    () =>
      matches.filter((m) => {
        const s = getMatchStats(m);
        return s.goalThreatIndex >= 72 || s.homeXG + s.awayXG >= 1.65;
      }).length,
    [matches, getMatchStats]
  );

  // Group matches by Competition / League (Sofascore & Flashscore standard)
  const groupedMatches = useMemo(() => {
    const groups: Record<string, ApiFootballLiveFixture[]> = {};
    for (const match of filteredMatches) {
      const leagueKey = match.league || 'Other Competitions';
      if (!groups[leagueKey]) {
        groups[leagueKey] = [];
      }
      groups[leagueKey].push(match);
    }
    return groups;
  }, [filteredMatches]);

  const handleOpenWatchModal = (m: ApiFootballLiveFixture) => {
    const s = getMatchStats(m);
    setWatchModalMatch({
      id: String(m.id),
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league,
      homeScore: m.home_score ?? 0,
      awayScore: m.away_score ?? 0,
      minute: m.minute ? `${m.minute}'` : m.status === 'halftime' ? 'HT' : m.status === 'finished' ? 'FT' : 'LIVE',
      status: m.status,
      homeXG: s.homeXG,
      awayXG: s.awayXG,
      homePossession: s.homePossession,
      awayPossession: s.awayPossession,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Live Football Scores & Watch Live Streams: 2D xG | PredictPro"
        description="Watch live football matches via official streams & free-to-air TV channels, plus real-time scores, 2D shot maps, Sofascore player ratings, and 1-click live betting."
        canonical="/live"
        keywords="watch live football today, live football streams, supersport showmax live guide, free to air football today, live football scores today, 2d shot map live, expected goals live"
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 pb-20 max-w-7xl space-y-5" id="main-content">
        {/* Top Header & Sync Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium flex-wrap">
              <span className="text-primary font-semibold">Live Match &amp; Broadcast Directory</span>
              <span aria-hidden="true">·</span>
              <span>2D Tactical xG Pitch &amp; Lineup Ratings</span>
              {liveCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    {liveCount} Live In-Play
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Live Football Scores, 2D Pitch &amp; In-Play Match Center
            </h1>
            <p className="text-xs text-muted-foreground font-mono tabular-nums">
              15s live telemetry sync · {isLiveFetching ? 'Updating live feed...' : `Last synced ${formatKickoff(lastSyncTime, { includeTimezone: true })}`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Split-Screen Inspector vs Goal Zone Multiplex */}
            <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Split-Screen Scoreboard + Match Center Inspector"
              >
                <Columns className="h-3.5 w-3.5" />
                <span>Split Inspector</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('multiplex')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                  viewMode === 'multiplex'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Goal Zone Multiplex 2D Pitch Grid"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Goal Zone Multiplex</span>
              </button>
            </div>

            {/* Free Stream / FTA Filter Toggle */}
            <Button
              variant={freeStreamOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFreeStreamOnly((prev) => !prev)}
              className={`text-xs h-9 gap-1.5 font-semibold ${
                freeStreamOnly ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' : ''
              }`}
              data-testid="free-stream-filter-toggle"
            >
              <Tv className={`h-3.5 w-3.5 ${freeStreamOnly ? 'text-white' : 'text-emerald-500'}`} />
              <span>Free Streams ({freeStreamCount})</span>
            </Button>

            {/* High Goal Threat Radar Toggle */}
            <Button
              variant={goalThreatOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGoalThreatOnly((prev) => !prev)}
              className={`text-xs h-9 gap-1.5 font-semibold ${
                goalThreatOnly ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' : ''
              }`}
              data-testid="goal-threat-radar-toggle"
            >
              <Flame className={`h-3.5 w-3.5 ${goalThreatOnly ? 'text-white' : 'text-orange-500'}`} />
              <span>High xG ({highThreatCount})</span>
            </Button>

            <Button
              variant={audioChimeEnabled ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => {
                const next = !audioChimeEnabled;
                setAudioChimeEnabled(next);
                if (next) playLiveEventChime('goal');
              }}
              className="text-xs h-9 gap-1.5 font-semibold"
              title="Toggle live goal & red card audio chime"
            >
              {audioChimeEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="hidden sm:inline">{audioChimeEnabled ? 'Goal Audio' : 'Muted'}</span>
            </Button>

            <Button
              variant={voiceCommentaryEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const next = !voiceCommentaryEnabled;
                setVoiceCommentaryEnabled(next);
                if (next) {
                  const target = activeInspectedMatch || matches[0];
                  const intro = target
                    ? `Live Radio Commentary active. Currently tracking ${target.home_team} ${target.home_score ?? 0}, ${target.away_team} ${target.away_score ?? 0} in the ${target.league}.`
                    : 'PredictPro Live Radio Commentary is now active for all in-play matches.';
                  speakMatchCommentary(
                    {
                      matchLabel: target ? `${target.home_team} vs ${target.away_team}` : 'Live Slate',
                      minute: 'LIVE',
                      category: 'summary',
                      text: intro,
                    },
                    { forceSpeak: true }
                  );
                  toast.success('Live Voice Play-by-Play Commentary ON');
                } else {
                  stopSpeechCommentary();
                  toast.info('Live Voice Commentary Paused');
                }
              }}
              className={`text-xs h-9 gap-1.5 font-semibold ${
                voiceCommentaryEnabled ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600' : ''
              }`}
              title="Toggle Web Speech API live play-by-play voice commentary"
            >
              <Radio className={`h-3.5 w-3.5 ${voiceCommentaryEnabled ? 'text-white' : 'text-sky-500'}`} />
              <span className="hidden sm:inline">{voiceCommentaryEnabled ? 'Voice Radio ON' : 'Voice Radio'}</span>
            </Button>

            <Button
              variant={pushAlertsEnabled ? 'secondary' : 'outline'}
              size="sm"
              onClick={async () => {
                if (pushAlertsEnabled) {
                  setPushAlertsEnabled(false);
                  toast.info('Browser goal push notifications paused');
                  return;
                }
                const perm = await requestGoalPushPermission();
                if (perm === 'granted') {
                  setPushAlertsEnabled(true);
                  dispatchGoalOrSettlementPush({
                    title: 'PredictPro Goal Push Active',
                    body: 'You will receive instant browser notifications for live goals and red cards.',
                  });
                  toast.success('Browser Goal Push Notifications Enabled');
                } else {
                  setPushAlertsEnabled(true);
                  toast.success('In-App Live Goal & Settlement Alerts Enabled');
                }
              }}
              className="text-xs h-9 gap-1.5 font-semibold"
              title="Enable Browser Push Notifications for live goals"
            >
              <Bell className={`h-3.5 w-3.5 ${pushAlertsEnabled ? 'text-amber-500 fill-amber-500/20' : 'text-muted-foreground'}`} />
              <span className="hidden sm:inline">{pushAlertsEnabled ? 'Push ON' : 'Push Alerts'}</span>
            </Button>

            <div className="flex items-center gap-1.5 px-2.5 h-9 rounded-md border border-border bg-card text-xs font-semibold">
              <Send className="h-3.5 w-3.5 text-sky-500" />
              <span className="hidden sm:inline">Telegram</span>
              <Switch
                checked={autoAlertsEnabled}
                onCheckedChange={(checked) => {
                  setAutoAlertsEnabled(checked);
                  toast.success(
                    checked
                      ? `Live goal & settlement alerts enabled for ${telegramChatId}`
                      : 'Telegram live auto-alerts paused'
                  );
                }}
                aria-label="Toggle Telegram live score alerts"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={loading || isLiveFetching}
              className="text-xs h-9 gap-1.5 font-semibold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading || isLiveFetching ? 'animate-spin text-primary' : ''}`} />
              <span>{isLiveFetching ? 'Syncing...' : 'Sync'}</span>
            </Button>
          </div>
        </div>

        {/* 5-Day Matchday Date Ribbon (Sofascore / Flashscore / FotMob Standard) */}
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl border border-border/80 bg-card/60 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5">
            {dateRibbonOptions.map((item) => {
              const active = dateOffset === item.offset;
              return (
                <button
                  key={item.offset}
                  type="button"
                  onClick={() => {
                    setDateOffset(item.offset);
                    if (item.offset < 0) setStatusTab('finished');
                    else if (item.offset > 0) setStatusTab('upcoming');
                    else setStatusTab('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-primary text-primary-foreground font-black shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 font-semibold'
                  }`}
                >
                  <span>{item.shortDay}</span>
                  <span className={`text-[10px] ${active ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                    {item.dateLabel}
                  </span>
                  {item.isToday && liveCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                        active ? 'bg-rose-600 text-white' : 'bg-rose-500/15 text-rose-500'
                      }`}
                    >
                      {liveCount} LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 pr-2 text-[11px] font-mono text-muted-foreground">
            <Ticket className="h-3.5 w-3.5 text-primary" />
            <span>Click any 1 / X / 2 odds button to add live in-play picks to your Bet Slip</span>
          </div>
        </div>

        {/* Live Parlay & Bet Slip Auto-Settlement Tracker */}
        <LiveParlaySettlementBar matches={matches} />

        {/* Live In-Play Momentum Radar & Late Goal Value Scanner */}
        <LiveMomentumRadar />

        {/* Pinned Multi-Match Watchlist Strip */}
        {pinnedMatchesList.length > 0 && (
          <div
            className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] space-y-2.5"
            data-testid="pinned-watchlist-strip"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>Pinned Watchlist ({pinnedMatchesList.length})</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPinnedIds([]);
                  try {
                    localStorage.removeItem(PINNED_STORAGE_KEY);
                  } catch {
                    // ignore
                  }
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {pinnedMatchesList.map((pm) => {
                const pStats = getMatchStats(pm);
                return (
                  <div
                    key={pm.id}
                    onClick={() => {
                      setSelectedMatchId(String(pm.id));
                      setExpandedId(expandedId === pm.id ? null : pm.id);
                    }}
                    className="p-2.5 rounded-lg border border-border/80 bg-card hover:border-primary/40 transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="truncate">{pm.home_team}</span>
                        <span className="font-mono font-black">{pm.home_score ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="truncate">{pm.away_team}</span>
                        <span className="font-mono font-black">{pm.away_score ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          xG: {pStats.homeXG} - {pStats.awayXG}
                        </span>
                        <span>{pm.minute ? `${pm.minute}'` : String(pm.status ?? 'LIVE').toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Tab Navigation & Search Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border/80 w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setStatusTab('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusTab === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Fixtures ({matches.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('live')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusTab === 'live'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block mr-0.5" />
                Live ({liveCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('watchable')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusTab === 'watchable'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="status-tab-watchable"
              >
                <Tv className="h-3.5 w-3.5" />
                Watch Live ({watchableCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('pinned')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusTab === 'pinned'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="status-tab-pinned"
              >
                <Star className="h-3 w-3 fill-current" />
                Pinned ({pinnedIds.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('upcoming')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusTab === 'upcoming'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Scheduled ({upcomingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusTab('finished')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusTab === 'finished'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Finished ({finishedCount})
              </button>
            </div>

            {/* Live Search Filter */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search club or league..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-9 bg-card"
              />
            </div>
          </div>

          {/* League Horizontal Filter Pill Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <Button
              size="sm"
              variant={selectedLeague === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedLeague('all')}
              className="text-xs h-7 px-2.5 font-medium flex-shrink-0"
            >
              All Leagues
            </Button>
            {prioritizedLeagues.map((lg) => {
              const isSelected = selectedLeague === lg.id || selectedLeague === lg.name;
              return (
                <Button
                  key={lg.id}
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => setSelectedLeague(isSelected ? 'all' : lg.id)}
                  className="text-xs h-7 px-2.5 gap-1.5 font-medium flex-shrink-0"
                >
                  <span>{lg.flag}</span>
                  <span>{lg.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Real-Time Connectivity or Service Status */}
        {isServiceUnavailable && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold">Live Data Provider Notice</p>
                {authErrorStatus && <span className="font-mono text-[10px]">HTTP {authErrorStatus}</span>}
              </div>
              <p className="mt-0.5 text-muted-foreground">{serviceUnavailableMessage}</p>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: GOAL ZONE MULTIPLEX GRID */}
        {viewMode === 'multiplex' && !loading && filteredMatches.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Goal Zone Multiplex — Simultaneous 2D Pitch &amp; xG Feed
                </h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => setViewMode('split')} className="h-8 text-xs font-bold">
                Return to Split Scoreboard
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMatches.slice(0, 6).map((m) => {
                const st = getMatchStats(m);
                return (
                  <LiveMatchCenterInspector
                    key={m.id}
                    match={m}
                    stats={st}
                    liveTickSeconds={liveTickSeconds}
                    isPinned={pinnedIds.includes(m.id)}
                    onTogglePin={() => togglePinMatch(m.id, `${m.home_team} vs ${m.away_team}`)}
                    onOpenWatchModal={() => handleOpenWatchModal(m)}
                    onOpenAiPulse={() => handleOpenInPlayPulse(m)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW MODE 1: SPLIT-SCREEN SCOREBOARD + STICKY MATCH CENTER INSPECTOR */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT 7 COLUMNS: Competition-Grouped Live Scoreboard */}
            <div className="lg:col-span-7 space-y-5">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-8 w-48 rounded-lg" />
                      <div className="h-24 rounded-xl border bg-card/60 animate-pulse" />
                      <div className="h-24 rounded-xl border bg-card/60 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : Object.keys(groupedMatches).length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-border/80 bg-card/40 p-8 space-y-4">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/60" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">No Matches Matching Selected Filter</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      No active games found in this category. Switch to &quot;All Fixtures&quot; or reset filters.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLeague('all');
                        setStatusTab('all');
                        setDateOffset(0);
                        setGoalThreatOnly(false);
                        setFreeStreamOnly(false);
                        setSearchQuery('');
                      }}
                    >
                      Reset Filters
                    </Button>
                    <Link to="/best-bets">
                      <Button size="sm">Today&apos;s High-Consensus Forecasts</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedMatches).map(([leagueName, leagueFixtures]) => {
                    const regionalMeta = getLeagueBadge(leagueName);
                    const isCollapsed = Boolean(collapsedLeagues[leagueName]);

                    return (
                      <div
                        key={leagueName}
                        className="rounded-2xl border border-border/80 bg-card/60 overflow-hidden shadow-xs"
                      >
                        {/* Competition Header (Sofascore / Flashscore Collapsible Bar) */}
                        <div
                          onClick={() =>
                            setCollapsedLeagues((prev) => ({
                              ...prev,
                              [leagueName]: !prev[leagueName],
                            }))
                          }
                          className="px-4 py-2.5 bg-muted/40 border-b border-border/70 flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
                            <h2 className="font-extrabold text-xs sm:text-sm text-foreground truncate">
                              {leagueName}
                            </h2>
                            {regionalMeta.badgeLabel && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold hidden sm:inline">
                                {regionalMeta.badgeLabel}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                              {leagueFixtures.length} {leagueFixtures.length === 1 ? 'match' : 'matches'}
                            </Badge>
                            {isCollapsed ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* League Matches Table */}
                        {!isCollapsed && (
                          <div className="divide-y divide-border/60">
                            {leagueFixtures.map((m) => {
                              const isLive = m.status === 'live' || m.status === 'halftime';
                              const isFinished = m.status === 'finished';
                              const isExpanded = expandedId === m.id;
                              const isInspected = activeInspectedMatch?.id === m.id;
                              const isPinned = pinnedIds.includes(m.id);
                              const hasRecentGoal = Boolean(recentGoalIds[m.id]);
                              const stats = getMatchStats(m);
                              const broadcastInfo = getMatchBroadcastInfo({
                                matchId: String(m.id),
                                homeTeam: m.home_team,
                                awayTeam: m.away_team,
                                league: m.league,
                                regionId,
                              });

                              const parsedMin = parseInt(String(m.minute ?? '').replace(/\D/g, ''), 10) || 58;
                              const liveClockLabel =
                                m.status === 'halftime' || String(m.minute).toUpperCase() === 'HT'
                                  ? 'HT'
                                  : `${parsedMin}:${String((liveTickSeconds + parsedMin) % 60).padStart(2, '0')}'`;

                              const homeRedCards = stats.events.filter(
                                (e) => e.team === 'home' && e.type === 'red_card'
                              ).length;
                              const awayRedCards = stats.events.filter(
                                (e) => e.team === 'away' && e.type === 'red_card'
                              ).length;

                              const hOdds = Number((m.home_odds || 1.85).toFixed(2));
                              const dOdds = Number((m.draw_odds || 3.45).toFixed(2));
                              const aOdds = Number((m.away_odds || 4.10).toFixed(2));
                              const matchTitle = `${m.home_team} vs ${m.away_team}`;

                              return (
                                <div
                                  key={m.id}
                                  onClick={() => setSelectedMatchId(String(m.id))}
                                  className={`p-3 transition-all cursor-pointer ${
                                    hasRecentGoal
                                      ? 'bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/50'
                                      : isInspected
                                      ? 'bg-primary/[0.06] ring-1 ring-inset ring-primary/40'
                                      : isLive
                                      ? 'bg-rose-500/[0.025] hover:bg-rose-500/[0.05]'
                                      : 'hover:bg-muted/30'
                                  }`}
                                >
                                  {/* High-Density Row */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    {/* Left: Pin + Live Ticking Clock + Teams & Scores */}
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          togglePinMatch(m.id, `${m.home_team} vs ${m.away_team}`);
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                                          isPinned
                                            ? 'text-amber-500 bg-amber-500/10'
                                            : 'text-muted-foreground/50 hover:text-amber-500 hover:bg-muted'
                                        }`}
                                        aria-label={isPinned ? `Unpin ${matchTitle}` : `Pin ${matchTitle}`}
                                      >
                                        <Star className={`h-3.5 w-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
                                      </button>

                                      {/* Status / Ticking Clock Column */}
                                      <div className="w-16 shrink-0 text-center">
                                        {isLive ? (
                                          <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-mono font-black tabular-nums w-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                                            {liveClockLabel}
                                          </span>
                                        ) : isFinished ? (
                                          <span className="inline-block px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono font-bold">
                                            FT
                                          </span>
                                        ) : (
                                          <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-semibold">
                                            {formatKickoff(m.match_date)}
                                          </span>
                                        )}
                                      </div>

                                      {/* Teams + Red Card Badges + Live xG + Score */}
                                      <div className="flex-1 min-w-0 space-y-1">
                                        {/* Home Row */}
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <TeamLogo team={m.home_team} logoUrl={m.home_logo} size="xs" />
                                            <span
                                              className={`text-xs sm:text-sm font-bold truncate ${
                                                (m.home_score ?? 0) > (m.away_score ?? 0)
                                                  ? 'text-foreground font-black'
                                                  : 'text-foreground/90'
                                              }`}
                                            >
                                              {m.home_team}
                                            </span>
                                            {homeRedCards > 0 && (
                                              <span
                                                className="px-1 py-0.2 rounded bg-rose-600 text-white text-[9px] font-mono font-black"
                                                title={`${homeRedCards} Red Card`}
                                              >
                                                {homeRedCards}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hidden sm:inline">
                                              {stats.homeXG.toFixed(2)} xG
                                            </span>
                                            <span className="font-mono text-sm font-black px-1 tabular-nums text-foreground">
                                              {m.home_score ?? (isFinished || isLive ? 0 : '-')}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Away Row */}
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <TeamLogo team={m.away_team} logoUrl={m.away_logo} size="xs" />
                                            <span
                                              className={`text-xs sm:text-sm font-bold truncate ${
                                                (m.away_score ?? 0) > (m.home_score ?? 0)
                                                  ? 'text-foreground font-black'
                                                  : 'text-foreground/90'
                                              }`}
                                            >
                                              {m.away_team}
                                            </span>
                                            {awayRedCards > 0 && (
                                              <span
                                                className="px-1 py-0.2 rounded bg-rose-600 text-white text-[9px] font-mono font-black"
                                                title={`${awayRedCards} Red Card`}
                                              >
                                                {awayRedCards}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 hidden sm:inline">
                                              {stats.awayXG.toFixed(2)} xG
                                            </span>
                                            <span className="font-mono text-sm font-black px-1 tabular-nums text-foreground">
                                              {m.away_score ?? (isFinished || isLive ? 0 : '-')}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Inline Sofascore Momentum Micro-Bar + Latest Event */}
                                        <div className="flex items-center gap-2 pt-0.5">
                                          <div className="h-1 w-20 rounded-full bg-muted overflow-hidden flex shrink-0">
                                            <div
                                              style={{ width: `${stats.homeMomentum}%` }}
                                              className="bg-emerald-500"
                                            />
                                            <div
                                              style={{ width: `${stats.awayMomentum}%` }}
                                              className="bg-sky-500"
                                            />
                                          </div>
                                          {stats.events.length > 0 ? (
                                            <span className="text-[10px] text-muted-foreground truncate">
                                              <strong className="font-mono text-foreground">
                                                {stats.events[stats.events.length - 1].minute}
                                              </strong>{' '}
                                              {stats.events[stats.events.length - 1].text}
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-muted-foreground truncate">
                                              {stats.momentumLabel}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Right: 1-Click 1X2 Live Odds + Watch Live + Mobile Expand */}
                                    <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0">
                                      {/* Interactive 1X2 Live Odds Buttons */}
                                      <div className="flex items-center gap-1">
                                        {[
                                          { label: 'Home Win (1)', code: '1', odds: hOdds, conf: stats.homeProb },
                                          { label: 'Draw (X)', code: 'X', odds: dOdds, conf: stats.drawProb },
                                          { label: 'Away Win (2)', code: '2', odds: aOdds, conf: stats.awayProb },
                                        ].map((btn) => {
                                          const inSlip = isInSlip(matchTitle, btn.label);
                                          return (
                                            <button
                                              key={btn.code}
                                              type="button"
                                              onClick={(e) => handleQuickAddBet(m, btn.label, btn.odds, btn.conf, e)}
                                              className={`px-2 py-1 rounded border text-[10px] font-mono tabular-nums transition-all cursor-pointer flex items-center gap-1 ${
                                                inSlip
                                                  ? 'border-primary bg-primary text-primary-foreground font-black'
                                                  : 'border-border/80 bg-background hover:border-primary/50 text-foreground font-bold'
                                              }`}
                                              title={`Add ${matchTitle} — ${btn.label} @ ${btn.odds.toFixed(2)} to Bet Slip`}
                                            >
                                              <span className={inSlip ? 'text-primary-foreground' : 'text-muted-foreground'}>
                                                {inSlip ? <Check className="h-2.5 w-2.5" /> : btn.code}
                                              </span>
                                              <span>{btn.odds.toFixed(2)}</span>
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* Watch Live Button */}
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenWatchModal(m);
                                        }}
                                        className="h-7 text-[11px] px-2 gap-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                        title={`Watch on ${broadcastInfo.primaryBroadcaster.name}`}
                                        data-testid={`watch-live-btn-${m.id}`}
                                      >
                                        <Play className="h-2.5 w-2.5 fill-current" />
                                        <span className="hidden xl:inline">Watch</span>
                                      </Button>

                                      {/* Expand Inline 2D Pitch (Mobile / Quick Toggle) */}
                                      <Button
                                        size="sm"
                                        variant={isExpanded ? 'secondary' : 'outline'}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedMatchId(String(m.id));
                                          setExpandedId(isExpanded ? null : m.id);
                                        }}
                                        className="h-7 text-[11px] px-2 gap-1 font-semibold lg:hidden"
                                      >
                                        <Crosshair className="h-3 w-3 text-emerald-500" />
                                        <span>2D</span>
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Mobile Inline Match Center Inspector when expanded on smaller screens */}
                                  {isExpanded && (
                                    <div
                                      className="mt-3 pt-3 border-t border-border/70 lg:hidden"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <LiveMatchCenterInspector
                                        match={m}
                                        stats={stats}
                                        liveTickSeconds={liveTickSeconds}
                                        isPinned={isPinned}
                                        onTogglePin={() => togglePinMatch(m.id, `${m.home_team} vs ${m.away_team}`)}
                                        onOpenWatchModal={() => handleOpenWatchModal(m)}
                                        onOpenAiPulse={() => handleOpenInPlayPulse(m)}
                                        onClose={() => setExpandedId(null)}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Interactive In-Play xG & Game-State Decay Simulator */}
              <InPlayXgMomentumEngine
                compact
                fixture={
                  activeInspectedMatch
                    ? {
                        homeTeam: activeInspectedMatch.home_team,
                        awayTeam: activeInspectedMatch.away_team,
                        league: activeInspectedMatch.league,
                        initialMinute:
                          Number(String(activeInspectedMatch.minute || '58').replace(/\D/g, '')) || 58,
                        initialHomeGoals: activeInspectedMatch.home_score ?? 1,
                        initialAwayGoals: activeInspectedMatch.away_score ?? 1,
                      }
                    : undefined
                }
              />
            </div>

            {/* RIGHT 5 COLUMNS: Sticky Desktop 5-Tab Match Center Inspector (Sofascore / Flashscore Standard) */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
              {activeInspectedMatch ? (
                <LiveMatchCenterInspector
                  match={activeInspectedMatch}
                  stats={getMatchStats(activeInspectedMatch)}
                  liveTickSeconds={liveTickSeconds}
                  isPinned={pinnedIds.includes(activeInspectedMatch.id)}
                  onTogglePin={() =>
                    togglePinMatch(
                      activeInspectedMatch.id,
                      `${activeInspectedMatch.home_team} vs ${activeInspectedMatch.away_team}`
                    )
                  }
                  onOpenWatchModal={() => handleOpenWatchModal(activeInspectedMatch)}
                  onOpenAiPulse={() => handleOpenInPlayPulse(activeInspectedMatch)}
                />
              ) : (
                <div className="rounded-2xl border border-border/80 bg-card p-6 text-center text-xs text-muted-foreground">
                  Select any live match on the left scoreboard to inspect 2D Pitch, Lineup Ratings, and Live In-Play Markets.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Watch Live Stream, TV Guide & 2D Match Cast Modal */}
        <LiveStreamHubModal
          match={watchModalMatch}
          regionId={regionId}
          onClose={() => setWatchModalMatch(null)}
        />

        {/* Gemini AI In-Play Pulse Dialog */}
        <Dialog open={!!inplayMatch} onOpenChange={(open) => !open && setInplayMatch(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Activity className="h-4 w-4" />
                </span>
                <DialogTitle className="text-base font-bold">
                  {inplayMatch ? `${inplayMatch.home_team} vs ${inplayMatch.away_team}` : 'Live In-Play Analysis'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                {inplayMatch?.league} • Status: {inplayMatch?.minute ? `${inplayMatch.minute}'` : inplayMatch?.status?.toUpperCase()}
                {inplayMatch?.home_score != null && ` • Live Score: ${inplayMatch.home_score} - ${inplayMatch.away_score}`}
              </DialogDescription>
            </DialogHeader>

            {loadingInplay ? (
              <div className="py-8 text-center space-y-3">
                <Sparkles className="h-7 w-7 animate-spin mx-auto text-primary" />
                <p className="text-xs font-semibold text-muted-foreground">
                  Running Gemini In-Play Momentum Radar...
                </p>
                <p className="text-[11px] text-muted-foreground/80 max-w-xs mx-auto">
                  Analyzing match tempo, territorial control, and live expected goal conversion likelihood.
                </p>
              </div>
            ) : inplayResult ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {inplayResult.game_phase}
                    </span>
                    <Badge variant="outline" className="text-[11px] bg-background">
                      Pressure Index: {inplayResult.pressure_index}%
                    </Badge>
                  </div>

                  <div className="bg-background/80 p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Recommended In-Play Call</p>
                      <p className="text-sm font-black text-foreground">{inplayResult.inplay_tip}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Model Confidence</p>
                      <p className="text-sm font-black text-primary">{inplayResult.confidence}%</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {inplayResult.tactical_pulse}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-primary/10">
                    <span>Projected Outcome:</span>
                    <span className="font-bold text-foreground">Score: {inplayResult.projected_final_score}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSendInPlayTelegramAlert}
                    disabled={sendingTelegramAlert}
                    className="flex-1 text-xs font-semibold gap-1.5 bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sendingTelegramAlert ? 'Sending...' : 'Send Alert to Telegram'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold"
                    onClick={() => setInplayMatch(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
