import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBetSlip, BetSelection } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useGeoRegion } from '@/hooks/useGeoRegion';
import { useCurrency } from '@/hooks/useCurrency';
import { triggerGuestAccountInvite } from '@/components/GuestAccountPrompt';
import {
  REGIONAL_BOOKMAKERS,
  generateRegionalBookingCode,
  getBookmakerDeepLinkUrl,
  translateMarketForBookmaker,
  generateMatchGameId,
  downloadSlipAsPngImage,
} from '@/services/bookmakerBookingCodes';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  Trash2,
  Share2,
  Copy,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Flame,
  CheckCheck,
  Globe,
  Plus,
  Vibrate,
  Download,
  ArrowLeftRight,
  BookmarkCheck,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Radio,
  Volume2,
  VolumeX,
  ShieldAlert,
} from 'lucide-react';
import { auditBetSlipLegs } from '@/services/topSiteIntelEngine';
import { usePredictions } from '@/hooks/usePredictions';
import { TeamLogo } from '@/components/TeamLogo';
import { ConfidenceMeter } from '@/components/ConfidenceMeter';
import {
  gradeSelectionAgainstFeed,
  fetchOfficialFinishedResults,
} from '@/services/autoSettlementService';
import { normalizeTeamName } from '@/services/predictionStorage';
import {
  triggerFlashscoreSlipAlert,
  isGoalHornAudioEnabled,
  setGoalHornAudioEnabled,
  getFlashscoreAudioVolume,
  setFlashscoreAudioVolume,
  type FlashscoreAlertType,
  type BetSlipAudioEventRecord,
} from '@/services/goalHornAudioService';
import { Prediction } from '@/types/prediction';
import { addTrackedBetEntry } from '@/services/phase11AnalyticsService';
import { toast } from 'sonner';

interface SavedBetSlipRecord {
  id: string;
  createdAt: string;
  bookmakerName: string;
  bookingCode: string;
  currency: string;
  stake: number;
  totalOdds: number;
  potentialReturn: number;
  status: 'PENDING' | 'WON' | 'LOST';
  selections: BetSelection[];
}

const SAVED_SLIPS_STORAGE_KEY = 'predictpro_saved_bet_slips_v1';

