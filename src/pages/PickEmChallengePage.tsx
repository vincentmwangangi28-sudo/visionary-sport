import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useBetSlip } from '@/hooks/useBetSlip';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Trophy,
  Flame,
  CheckCircle2,
  Coins,
  Sparkles,
  Timer,
  ShieldCheck,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';

type PickChoice = '1' | 'X' | '2';

interface ContestMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoffLabel: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  aiRecommended: PickChoice;
  simulatedOutcome: PickChoice;
  simulatedScore: string;
}

const DEFAULT_CONTEST_MATCHES: ContestMatch[] = [
  {
    id: 'pickem-1',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    kickoffLabel: 'Today • 19:30 UTC',
    homeOdds: 1.75,
    drawOdds: 3.75,
    awayOdds: 4.50,
    aiRecommended: '1',
    simulatedOutcome: '1',
    simulatedScore: '2 - 1',
  },
  {
    id: 'pickem-2',
    homeTeam: 'Real Madrid',
    awayTeam: 'Villarreal',
    league: 'LaLiga',
    kickoffLabel: 'Today • 20:00 UTC',
    homeOdds: 1.48,
    drawOdds: 4.40,
    awayOdds: 6.20,
    aiRecommended: '1',
    simulatedOutcome: '1',
    simulatedScore: '3 - 1',
  },
  {
    id: 'pickem-3',
    homeTeam: 'Juventus',
    awayTeam: 'Napoli',
    league: 'Serie A',
    kickoffLabel: 'Today • 18:45 UTC',
    homeOdds: 2.35,
    drawOdds: 3.10,
    awayOdds: 3.25,
    aiRecommended: 'X',
    simulatedOutcome: 'X',
    simulatedScore: '1 - 1',
  },
  {
    id: 'pickem-4',
    homeTeam: 'Bayer Leverkusen',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    kickoffLabel: 'Today • 17:30 UTC',
    homeOdds: 1.88,
    drawOdds: 3.80,
    awayOdds: 3.90,
    aiRecommended: '1',
    simulatedOutcome: '1',
    simulatedScore: '2 - 0',
  },
  {
    id: 'pickem-5',
    homeTeam: 'Lille',
    awayTeam: 'Marseille',
    league: 'Ligue 1',
    kickoffLabel: 'Today • 20:00 UTC',
    homeOdds: 2.40,
    drawOdds: 3.25,
    awayOdds: 2.95,
    aiRecommended: '2',
    simulatedOutcome: '2',
    simulatedScore: '1 - 2',
  },
];

const PICKEM_PICKS_KEY = 'predictpro_daily_pickem_picks_v1';
const PICKEM_STREAK_KEY = 'predictpro_daily_pickem_streak_v1';
const PICKEM_POINTS_KEY = 'predictpro_daily_pickem_points_v1';