export const BetSlipDrawer = () => {
  const {
    selections,
    isOpen,
    setIsOpen,
    slipMode,
    setSlipMode,
    isSafetyCushionActive,
    toggleSafetyCushion,
    stake,
    setStake,
    currency,
    setCurrency,
    addSelection,
    groupIntoWeeklyLongBet,
    removeSelection,
    clearSlip,
    totalOdds,
    bonusMultiplier,
    bonusAmount,
    potentialReturn,
    boostedReturn,
    netProfit,
    combinedConfidence,
    legProgression,
    nextBonusTier,
    getShareableSlipUrl,
    triggerHaptic,
  } = useBetSlip();

  const { user } = useAuth();
  const { formatOdds, t, preferences } = useUserPreferences();
  const { region } = useGeoRegion();
  const { currentConfig, setCurrency: setGlobalCurrency } = useCurrency();
  const [selectedBookmakerId, setSelectedBookmakerId] = useState(preferences.defaultBookmaker || 'sportpesa');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'saved'>('active');
  const [liveAndFinishedFeed, setLiveAndFinishedFeed] = useState<Prediction[]>([]);

  const [savedSlips, setSavedSlips] = useState<SavedBetSlipRecord[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_SLIPS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_SLIPS_STORAGE_KEY, JSON.stringify(savedSlips));
    } catch {
      // ignore storage errors
    }
  }, [savedSlips]);

  // Sync live & finished ESPN scores to grade active selections and saved slips
  useEffect(() => {
    let mounted = true;
    const syncFeed = async () => {
      try {
        const [liveRes, finishedList] = await Promise.all([
          fetch('/api/football?type=live').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetchOfficialFinishedResults().catch(() => [] as Prediction[]),
        ]);
        if (!mounted) return;
        const liveMatches: Prediction[] = Array.isArray(liveRes?.predictions) ? liveRes.predictions : [];
        const combined = [...liveMatches, ...finishedList];
        if (combined.length > 0) {
          setLiveAndFinishedFeed(combined);
        }
      } catch {
        // ignore network hiccup
      }
    };

    syncFeed();
    if (!isOpen) return () => { mounted = false; };
    const timer = setInterval(syncFeed, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [isOpen]);

  // Flashscore-style Web Audio Notification Engine state & live fixture diff monitor
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => isGoalHornAudioEnabled());
  const [audioVolume, setAudioVolume] = useState<number>(() => getFlashscoreAudioVolume());
  const [audioEventLog, setAudioEventLog] = useState<BetSlipAudioEventRecord[]>([]);
  const prevMatchSnapRef = useRef<
    Record<
      string,
      {
        homeScore: number;
        awayScore: number;
        redCards: number;
        varChecks: number;
      }
    >
  >({});

  const handleToggleAudioMute = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    setGoalHornAudioEnabled(next);
    toast.info(
      next
        ? 'Flashscore Audio Engine unmuted for active slip fixtures'
        : 'Flashscore Audio Engine muted'
    );
  };

  const handleAudioVolumeChange = (nextVol: number) => {
    const clamped = Math.max(0.05, Math.min(1, nextVol));
    setAudioVolume(clamped);
    setFlashscoreAudioVolume(clamped);
  };

  const handleTriggerSlipAudioAlert = (type: FlashscoreAlertType) => {
    if (!audioEnabled) {
      setAudioEnabled(true);
      setGoalHornAudioEnabled(true);
    }
    const trackedLeg = selections[0];
    const fixtureLabel = trackedLeg
      ? `${trackedLeg.homeTeam} vs ${trackedLeg.awayTeam}`
      : 'Arsenal vs Real Madrid';
    const graded = trackedLeg
      ? gradeSelectionAgainstFeed(
          { homeTeam: trackedLeg.homeTeam, awayTeam: trackedLeg.awayTeam, market: trackedLeg.market },
          liveAndFinishedFeed
        )
      : null;

    const scoreSummary =
      graded?.homeScore !== null && graded?.homeScore !== undefined && graded?.awayScore !== null && graded?.awayScore !== undefined
        ? `${graded.homeScore} - ${graded.awayScore}`
        : type === 'goal'
        ? '2 - 1'
        : '1 - 1';

    const detailMap: Record<FlashscoreAlertType, string> = {
      goal: `GOAL! ${fixtureLabel} (${scoreSummary})`,
      red_card: `RED CARD! Dismissal in ${fixtureLabel}`,
      var_check: `VAR CHECK in progress — ${fixtureLabel}`,
    };

    const record = triggerFlashscoreSlipAlert(type, {
      fixtureLabel,
      minute: graded?.minute || "68'",
      detail: detailMap[type],
      scoreSummary,
      forceUnmute: true,
    });

    setAudioEventLog((prev) => [record, ...prev].slice(0, 6));
    triggerHaptic([30, 50, 30]);

    if (type === 'goal') {
      toast.success(`⚽ ${detailMap.goal}`, {
        description: `Flashscore stadium bell chime triggered for your tracked bet slip leg.`,
      });
    } else if (type === 'red_card') {
      toast.error(`🟥 ${detailMap.red_card}`, {
        description: `Referee double-whistle & dismissal stinger triggered for your tracked slip leg.`,
      });
    } else {
      toast.warning(`📺 ${detailMap.var_check}`, {
        description: `Broadcast VAR review telemetry tone triggered for your tracked slip leg.`,
      });
    }
  };

  // Monitor live feed diffs for fixtures currently tracked in the active bet slip
  useEffect(() => {
    if (selections.length === 0 || liveAndFinishedFeed.length === 0) return;

    const newRecords: BetSlipAudioEventRecord[] = [];

    for (const sel of selections) {
      const targetHome = normalizeTeamName(sel.homeTeam);
      const targetAway = normalizeTeamName(sel.awayTeam);
      const matched = liveAndFinishedFeed.find((m) => {
        const mh = normalizeTeamName(m.home_team);
        const ma = normalizeTeamName(m.away_team);
        return (mh === targetHome && ma === targetAway) || (mh === targetAway && ma === targetHome);
      });

      if (!matched) continue;

      const key = `${targetHome}__${targetAway}`;
      const homeScore = typeof matched.home_score === 'number' ? matched.home_score : 0;
      const awayScore = typeof matched.away_score === 'number' ? matched.away_score : 0;
      const events = Array.isArray(matched.match_events) ? matched.match_events : [];
      const redCards = events.filter((e) => e.type === 'red-card').length;
      const varChecks = events.filter(
        (e) =>
          String(e.detail || '')
            .toLowerCase()
            .includes('var') ||
          String(e.type || '')
            .toLowerCase()
            .includes('var')
      ).length;

      const prev = prevMatchSnapRef.current[key];
      prevMatchSnapRef.current[key] = {
        homeScore,
        awayScore,
        redCards,
        varChecks,
      };

      if (!prev) continue;

      const fixtureLabel = `${sel.homeTeam} vs ${sel.awayTeam}`;
      const scoreSummary = `${homeScore} - ${awayScore}`;
      const minuteLabel = matched.minute || 'LIVE';

      if (homeScore + awayScore > prev.homeScore + prev.awayScore) {
        const rec = triggerFlashscoreSlipAlert('goal', {
          fixtureLabel,
          minute: minuteLabel,
          detail: `GOAL! ${fixtureLabel} (${scoreSummary})`,
          scoreSummary,
        });
        newRecords.push(rec);
        toast.success(`⚽ GOAL! ${fixtureLabel} (${scoreSummary})`, {
          description: `Tracked bet slip leg updated at ${minuteLabel}`,
        });
      }

      if (redCards > prev.redCards) {
        const rec = triggerFlashscoreSlipAlert('red_card', {
          fixtureLabel,
          minute: minuteLabel,
          detail: `RED CARD! ${fixtureLabel} (${scoreSummary})`,
          scoreSummary,
        });
        newRecords.push(rec);
        toast.error(`🟥 RED CARD! ${fixtureLabel}`, {
          description: `Booking alert on tracked bet slip fixture (${minuteLabel})`,
        });
      }

      if (varChecks > prev.varChecks) {
        const rec = triggerFlashscoreSlipAlert('var_check', {
          fixtureLabel,
          minute: minuteLabel,
          detail: `VAR CHECK — ${fixtureLabel} (${scoreSummary})`,
          scoreSummary,
        });
        newRecords.push(rec);
        toast.warning(`📺 VAR CHECK — ${fixtureLabel}`, {
          description: `Video Assistant Referee review in progress (${minuteLabel})`,
        });
      }
    }

    if (newRecords.length > 0) {
      setAudioEventLog((prev) => [...newRecords, ...prev].slice(0, 6));
    }
  }, [liveAndFinishedFeed, selections]);

  // Auto-settle any PENDING saved slip when its legs have finished in the ESPN feed
  useEffect(() => {
    if (liveAndFinishedFeed.length === 0 || savedSlips.length === 0) return;
    let changed = false;
    const nextSlips = savedSlips.map((slip) => {
      if (slip.status !== 'PENDING' || slip.selections.length === 0) return slip;
      const gradedLegs = slip.selections.map((leg) =>
        gradeSelectionAgainstFeed(
          { homeTeam: leg.homeTeam, awayTeam: leg.awayTeam, market: leg.market },
          liveAndFinishedFeed
        )
      );
      const anyLost = gradedLegs.some((g) => g.status === 'Lost' || g.outcome === 'LOST');
      const allWon =
        gradedLegs.length > 0 &&
        gradedLegs.every((g) => g.status === 'Won' || g.outcome === 'WON');

      if (anyLost) {
        changed = true;
        return { ...slip, status: 'LOST' as const };
      }
      if (allWon) {
        changed = true;
        return { ...slip, status: 'WON' as const };
      }
      return slip;
    });

    if (changed) {
      setSavedSlips(nextSlips);
    }
  }, [liveAndFinishedFeed, savedSlips]);

  // Dynamically prioritize bookmakers matching the user's active geographic region
  const sortedBookmakers = useMemo(() => {
    return [...REGIONAL_BOOKMAKERS].sort((a, b) => {
      const aLocal = a.countryCodes?.includes(region.id) ? 1 : 0;
      const bLocal = b.countryCodes?.includes(region.id) ? 1 : 0;
      if (aLocal !== bLocal) return bLocal - aLocal;
      return 0;
    });
  }, [region.id]);

  const activeBookmaker =
    sortedBookmakers.find((b) => b.id === selectedBookmakerId) || sortedBookmakers[0];

  const { predictions } = usePredictions(1);

  // AI Recommended Next Leg Enhancer to boost the existing accumulator
  const recommendedEnhancer = useMemo(() => {
    if (selections.length === 0 || selections.length >= 15 || predictions.length === 0) return null;
    const existingTeams = new Set(
      selections.flatMap((s) => [s.homeTeam.toLowerCase(), s.awayTeam.toLowerCase()])
    );
    const candidate = predictions.find(
      (p) =>
        !existingTeams.has(p.home_team.toLowerCase()) &&
        !existingTeams.has(p.away_team.toLowerCase()) &&
        (p.confidence_score ?? p.confidence ?? 60) >= 70
    );
    if (!candidate) return null;
    const odds = candidate.home_odds ?? 1.85;
    const outcome = candidate.predicted_outcome || candidate.prediction || 'Home Win';
    const conf = candidate.confidence_score ?? candidate.confidence ?? 70;
    const newTotalOdds = totalOdds * odds;
    const boostPercent = Math.round(((newTotalOdds - totalOdds) / (totalOdds || 1)) * 100);

    return {
      prediction: candidate,
      market: outcome,
      odds,
      confidence: conf,
      newTotalOdds,
      boostPercent,
    };
  }, [selections, predictions, totalOdds]);

  const slipAudit = useMemo(
    () => auditBetSlipLegs(selections, stake || 100),
    [selections, stake]
  );

  // Helper to top-up and group multiple predictions into a single 'Weekly Long Bet' accumulation slip
  const handleGroupAndTopUpWeeklyLongBet = (targetCount: number) => {
    const needed = Math.max(0, targetCount - selections.length);
    if (needed === 0) {
      groupIntoWeeklyLongBet();
      return;
    }

    const existingKeys = new Set(
      selections.map((s) => `${s.homeTeam.toLowerCase()}|${s.awayTeam.toLowerCase()}`)
    );

    const candidates = [...predictions]
      .sort(
        (a, b) =>
          (b.confidence_score ?? b.confidence ?? 70) - (a.confidence_score ?? a.confidence ?? 70)
      )
      .filter((p) => !existingKeys.has(`${p.home_team.toLowerCase()}|${p.away_team.toLowerCase()}`))
      .slice(0, needed)
      .map((p) => {
        const outcome = p.predicted_outcome || p.prediction || 'Home Win';
        const odds =
          outcome === 'Away Win'
            ? p.away_odds ?? 2.25
            : outcome === 'Draw'
              ? p.draw_odds ?? 3.20
              : p.home_odds ?? 1.62;
        return {
          matchId: p.id,
          match: `${p.home_team} vs ${p.away_team}`,
          homeTeam: p.home_team,
          awayTeam: p.away_team,
          league: p.league,
          matchDate: p.match_date,
          market: outcome,
          odds,
          confidence: p.confidence_score ?? p.confidence ?? 78,
        };
      });

    groupIntoWeeklyLongBet(candidates);
  };

  // AI Recommended Stake based on fractional Kelly Criterion & currency tier
  const aiRecommendedStake = useMemo(() => {
    const p = Math.max(0.05, Math.min(0.95, combinedConfidence / 100));
    const b = Math.max(0.1, totalOdds - 1);
    const kelly = Math.max(0.02, Math.min(0.15, (p * (b + 1) - 1) / b));
    const isMajorCurrency = ['USD', 'EUR', 'GBP'].includes(currency);
    const baseBankroll = isMajorCurrency ? 100 : 5000;
    const rec = Math.round((baseBankroll * (kelly * 0.4)) / 10) * 10;
    return isMajorCurrency ? Math.max(5, Math.round(baseBankroll * (kelly * 0.25))) : Math.max(50, rec);
  }, [combinedConfidence, totalOdds, currency]);

  const handleGenerateCode = (bookieId: string) => {
    triggerHaptic('betConfirmation');
    setSelectedBookmakerId(bookieId);
    const bookie = REGIONAL_BOOKMAKERS.find((b) => b.id === bookieId) || REGIONAL_BOOKMAKERS[0];
    const code = generateRegionalBookingCode(bookieId, selections.length);
    setGeneratedCode(code);
    toast.success(`Generated ${bookie.name} booking code: ${code}`);
  };

  const handleCopyCode = (code: string) => {
    triggerHaptic('selection');
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Copied code ${code} to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCurrentSlip = () => {
    if (selections.length === 0) return;
    triggerHaptic('betConfirmation');
    const code = generatedCode || generateRegionalBookingCode(activeBookmaker.id, selections.length);
    setGeneratedCode(code);
    const finalReturn = bonusMultiplier > 0 ? boostedReturn : potentialReturn;
    const newRecord: SavedBetSlipRecord = {
      id: `slip-${Date.now()}`,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      bookmakerName: activeBookmaker.name,
      bookingCode: code,
      currency,
      stake: stake || 100,
      totalOdds,
      potentialReturn: finalReturn,
      status: 'PENDING',
      selections: [...selections],
    };
    setSavedSlips((prev) => [newRecord, ...prev.slice(0, 29)]);
    selections.forEach((sel) => {
      addTrackedBetEntry({
        fixture: `${sel.homeTeam} vs ${sel.awayTeam}`,
        homeTeam: sel.homeTeam,
        awayTeam: sel.awayTeam,
        league: sel.league || 'Football',
        market: sel.market,
        odds: sel.odds,
        stake: Math.max(5, Math.round((stake || 100) / selections.length)),
        bookmaker: activeBookmaker.name,
        status: 'PENDING',
        clvEdgePct: 7.5,
        notes: `Saved from Bet Slip (${code})`,
      });
    });
    setActiveTab('saved');
    toast.success(`Saved ${selections.length}-leg slip (${code}) to Personal ROI Tracker!`);
  };

  const handleUpdateSavedStatus = (id: string, status: SavedBetSlipRecord['status']) => {
    triggerHaptic('selection');
    setSavedSlips((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    toast.success(`Marked slip as ${status}!`);
  };

  const handleDeleteSavedSlip = (id: string) => {
    setSavedSlips((prev) => prev.filter((s) => s.id !== id));
    toast.info('Removed saved slip from tracker.');
  };

  const handleReloadSavedSlip = (slip: SavedBetSlipRecord) => {
    clearSlip();
    slip.selections.forEach((sel) => {
      addSelection({
        matchId: sel.matchId,
        match: sel.match,
        homeTeam: sel.homeTeam,
        awayTeam: sel.awayTeam,
        league: sel.league,
        matchDate: sel.matchDate,
        market: sel.market,
        odds: sel.odds,
        confidence: sel.confidence,
      });
    });
    setActiveTab('active');
    toast.success(`Reloaded ${slip.selections.length} selections (${slip.bookingCode}) into active slip!`);
  };

  // Personal ROI Statistics across settled saved slips
  const roiStats = useMemo(() => {
    const settled = savedSlips.filter((s) => s.status === 'WON' || s.status === 'LOST');
    const won = settled.filter((s) => s.status === 'WON');
    const totalStaked = settled.reduce((acc, s) => acc + s.stake, 0);
    const totalReturned = won.reduce((acc, s) => acc + s.potentialReturn, 0);
    const netProfit = totalReturned - totalStaked;
    const winRate = settled.length > 0 ? Math.round((won.length / settled.length) * 100) : 0;
    const roiPct = totalStaked > 0 ? Math.round((netProfit / totalStaked) * 100) : 0;
    return {
      settledCount: settled.length,
      wonCount: won.length,
      totalStaked,
      netProfit,
      winRate,
      roiPct,
    };
  }, [savedSlips]);

  const shareableSlipUrl = useMemo(
    () => getShareableSlipUrl(selections, activeBookmaker?.name, generatedCode || undefined),
    [getShareableSlipUrl, selections, activeBookmaker?.name, generatedCode]
  );

  const formattedSlipShareText = useMemo(() => {
    return (
      `⚽ PredictPro AI Bet Slip (${selections.length} Picks)\n\n` +
      selections
        .map(
          (s, idx) =>
            `${idx + 1}. ${s.homeTeam} vs ${s.awayTeam} — ${s.market} @ ${formatOdds(s.odds)} (${s.confidence}% AI)`
        )
        .join('\n') +
      `\n\n📊 Combined Odds: ${formatOdds(totalOdds)}\n` +
      (bonusMultiplier > 0 ? `🎁 Acca Bonus: +${(bonusMultiplier * 100).toFixed(0)}%\n` : '') +
      `🎯 Combined Confidence: ${combinedConfidence}%\n` +
      (generatedCode ? `🎟️ Booking Code (${activeBookmaker.name}): ${generatedCode}\n` : '') +
      `\n👇 Click to auto-load this slip into your Bet Slip:\n${shareableSlipUrl}`
    );
  }, [selections, formatOdds, totalOdds, bonusMultiplier, combinedConfidence, generatedCode, activeBookmaker?.name, shareableSlipUrl]);

  const handleShareSlip = async () => {
    triggerHaptic('success');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PredictPro AI Bet Slip',
          text: formattedSlipShareText,
          url: shareableSlipUrl,
        });
      } catch {
        // user cancelled or fallback
      }
    } else {
      navigator.clipboard.writeText(formattedSlipShareText);
      toast.success('Copied slip & auto-load link to clipboard!');
    }
  };

  return (
    <>
      {/* Floating Trigger Button if selections exist and sheet is closed */}
      {(selections.length > 0 || savedSlips.length > 0) && !isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setIsOpen(true);
            }}
            aria-haspopup="dialog"
            aria-label={`Open Acca Bet Slip with ${selections.length} selections, total odds ${totalOdds.toFixed(2)}`}
            className="h-13 px-4 py-3 bg-primary text-primary-foreground shadow-2xl rounded-full flex items-center gap-3 border-2 border-primary-foreground/20 active:scale-[0.98] transition-all group cursor-pointer"
          >
            <div className="relative">
              <Ticket className="h-5 w-5 group-hover:rotate-12 transition-transform" aria-hidden="true" />
              <span className="absolute -top-2 -right-2 h-5 w-5 bg-amber-500 text-slate-950 font-black text-xs rounded-full flex items-center justify-center border-2 border-primary" aria-hidden="true">
                {selections.length || savedSlips.length}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold leading-tight">
                {selections.length > 0 ? 'Acca Bet Slip' : 'Saved Slips Tracker'}
              </p>
              <p className="text-xs opacity-90 font-medium">
                {selections.length > 0 ? `Odds: ${totalOdds.toFixed(2)}` : `${savedSlips.length} Tracked`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 ml-1 opacity-70 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Button>
        </div>
      )}

      {/* Bet Slip Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full overflow-hidden">
          <SheetHeader className="p-4 pb-3 border-b bg-card space-y-2.5">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <Ticket className="h-5 w-5 text-primary" />
                <span>Smart Bet Slip &amp; ROI</span>
              </SheetTitle>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    toast.info('Mobile haptic tactile response is active');
                  }}
                  title="Mobile Haptic Tactile Response Active"
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md active:scale-90"
                  aria-label="Mobile Haptic Feedback Active"
                >
                  <Vibrate className="h-4 w-4" />
                </button>
                {activeTab === 'active' && selections.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSlip}
                    className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </Button>
                )}
              </div>
            </div>

            {/* 2-Tab Switcher: Active Slip vs Saved Slips ROI Tracker */}
            <div
              className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg"
              role="tablist"
              aria-label="Bet Slip Views"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'active'}
                onClick={() => setActiveTab('active')}
                className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  activeTab === 'active'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {slipMode === 'weekly_long_bet' ? 'Weekly Long Bet' : 'Active Slip'} ({selections.length})
                </span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'saved'}
                onClick={() => setActiveTab('saved')}
                className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 select-none cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  activeTab === 'saved'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <History className="h-3.5 w-3.5" aria-hidden="true" />
                <span>My Saved Slips ({savedSlips.length})</span>
              </button>
            </div>

            {/* Accumulation Mode Switcher: Standard Multi-Bet vs Weekly Long Bet Accumulation Slip */}
            {activeTab === 'active' && (
              <div className="pt-1 flex items-center justify-between gap-2 text-xs">
                <div className="inline-flex rounded-md border border-border bg-muted/50 p-0.5 flex-1">
                  <button
                    type="button"
                    onClick={() => setSlipMode('standard')}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      slipMode === 'standard'
                        ? 'bg-card text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Standard Acca (3–5 Games)
                  </button>
                  <button
                    type="button"
                    onClick={() => groupIntoWeeklyLongBet()}
                    className={`flex-1 py-1 px-2 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                      slipMode === 'weekly_long_bet'
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Weekly Long Bet Slip
                  </button>
                </div>

                {selections.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSafetyCushion}
                    className={`px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                      isSafetyCushionActive
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                    title="Convert legs to Double Chance (1X/X2) & Over 1.5 Goals for safer Weekly Long Bet accumulation"
                  >
                    {isSafetyCushionActive ? '1X Cushion: ON' : '1X Cushion: OFF'}
                  </button>
                )}
              </div>
            )}
          </SheetHeader>

          {activeTab === 'saved' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Personal ROI Summary Header */}
              <div className="p-3.5 border-b bg-muted/30 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-background border border-border">
                  <span className="text-[10px] text-muted-foreground block">Settled Win Rate</span>
                  <span className="font-black text-sm text-foreground">
                    {roiStats.winRate}% ({roiStats.wonCount}/{roiStats.settledCount})
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border">
                  <span className="text-[10px] text-muted-foreground block">Net Profit</span>
                  <span
                    className={`font-black text-sm ${
                      roiStats.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                    }`}
                  >
                    {roiStats.netProfit >= 0 ? '+' : ''}
                    {roiStats.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border">
                  <span className="text-[10px] text-muted-foreground block">Personal ROI</span>
                  <span
                    className={`font-black text-sm ${
                      roiStats.roiPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                    }`}
                  >
                    {roiStats.roiPct >= 0 ? '+' : ''}
                    {roiStats.roiPct}%
                  </span>
                </div>
              </div>

              {savedSlips.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <BookmarkCheck className="h-10 w-10 opacity-40 mb-3" />
                  <h3 className="font-bold text-foreground text-sm mb-1">No Saved Slips Yet</h3>
                  <p className="text-xs max-w-xs mb-4">
                    Build a slip in the Active Slip tab and click &ldquo;Save &amp; Track Slip&rdquo; to track your personal Win Rate and ROI.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('active')} className="text-xs">
                    Go to Active Slip
                  </Button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {savedSlips.map((slip) => (
                    <div
                      key={slip.id}
                      className="p-3 rounded-xl border border-border bg-card space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-primary">{slip.bookingCode}</span>
                          <span className="text-muted-foreground ml-1.5">
                            · {slip.bookmakerName} · {slip.createdAt}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedSlip(slip.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          title="Delete saved slip"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1.5 bg-muted/40 p-2 rounded-lg border border-border/60">
                        {slip.selections.map((leg, i) => {
                          const legGrade = gradeSelectionAgainstFeed(
                            { homeTeam: leg.homeTeam, awayTeam: leg.awayTeam, market: leg.market },
                            liveAndFinishedFeed
                          );
                          return (
                            <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                              <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                <span className="truncate">
                                  {i + 1}. {leg.homeTeam} v {leg.awayTeam}
                                </span>
                                {(legGrade.status === 'LIVE' || legGrade.status === 'FINISHED') &&
                                  legGrade.homeScore !== null &&
                                  legGrade.awayScore !== null && (
                                    <span className="px-1 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono tabular-nums text-[10px] font-bold shrink-0">
                                      {legGrade.homeScore}-{legGrade.awayScore}
                                    </span>
                                  )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono font-semibold text-foreground">
                                  {leg.market} @ {leg.odds.toFixed(2)}
                                </span>
                                {legGrade.status === 'FINISHED' && legGrade.outcome !== 'PENDING' && (
                                  <span
                                    className={`px-1 py-0.5 rounded font-mono text-[9px] font-black ${
                                      legGrade.outcome === 'WON'
                                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                    }`}
                                  >
                                    {legGrade.outcome}
                                  </span>
                                )}
                                {legGrade.status === 'LIVE' && (
                                  <span className="px-1 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono text-[9px] font-black animate-pulse">
                                    {legGrade.minute || 'LIVE'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span>
                          Stake: <strong>{slip.currency} {slip.stake.toLocaleString()}</strong> · Odds:{' '}
                          <strong>{slip.totalOdds.toFixed(2)}</strong>
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Return: {slip.currency} {slip.potentialReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </div>

                      {/* Settlement Status Buttons + Reload */}
                      <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-border">
                        <div className="flex items-center gap-1" role="group" aria-label={`Settlement status for slip ${slip.bookingCode}`}>
                          <button
                            type="button"
                            aria-pressed={slip.status === 'WON'}
                            aria-label={`Mark slip ${slip.bookingCode} as Won`}
                            onClick={() => handleUpdateSavedStatus(slip.id, 'WON')}
                            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 select-none cursor-pointer transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              slip.status === 'WON'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Won
                          </button>
                          <button
                            type="button"
                            aria-pressed={slip.status === 'LOST'}
                            aria-label={`Mark slip ${slip.bookingCode} as Lost`}
                            onClick={() => handleUpdateSavedStatus(slip.id, 'LOST')}
                            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 select-none cursor-pointer transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              slip.status === 'LOST'
                                ? 'bg-destructive text-destructive-foreground'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <XCircle className="h-3 w-3" aria-hidden="true" /> Lost
                          </button>
                          <button
                            type="button"
                            aria-pressed={slip.status === 'PENDING'}
                            aria-label={`Mark slip ${slip.bookingCode} as Pending`}
                            onClick={() => handleUpdateSavedStatus(slip.id, 'PENDING')}
                            className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 select-none cursor-pointer transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              slip.status === 'PENDING'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Clock className="h-3 w-3" aria-hidden="true" /> Pending
                          </button>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReloadSavedSlip(slip)}
                          className="h-7 px-2 text-[11px] gap-1"
                        >
                          <RotateCcw className="h-3 w-3" /> Reload
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selections.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
                <Ticket className="h-8 w-8 opacity-40" />
              </div>
              <h3 className="font-bold text-foreground text-base mb-1">Your Bet Slip is Empty</h3>
              <p className="text-sm max-w-xs mb-5">
                Click any match odds button to build your slip, or instantly group top weekly predictions into a single Weekly Long Bet below:
              </p>
              <div className="flex flex-col w-full max-w-xs gap-2 mb-4">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleGroupAndTopUpWeeklyLongBet(5)}
                  className="text-xs font-bold cursor-pointer"
                >
                  Build 5-Game High-Chance Pack
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleGroupAndTopUpWeeklyLongBet(12)}
                  className="text-xs font-bold cursor-pointer"
                >
                  Build 12-Game Weekly Long Bet
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-xs">
                Explore All Matches
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Weekly Long Bet Accumulation Header & Quick Top-Up Strip */}
              <div className="px-4 py-2.5 border-b border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-foreground">
                      {slipMode === 'weekly_long_bet'
                        ? `Weekly Long Bet Slip (${selections.length} Grouped Games)`
                        : `Active Multi-Game Slip (${selections.length} Games)`}
                    </span>
                    <span className="text-muted-foreground ml-1.5 font-mono tabular-nums">
                      · {formatOdds(totalOdds)}x
                    </span>
                  </div>
                  {slipMode !== 'weekly_long_bet' && (
                    <button
                      type="button"
                      onClick={() => groupIntoWeeklyLongBet()}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer shrink-0"
                    >
                      Group as Weekly Long Bet →
                    </button>
                  )}
                </div>

                {/* 1-Click Top-Up Buttons to expand into 5-Game Pack or 10/12/15-Game Weekly Long Bet */}
                {selections.length < 15 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-muted-foreground">Top up slip:</span>
                    {selections.length < 5 && (
                      <button
                        type="button"
                        onClick={() => handleGroupAndTopUpWeeklyLongBet(5)}
                        className="px-2 py-0.5 rounded border border-border bg-background hover:bg-muted font-semibold text-foreground cursor-pointer"
                      >
                        + 5-Game Pack
                      </button>
                    )}
                    {selections.length < 10 && (
                      <button
                        type="button"
                        onClick={() => handleGroupAndTopUpWeeklyLongBet(10)}
                        className="px-2 py-0.5 rounded border border-border bg-background hover:bg-muted font-semibold text-foreground cursor-pointer"
                      >
                        + 10-Game Long Bet
                      </button>
                    )}
                    {selections.length < 12 && (
                      <button
                        type="button"
                        onClick={() => handleGroupAndTopUpWeeklyLongBet(12)}
                        className="px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary font-bold cursor-pointer"
                      >
                        + 12-Game Weekly Long Bet
                      </button>
                    )}
                    {selections.length < 15 && (
                      <button
                        type="button"
                        onClick={() => handleGroupAndTopUpWeeklyLongBet(15)}
                        className="px-2 py-0.5 rounded border border-border bg-background hover:bg-muted font-semibold text-foreground cursor-pointer"
                      >
                        + 15-Game Mega Long Bet
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Selections List with Cumulative Odds & Running Return Visualization */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {legProgression.map(({ selection: s, legNumber, dayGroup, cumulativeOdds, cumulativeReturn }, idx) => {
                  const legGrade = gradeSelectionAgainstFeed(
                    { homeTeam: s.homeTeam, awayTeam: s.awayTeam, market: s.market },
                    liveAndFinishedFeed
                  );
                  return (
                    <div
                      key={s.id}
                      className="p-3 bg-muted/40 hover:bg-muted/60 transition-colors rounded-xl border relative group"
                    >
                      <div className="flex items-start justify-between gap-2 pr-6">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-1.5 mb-1 text-[11px] text-muted-foreground">
                            <span className="font-mono font-bold text-primary">
                              Leg #{legNumber < 10 ? `0${legNumber}` : legNumber}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[120px]">{s.league}</span>
                            {dayGroup && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-medium text-foreground/80">{dayGroup}</span>
                              </>
                            )}
                            {legGrade.status === 'Live' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-black animate-pulse">
                                <Radio className="h-2.5 w-2.5" />
                                {legGrade.minute || 'LIVE'}
                              </span>
                            )}
                            {(legGrade.status === 'Won' || legGrade.status === 'Lost') && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] font-black ${
                                  legGrade.status === 'Won'
                                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                FT · {legGrade.outcome || legGrade.status.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-bold leading-snug">
                            <TeamLogo team={s.homeTeam} size="xs" />
                            <span className="truncate">{s.homeTeam}</span>
                            {(legGrade.status === 'Live' || legGrade.status === 'Won' || legGrade.status === 'Lost') &&
                            legGrade.homeScore !== null &&
                            legGrade.homeScore !== undefined &&
                            legGrade.awayScore !== null &&
                            legGrade.awayScore !== undefined ? (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono tabular-nums text-xs font-black shrink-0">
                                {legGrade.homeScore}-{legGrade.awayScore}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs font-normal">v</span>
                            )}
                            <TeamLogo team={s.awayTeam} size="xs" />
                            <span className="truncate">{s.awayTeam}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelection(s.id)}
                          className="absolute top-2.5 right-2.5 p-1 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                          title="Remove selection"
                          aria-label={`Remove ${s.homeTeam} vs ${s.awayTeam} (${s.market}) from bet slip`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-primary truncate">{s.market}</span>
                          {s.confidence ? (
                            <ConfidenceMeter confidence={s.confidence} variant="compact" />
                          ) : null}
                        </div>
                        <div className="font-mono tabular-nums font-black text-sm text-foreground shrink-0">
                          @ {formatOdds(s.odds)}
                        </div>
                      </div>

                      {/* Step-by-Step Cumulative Odds & Return Multiplier Trail */}
                      {selections.length > 1 && (
                        <div className="mt-1.5 pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px] font-mono tabular-nums text-muted-foreground">
                          <span>
                            After Leg #{idx + 1}: <strong className="text-foreground">{cumulativeOdds.toFixed(2)}x</strong>
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Return: {currency} {cumulativeReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Multi-Leg Bonus Progress & Active Tier Notification */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {bonusMultiplier > 0
                          ? `+${(bonusMultiplier * 100).toFixed(0)}% Weekly Long Bet Bonus Active`
                          : 'Accumulator Win Bonus Ladder'}
                      </span>
                    </div>
                    {nextBonusTier && (
                      <span className="text-[11px] font-mono text-muted-foreground">
                        +{nextBonusTier.legsNeeded} leg{nextBonusTier.legsNeeded > 1 ? 's' : ''} for +{nextBonusTier.nextBonusPct}%
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((selections.length / 15) * 100))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>3G (+5%)</span>
                    <span>5G (+15%)</span>
                    <span>8G (+30%)</span>
                    <span>12G (+50%)</span>
                    <span>15G (+60%)</span>
                  </div>
                </div>

                {/* AI Recommended Acca Enhancer */}
                {recommendedEnhancer && (
                  <div className="bg-primary/5 border border-primary/25 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Acca Enhancer
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                        +{recommendedEnhancer.boostPercent}% Payout Boost
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold truncate text-foreground">
                          {recommendedEnhancer.prediction.home_team} vs {recommendedEnhancer.prediction.away_team}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Pick: <strong className="text-foreground">{recommendedEnhancer.market}</strong> @ {formatOdds(recommendedEnhancer.odds)} · AI {recommendedEnhancer.confidence}%
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          addSelection({
                            match: `${recommendedEnhancer.prediction.home_team} vs ${recommendedEnhancer.prediction.away_team}`,
                            homeTeam: recommendedEnhancer.prediction.home_team,
                            awayTeam: recommendedEnhancer.prediction.away_team,
                            league: recommendedEnhancer.prediction.league,
                            matchDate: recommendedEnhancer.prediction.match_date,
                            market: recommendedEnhancer.market,
                            odds: recommendedEnhancer.odds,
                            confidence: recommendedEnhancer.confidence,
                          });
                        }}
                        className="h-7 px-2.5 text-xs font-bold shrink-0 gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Leg
                      </Button>
                    </div>
                  </div>
                )}

                {/* #7 Weakest-Leg Auditor & Smart Hedge Advisor */}
                {selections.length >= 2 && slipAudit.weakestLeg && (
                  <div className="rounded-xl border border-border bg-background p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        Weakest-Leg Auditor &amp; Hedge
                      </span>
                      <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
                        Slip EV {slipAudit.currentSlipEvPct >= 0 ? '+' : ''}
                        {slipAudit.currentSlipEvPct}% → {slipAudit.optimizedSlipEvPct >= 0 ? '+' : ''}
                        {slipAudit.optimizedSlipEvPct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Drag Leg: <strong className="text-foreground">{slipAudit.weakestLeg.fixture}</strong> ({slipAudit.weakestLeg.market} @{slipAudit.weakestLeg.odds.toFixed(2)} vs Fair @{slipAudit.weakestLeg.trueFairOdds.toFixed(2)} · Vig {slipAudit.weakestLeg.vigTaxPct}%).
                    </p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        Hedge: {currency} {slipAudit.hedgeStakeAmount} → Lock +{currency} {slipAudit.hedgeGuaranteedProfit}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const w = slipAudit.weakestLeg!;
                          removeSelection(w.id);
                          toast.success(`Removed weakest leg (${w.fixture}) to reduce slip vig drag`);
                        }}
                        className="px-2.5 py-1 rounded border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-bold text-rose-700 dark:text-rose-300 transition-colors cursor-pointer shrink-0"
                      >
                        Drop Weakest
                      </button>
                    </div>
                  </div>
                )}

                {/* 1-Click Booking Codes Across Global Bookmakers */}
                <div className="mt-4 pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-primary" /> {t('slip.export_code', 'Global Bookmaker Code Exporter')}
                    </p>
                    <Link
                      to="/booking-code-converter"
                      onClick={() => setIsOpen(false)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                      Converter Hub
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-muted/20 rounded-lg border">
                    {sortedBookmakers.map((bookie) => {
                      const isRegional = bookie.countryCodes?.includes(region.id);
                      return (
                        <Button
                          key={bookie.id}
                          variant={selectedBookmakerId === bookie.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleGenerateCode(bookie.id)}
                          title={`Generate booking code for ${bookie.name}`}
                          className={`text-[11px] h-6 px-2 gap-1 ${isRegional ? 'border-primary/40 font-semibold' : ''}`}
                        >
                          <span aria-hidden="true">{bookie.flag}</span>
                          <span>{bookie.name}</span>
                          {isRegional && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block ml-0.5" aria-hidden="true" />
                          )}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Flashscore-Style Web Audio Notification Engine & Fair Cash-Out Equity */}
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
                        Flashscore Audio Engine &amp; Live Tracker
                      </span>
                      <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        Fair Equity: {currency.symbol}
                        {Math.round(
                          (stake || 100) * Math.max(1.08, (combinedConfidence / 100) * totalOdds * 0.92)
                        ).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-muted-foreground">
                      <span>{selections.length} Tracked Fixture(s)</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleToggleAudioMute}
                          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                            audioEnabled
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'border-border bg-background text-muted-foreground'
                          }`}
                          title={audioEnabled ? 'Mute Web Audio Alerts' : 'Unmute Web Audio Alerts'}
                        >
                          {audioEnabled ? (
                            <>
                              <Volume2 className="h-3 w-3" />
                              <span>Audio ON</span>
                            </>
                          ) : (
                            <>
                              <VolumeX className="h-3 w-3" />
                              <span>Muted</span>
                            </>
                          )}
                        </button>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={audioVolume}
                          onChange={(e) => handleAudioVolumeChange(parseFloat(e.target.value))}
                          aria-label="Flashscore Alert Volume"
                          className="w-14 h-1 accent-emerald-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Distinct Web Audio API Synthesizer Triggers for Active Slip Fixtures */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleTriggerSlipAudioAlert('goal')}
                        className="flex items-center justify-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                        title="Trigger Flashscore-style ascending stadium bell chime for a Goal"
                      >
                        <span aria-hidden="true">⚽</span>
                        <span>Goal Alert</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerSlipAudioAlert('red_card')}
                        className="flex items-center justify-center gap-1 rounded border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
                        title="Trigger referee double-whistle & dismissal stinger for a Red Card"
                      >
                        <span aria-hidden="true">🟥</span>
                        <span>Red Card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerSlipAudioAlert('var_check')}
                        className="flex items-center justify-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 transition-colors cursor-pointer"
                        title="Trigger broadcast 3-pulse telemetry sonar tone for a VAR Check"
                      >
                        <span aria-hidden="true">📺</span>
                        <span>VAR Check</span>
                      </button>
                    </div>

                    {audioEventLog.length > 0 && (
                      <div className="rounded border border-border/60 bg-background/80 p-1.5 space-y-1 max-h-24 overflow-y-auto">
                        {audioEventLog.slice(0, 3).map((evt) => (
                          <div
                            key={evt.id}
                            className="flex items-center justify-between gap-1.5 text-[10px] font-mono tabular-nums"
                          >
                            <span
                              className={`font-bold truncate ${
                                evt.type === 'goal'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : evt.type === 'red_card'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {evt.type === 'goal' ? '⚽' : evt.type === 'red_card' ? '🟥' : '📺'} {evt.detail}
                            </span>
                            <span className="text-muted-foreground shrink-0">{evt.minute}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Multi-Bookmaker Live Payout Comparison & 3-Day Safe Rollover Target */}
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold uppercase tracking-wider text-muted-foreground">
                        Multi-Bookmaker Live Payout Comparison
                      </span>
                      <Link
                        to="/pro-command-center"
                        onClick={() => setIsOpen(false)}
                        className="font-mono font-bold text-primary hover:underline"
                      >
                        3D Rollover Planner →
                      </Link>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {[
                        { id: 'sportybet', label: 'SportyBet', mult: 1.03 },
                        { id: '1xbet', label: '1xBet', mult: 1.04 },
                        { id: 'betika', label: 'Betika', mult: 1.01 },
                        { id: 'bet9ja', label: 'Bet9ja', mult: 1.02 },
                      ].map((bk) => {
                        const quotedReturn = Math.round(potentialReturn * bk.mult * 100) / 100;
                        const isBest = bk.id === '1xbet' || bk.id === 'sportybet';
                        return (
                          <button
                            key={bk.id}
                            type="button"
                            onClick={() => handleGenerateCode(bk.id)}
                            className={`rounded border px-1.5 py-1 text-left transition-colors cursor-pointer ${
                              selectedBookmakerId === bk.id
                                ? 'border-primary bg-primary/10'
                                : 'border-border/60 bg-background/70 hover:border-primary/40'
                            }`}
                          >
                            <span className="block text-[9px] font-semibold text-muted-foreground truncate">
                              {bk.label}
                            </span>
                            <span
                              className={`block text-[11px] font-mono font-black tabular-nums truncate ${
                                isBest ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'
                              }`}
                            >
                              {currency.symbol}{quotedReturn.toFixed(0)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(() => {
                    const effectiveCode =
                      generatedCode || generateRegionalBookingCode(activeBookmaker.id, selections.length);
                    return (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 space-y-2 mt-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                              <span aria-hidden="true">{activeBookmaker.flag}</span> {activeBookmaker.name} Slip Code
                            </p>
                            <p className="font-mono font-bold text-sm tracking-wider text-primary">{effectiveCode}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleCopyCode(effectiveCode)}
                              title={`Copy ${activeBookmaker.name} slip code: ${effectiveCode}`}
                              className="h-8 gap-1 text-xs font-semibold"
                            >
                              {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                              {copied ? t('slip.copied', 'Copied') : 'Copy'}
                            </Button>
                            <a
                              href={getBookmakerDeepLinkUrl(activeBookmaker.id, effectiveCode, selections.length)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleCopyCode(effectiveCode)}
                              aria-label={`Load slip ${effectiveCode} on ${activeBookmaker.name}`}
                              className="inline-flex items-center justify-center gap-1 rounded-md text-xs font-semibold border border-primary/40 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-2.5 whitespace-nowrap"
                            >
                              <span>Load on {activeBookmaker.name}</span>
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                          </div>
                        </div>

                        {/* Exact Bookmaker Market & 4-Digit Game ID Checklist */}
                        <div className="pt-2 border-t border-primary/15 space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {activeBookmaker.name} Fast-Entry Coupon Checklist
                          </p>
                          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                            {selections.map((s) => {
                              const gameId = generateMatchGameId(s.homeTeam, s.awayTeam, activeBookmaker.id);
                              const translated = translateMarketForBookmaker(s.market, activeBookmaker.id);
                              return (
                                <div key={s.id} className="flex items-center justify-between text-[11px] bg-background/70 px-2 py-1 rounded border border-border/50">
                                  <span className="truncate max-w-[160px] font-medium">
                                    <strong className="font-mono text-primary mr-1">#{gameId}</strong>
                                    {s.homeTeam} v {s.awayTeam}
                                  </span>
                                  <span className="font-mono font-bold text-foreground shrink-0 ml-1">
                                    {translated}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Summary and Calculation Footer */}
              <div className="p-4 border-t bg-card/90 backdrop-blur space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted/40 p-2 rounded-lg border border-border/60">
                    <span className="text-muted-foreground block text-[10px]">Grouped Legs</span>
                    <span className="text-sm font-mono tabular-nums font-black text-foreground">
                      {selections.length} {selections.length === 1 ? 'Game' : 'Games'}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-2 rounded-lg border border-border/60">
                    <span className="text-muted-foreground block text-[10px]">{t('slip.total_odds', 'Combined Odds')}</span>
                    <span className="text-sm font-mono tabular-nums font-black text-primary">
                      {formatOdds(totalOdds)}x
                    </span>
                  </div>
                  <div className="bg-muted/40 p-2 rounded-lg border border-border/60">
                    <span className="text-muted-foreground block text-[10px]">{t('slip.ai_probability', 'AI Hit Rate')}</span>
                    <span className={`text-sm font-mono tabular-nums font-black ${combinedConfidence > 40 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                      {combinedConfidence}%
                    </span>
                  </div>
                </div>

                {/* Stake Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label htmlFor="betslip-stake-input" className="font-medium text-muted-foreground">{t('slip.stake', 'Stake Amount')}</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStake(aiRecommendedStake);
                          toast.success(`AI Recommended Stake applied: ${currency} ${aiRecommendedStake}`);
                        }}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded transition-colors"
                      >
                        <Sparkles className="h-3 w-3" />
                        AI Stake: {currency} {aiRecommendedStake}
                      </button>
                      <div className="flex gap-1" role="group" aria-label="Select currency">
                        {Array.from(new Set([currentConfig.code, 'USD', 'EUR', 'GBP', 'KES', 'NGN'])).slice(0, 4).map((c) => {
                          const isSelectedCurrency = currency === c || currentConfig.code === c;
                          return (
                            <button
                              type="button"
                              key={c}
                              aria-pressed={isSelectedCurrency}
                              aria-label={`Set stake currency to ${c}`}
                              onClick={() => {
                                triggerHaptic('selection');
                                setCurrency(c);
                                setGlobalCurrency(c as any);
                              }}
                              title={`Set currency to ${c}`}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all select-none cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                isSelectedCurrency
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="betslip-stake-input"
                      name="betslip-stake"
                      type="number"
                      min="10"
                      step="10"
                      value={stake || ''}
                      onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                      className="font-bold font-mono tabular-nums text-base pr-16"
                      aria-label="Stake amount"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">{currency}</span>
                  </div>
                </div>

                {/* Clear Visualization of Combined Odds & Total Potential Returns */}
                <div className="bg-primary/10 border border-primary/25 rounded-xl p-3 space-y-1.5 font-mono tabular-nums">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-muted-foreground font-medium">
                      Base Return ({currency} {(stake || 0).toLocaleString()} × {totalOdds.toFixed(2)}x)
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      {currency} {potentialReturn.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  {bonusMultiplier > 0 && (
                    <div className="flex items-center justify-between text-xs font-sans text-amber-600 dark:text-amber-400">
                      <span>+{(bonusMultiplier * 100).toFixed(0)}% Acca Bonus Boost</span>
                      <span className="font-mono font-bold">
                        +{currency} {bonusAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-primary/20 flex items-center justify-between">
                    <div className="font-sans">
                      <span className="text-xs font-bold text-foreground block">
                        Total Potential Return
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Net Profit: +{currency} {netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {currency} {(bonusMultiplier > 0 ? boostedReturn : potentialReturn).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Save & Track Slip Button */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveCurrentSlip}
                    className="h-9 text-xs font-bold gap-1.5 border border-primary/30"
                  >
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                    Save to ROI Tracker
                  </Button>
                  <Link
                    to="/bet-tracker"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                  >
                    Open Full ROI Ledger →
                  </Link>
                </div>

                {/* Action Buttons: Share / WhatsApp / Telegram / Export */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(formattedSlipShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                    WhatsApp Slip
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareableSlipUrl)}&text=${encodeURIComponent(formattedSlipShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Telegram Slip
                  </a>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleShareSlip} className="flex-1 gap-1.5 h-9 text-xs font-bold shadow-md">
                    <Share2 className="h-3.5 w-3.5" /> {t('slip.share', 'Share Link')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      triggerHaptic('success');
                      downloadSlipAsPngImage({
                        selections,
                        totalOdds,
                        stake,
                        currency,
                        potentialReturn: bonusMultiplier > 0 ? boostedReturn : potentialReturn,
                        bookmakerName: activeBookmaker.name,
                        bookingCode: generatedCode || generateRegionalBookingCode(activeBookmaker.id, selections.length),
                      });
                      toast.success('Downloaded high-DPI Slip Card PNG!');
                    }}
                    className="gap-1.5 h-9 text-xs font-semibold"
                    title="Save Slip as High-DPI PNG Card"
                  >
                    <Download className="h-3.5 w-3.5" /> Save PNG
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateCode(selectedBookmakerId)}
                    className="gap-1.5 h-9 text-xs"
                    title="Export Booking Code"
                  >
                    <Copy className="h-3.5 w-3.5" /> {t('slip.export_code', 'Code')}
                  </Button>
                </div>

                {!user && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      triggerGuestAccountInvite();
                    }}
                    className="w-full mt-1 p-2.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors flex items-center justify-between gap-2 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-foreground truncate">
                        Sync saved slips across devices with a Free Account
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 shrink-0">
                      +50 Coins
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