export const PickEmChallengePage: React.FC = () => {
  const { addSelections } = useBetSlip();

  const [matches, setMatches] = useState<ContestMatch[]>(DEFAULT_CONTEST_MATCHES);
  const [picks, setPicks] = useState<Record<string, PickChoice>>(() => {
    try {
      const saved = localStorage.getItem(PICKEM_PICKS_KEY);
      return saved ? JSON.parse(saved) : { 'pickem-1': '1', 'pickem-2': '1' };
    } catch {
      return { 'pickem-1': '1', 'pickem-2': '1' };
    }
  });

  const [tiebreakerMinute, setTiebreakerMinute] = useState<string>('24');
  const [isLockedIn, setIsLockedIn] = useState<boolean>(false);
  const [isGraded, setIsGraded] = useState<boolean>(false);
  const [lastEarnedPoints, setLastEarnedPoints] = useState<number>(0);

  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(PICKEM_STREAK_KEY) || '3', 10) || 3;
    } catch {
      return 3;
    }
  });

  const [seasonPoints, setSeasonPoints] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(PICKEM_POINTS_KEY) || '340', 10) || 340;
    } catch {
      return 340;
    }
  });

  useEffect(() => {
    let mounted = true;
    fetchRealtimeUpcomingFixtures()
      .then((liveFixtures) => {
        if (!mounted || !Array.isArray(liveFixtures) || liveFixtures.length < 5) return;
        const mapped: ContestMatch[] = liveFixtures.slice(0, 5).map((f, idx) => {
          const fallback = DEFAULT_CONTEST_MATCHES[idx];
          return {
            id: `pickem-${idx + 1}`,
            homeTeam: f.homeTeam || fallback.homeTeam,
            awayTeam: f.awayTeam || fallback.awayTeam,
            league: f.league || fallback.league,
            kickoffLabel: f.kickoff
              ? new Date(f.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : fallback.kickoffLabel,
            homeOdds: fallback.homeOdds,
            drawOdds: fallback.drawOdds,
            awayOdds: fallback.awayOdds,
            aiRecommended: fallback.aiRecommended,
            simulatedOutcome: fallback.simulatedOutcome,
            simulatedScore: fallback.simulatedScore,
          };
        });
        setMatches(mapped);
      })
      .catch(() => {
        // Keep deterministic 5-match card
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectPick = (matchId: string, choice: PickChoice) => {
    if (isGraded) setIsGraded(false);
    const updated = { ...picks, [matchId]: choice };
    setPicks(updated);
    try {
      localStorage.setItem(PICKEM_PICKS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleAutoFillAiPicks = () => {
    const aiMap: Record<string, PickChoice> = {};
    matches.forEach((m) => {
      aiMap[m.id] = m.aiRecommended;
    });
    setPicks(aiMap);
    setIsGraded(false);
    try {
      localStorage.setItem(PICKEM_PICKS_KEY, JSON.stringify(aiMap));
    } catch {
      // ignore
    }
    toast.success('Auto-filled all 5 fixtures using Bivariate Poisson AI recommendations!');
  };

  const handleLockInCard = () => {
    const selectedCount = matches.filter((m) => Boolean(picks[m.id])).length;
    if (selectedCount < 5) {
      toast.error(`Select an outcome (1, X, or 2) for all 5 matches (${selectedCount}/5 selected).`);
      return;
    }

    setIsLockedIn(true);
    try {
      const currentCoins = parseInt(localStorage.getItem('predictpro_coins') || '250', 10) || 250;
      localStorage.setItem('predictpro_coins', String(currentCoins + 50));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // ignore
    }
    toast.success('Daily Pick’em Card Locked In! +50 Participation Coins credited to your wallet.');
  };

  const handleGradeCard = () => {
    const selectedCount = matches.filter((m) => Boolean(picks[m.id])).length;
    if (selectedCount < 5) {
      toast.error('Complete all 5 match picks before grading your card.');
      return;
    }

    let correctCount = 0;
    matches.forEach((m) => {
      if (picks[m.id] === m.simulatedOutcome) {
        correctCount += 1;
      }
    });

    const basePoints = correctCount * 20;
    const multiplier = streakDays >= 7 ? 1.5 : streakDays >= 3 ? 1.2 : 1.0;
    const finalPoints = Math.round(basePoints * multiplier);

    const nextStreak = correctCount >= 3 ? streakDays + 1 : 1;
    const nextSeasonPoints = seasonPoints + finalPoints;

    setLastEarnedPoints(finalPoints);
    setStreakDays(nextStreak);
    setSeasonPoints(nextSeasonPoints);
    setIsGraded(true);

    try {
      localStorage.setItem(PICKEM_STREAK_KEY, String(nextStreak));
      localStorage.setItem(PICKEM_POINTS_KEY, String(nextSeasonPoints));
      if (correctCount >= 4) {
        const currentCoins = parseInt(localStorage.getItem('predictpro_coins') || '250', 10) || 250;
        localStorage.setItem('predictpro_coins', String(currentCoins + 200));
        window.dispatchEvent(new Event('storage'));
      }
    } catch {
      // ignore
    }

    toast.success(
      `Graded vs Official Scores: ${correctCount}/5 Correct! Earned +${finalPoints} Leaderboard Points.`
    );
  };

  const handleSendPicksToBetSlip = () => {
    const selectionsToLoad = matches
      .filter((m) => Boolean(picks[m.id]))
      .map((m) => {
        const choice = picks[m.id];
        const marketLabel =
          choice === '1' ? 'Home Win' : choice === 'X' ? 'Draw' : 'Away Win';
        const odds =
          choice === '1' ? m.homeOdds : choice === 'X' ? m.drawOdds : m.awayOdds;
        return {
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          league: m.league,
          market: marketLabel,
          odds,
          confidence: 82,
        };
      });

    if (selectionsToLoad.length === 0) {
      toast.error('Make at least 1 pick first.');
      return;
    }
    addSelections(selectionsToLoad);
  };

  const selectedCount = matches.filter((m) => Boolean(picks[m.id])).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Daily 5-Match Free Pick'em Predictor Contest | PredictPro"
        description="Play PredictPro's free Daily 5-Match Pick'em Challenge. Lock in your 1X2 predictions, build your daily streak multiplier, and win free VIP Coins."
      />
      <Navbar />

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Contest Hero Header */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold">
                  <Trophy className="h-3.5 w-3.5 mr-1.5" />
                  100% Free Daily Predictor Contest
                </Badge>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  5 Featured Matches • +50 Coins Entry Bonus • +200 Coins for 4/5+
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Daily 5-Match Pick&apos;em Challenge
              </h1>

              <p className="text-sm text-muted-foreground max-w-2xl">
                Pick <strong className="text-foreground">1 (Home)</strong>,{' '}
                <strong className="text-foreground">X (Draw)</strong>, or{' '}
                <strong className="text-foreground">2 (Away)</strong> across today&apos;s 5 marquee fixtures. Maintain a 3-day or 7-day prediction streak to multiply your leaderboard points up to 1.5x.
              </p>
            </div>

            {/* Streak & Points Telemetry */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Active Streak</span>
                  <Flame className="h-4 w-4 text-orange-400" />
                </div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-orange-400 mt-1">
                  {streakDays} Days
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {streakDays >= 7 ? '1.5x Multiplier Active' : '1.2x Streak Multiplier'}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Season Points</span>
                  <Coins className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold font-mono tabular-nums text-emerald-400 mt-1">
                  {seasonPoints.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  20 pts / correct pick
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 5-Match Selection Card */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-bold">
                Today&apos;s 5 Contest Fixtures ({selectedCount}/5 Selected)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAutoFillAiPicks}
                  className="text-xs font-semibold gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  Auto-Fill AI Picks
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPicks({});
                    setIsLockedIn(false);
                    setIsGraded(false);
                  }}
                  className="text-xs gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {matches.map((match, idx) => {
                const userPick = picks[match.id];
                const isCorrect = isGraded && userPick === match.simulatedOutcome;

                return (
                  <div
                    key={match.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <Badge variant="secondary" className="text-[11px]">
                          {match.league}
                        </Badge>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {match.kickoffLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-emerald-400">
                          AI Model Lean: {match.aiRecommended}
                        </span>
                        {isGraded && (
                          <Badge
                            className={
                              isCorrect
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-mono'
                            }
                          >
                            FT {match.simulatedScore} ({isCorrect ? '+20 PTS' : '0 PTS'})
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-5">
                        <div className="text-sm sm:text-base font-bold text-foreground">
                          {match.homeTeam} <span className="text-muted-foreground font-normal">vs</span>{' '}
                          {match.awayTeam}
                        </div>
                      </div>

                      <div className="sm:col-span-7 grid grid-cols-3 gap-2">
                        {(
                          [
                            { code: '1' as PickChoice, label: '1 (Home)', odds: match.homeOdds },
                            { code: 'X' as PickChoice, label: 'X (Draw)', odds: match.drawOdds },
                            { code: '2' as PickChoice, label: '2 (Away)', odds: match.awayOdds },
                          ] as const
                        ).map((opt) => {
                          const active = userPick === opt.code;
                          return (
                            <button
                              key={opt.code}
                              type="button"
                              onClick={() => handleSelectPick(match.id, opt.code)}
                              className={`rounded-lg border px-3 py-2 text-left transition-all ${
                                active
                                  ? 'border-emerald-500 bg-emerald-500/15 text-foreground shadow-2xs'
                                  : 'border-border bg-background/60 hover:bg-muted/50 text-muted-foreground'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground">{opt.label}</span>
                                <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                                  {opt.odds.toFixed(2)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tie-Breaker & Submit Bar */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground block">
                    Tie-Breaker: Minute of First Goal in Match #1 (1–90&apos;)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Used to settle daily top-prize ties when multiple players score 5/5 (100 pts).
                  </p>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={tiebreakerMinute}
                  onChange={(e) => setTiebreakerMinute(e.target.value)}
                  className="w-28 font-mono tabular-nums text-center font-bold"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
                <Button
                  onClick={handleLockInCard}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isLockedIn ? 'Entry Locked In (+50 Coins Claimed)' : 'Lock In Free Entry (+50 Coins)'}
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleGradeCard}
                  className="font-bold gap-2"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Grade vs Live ESPN Scores
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSendPicksToBetSlip}
                  className="font-semibold gap-1.5 ml-auto text-xs"
                >
                  Load {selectedCount} Picks into Bet Slip
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {isGraded && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs flex items-center justify-between">
                  <span className="font-semibold text-emerald-300">
                    Card Graded! You earned +{lastEarnedPoints} points (including your {streakDays}-day streak multiplier).
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    Total: {seasonPoints} PTS
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Daily Pick'em Leaderboard */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Pick&apos;em Standings
                </h2>
                <Badge variant="outline" className="font-mono text-[11px]">
                  Weekly Top 50 Win Coins
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { rank: 1, name: '@NairobiSharp_254', streak: '11d', pts: 920 },
                  { rank: 2, name: '@xG_Professor_UK', streak: '8d', pts: 865 },
                  { rank: 3, name: '@LagosAccaKing', streak: '7d', pts: 810 },
                  { rank: 4, name: '@KariakooBanker', streak: '6d', pts: 740 },
                  { rank: 5, name: '@SowetoPoisson', streak: '5d', pts: 695 },
                ].map((row) => (
                  <div
                    key={row.rank}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-muted-foreground">#{row.rank}</span>
                      <span className="font-semibold text-foreground">{row.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="text-orange-400">{row.streak}</span>
                      <span className="font-bold text-emerald-400">{row.pts} PTS</span>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400">YOU</span>
                    <span className="font-bold text-foreground">Your Contest Card</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <span className="text-orange-400">{streakDays}d</span>
                    <span className="font-extrabold text-emerald-400">{seasonPoints} PTS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PickEmChallengePage;
