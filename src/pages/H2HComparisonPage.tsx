import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { TeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TEAMS_DATABASE, DERBY_PRESETS, simulateH2HMatch } from '@/data/h2hTeamsData';
import { TeamProfile, DerbyPreset } from '@/types/h2h';
import { Prediction } from '@/types/prediction';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { RefereeSetPieceMatrix } from '@/components/RefereeSetPieceMatrix';
import { hapticService } from '@/services/hapticService';
import { toast } from 'sonner';
import {
  ArrowLeftRight,
  Sparkles,
  Zap,
  Target,
  PlusCircle,
  Check,
  Trophy,
  History,
  Shield,
  Activity,
  Flame,
  Award,
  Calendar,
  Share2,
  Radio,
} from 'lucide-react';

function slugifyTeam(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/\b(fc|cf|sc|ac|afc)\b/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildDynamicTeamProfile(
  teamName: string,
  league: string,
  formStr?: string,
  winOdds?: number,
  recordStr?: string
): TeamProfile {
  const existing = TEAMS_DATABASE.find(
    (t) =>
      t.name.toLowerCase() === teamName.toLowerCase() ||
      t.shortName.toLowerCase() === teamName.toLowerCase() ||
      slugifyTeam(t.name) === slugifyTeam(teamName)
  );
  if (existing) return existing;

  const parsedForm = (formStr || 'WWDLW')
    .toUpperCase()
    .replace(/[^WDL]/g, '')
    .slice(0, 5)
    .split('') as ('W' | 'D' | 'L')[];
  while (parsedForm.length < 5) parsedForm.push('W');

  const winsIn5 = parsedForm.filter((c) => c === 'W').length;
  const drawsIn5 = parsedForm.filter((c) => c === 'D').length;
  const formScore = Math.min(94, Math.max(58, 55 + winsIn5 * 7 + drawsIn5 * 2));

  const impliedStrength = winOdds
    ? Math.min(92, Math.max(64, Math.round(102 - winOdds * 11)))
    : 78;

  const xgBase = Number((1.15 + (impliedStrength - 60) * 0.028).toFixed(2));
  const xgaBase = Number(Math.max(0.78, (1.55 - (impliedStrength - 60) * 0.018)).toFixed(2));
  const initials = teamName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);

  return {
    id: `espn-${slugifyTeam(teamName)}`,
    name: teamName,
    shortName: teamName.slice(0, 14),
    league: league || 'Official Competition',
    country: 'International',
    logoText: initials || 'FC',
    badgeColor: '#059669',
    attackRating: impliedStrength,
    defenseRating: Math.min(92, Math.max(65, impliedStrength - 2)),
    possessionRating: Math.min(90, Math.max(46, impliedStrength - 4)),
    setPieceRating: Math.min(89, Math.max(68, impliedStrength - 3)),
    formRating: formScore,
    goalsScoredPerGame: Number((xgBase * 1.04).toFixed(2)),
    goalsConcededPerGame: Number((xgaBase * 0.98).toFixed(2)),
    xGPerGame: xgBase,
    xGAPerGame: xgaBase,
    cleanSheetPct: Math.min(52, Math.max(22, Math.round(90 - xgaBase * 42))),
    bttsRatePct: Math.min(68, Math.max(42, Math.round(35 + xgBase * 14))),
    recentForm: parsedForm,
    starPlayer: {
      name: `${teamName.split(' ')[0]} #9 Captain`,
      position: 'Forward',
      goals: Math.max(8, Math.round(xgBase * 9)),
      assists: Math.max(4, Math.round(xgBase * 4)),
      rating: Number(Math.min(8.9, Math.max(7.4, 7.1 + (impliedStrength - 60) * 0.045)).toFixed(1)),
    },
  };
}

export default function H2HComparisonPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addSelection, selections, setIsOpen } = useBetSlip();
  const { formatOdds } = useUserPreferences();

  const [espnFixtures, setEspnFixtures] = useState<Prediction[]>([]);

  // Selected teams state
  const [teamAId, setTeamAId] = useState<string>('arsenal');
  const [teamBId, setTeamBId] = useState<string>('tottenham');
  const [activeDerbyId, setActiveDerbyId] = useState<string>('north-london-derby');
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch real live & upcoming ESPN fixtures
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [liveRes, upRes] = await Promise.all([
          fetch('/api/football?type=live').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/football?type=upcoming').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);
        if (!mounted) return;
        const combined: Prediction[] = [
          ...(Array.isArray(liveRes?.predictions) ? liveRes.predictions : []),
          ...(Array.isArray(upRes?.predictions) ? upRes.predictions : []),
        ];
        // Deduplicate by home + away
        const seen = new Set<string>();
        const unique = combined.filter((m) => {
          const key = `${m.home_team}_${m.away_team}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setEspnFixtures(unique.slice(0, 18));
      } catch {
        // fallback to static derbies
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Build combined catalog of static elite clubs + all clubs in today's ESPN schedule + any query param clubs
  const allTeamsCatalog = useMemo(() => {
    const map = new Map<string, TeamProfile>();
    for (const t of TEAMS_DATABASE) {
      map.set(t.id, t);
    }
    for (const m of espnFixtures) {
      const hProf = buildDynamicTeamProfile(m.home_team, m.league, m.home_form, m.home_odds, m.home_record);
      const aProf = buildDynamicTeamProfile(m.away_team, m.league, m.away_form, m.away_odds, m.away_record);
      if (!map.has(hProf.id)) map.set(hProf.id, hProf);
      if (!map.has(aProf.id)) map.set(aProf.id, aProf);
    }
    const q1 = searchParams.get('team1');
    const q2 = searchParams.get('team2');
    if (q1) {
      const p1 = buildDynamicTeamProfile(q1, 'Official Fixture');
      if (!map.has(p1.id)) map.set(p1.id, p1);
    }
    if (q2) {
      const p2 = buildDynamicTeamProfile(q2, 'Official Fixture');
      if (!map.has(p2.id)) map.set(p2.id, p2);
    }
    return Array.from(map.values());
  }, [espnFixtures, searchParams]);

  // Sync URL query params (?team1=...&team2=...) into teamAId and teamBId
  useEffect(() => {
    const q1 = searchParams.get('team1');
    const q2 = searchParams.get('team2');
    if (!q1 && !q2) return;

    const findTeamId = (rawName: string): string | null => {
      const lower = rawName.toLowerCase().trim();
      const slug = slugifyTeam(rawName);
      const found = allTeamsCatalog.find(
        (t) =>
          t.id === lower ||
          t.name.toLowerCase() === lower ||
          slugifyTeam(t.name) === slug ||
          t.name.toLowerCase().includes(lower) ||
          lower.includes(t.name.toLowerCase())
      );
      return found ? found.id : `espn-${slug}`;
    };

    if (q1) {
      const id1 = findTeamId(q1);
      if (id1) setTeamAId(id1);
    }
    if (q2) {
      const id2 = findTeamId(q2);
      if (id2) setTeamBId(id2);
    }
    setActiveDerbyId('');
  }, [searchParams, allTeamsCatalog]);

  const teamA = useMemo(() => {
    return allTeamsCatalog.find((t) => t.id === teamAId) || allTeamsCatalog[0] || TEAMS_DATABASE[0];
  }, [allTeamsCatalog, teamAId]);

  const teamB = useMemo(() => {
    return allTeamsCatalog.find((t) => t.id === teamBId) || allTeamsCatalog[1] || TEAMS_DATABASE[1];
  }, [allTeamsCatalog, teamBId]);

  // Check if current matchup matches any preset derby
  const activeDerby = useMemo(() => {
    return DERBY_PRESETS.find(
      d =>
        (d.teamAId === teamAId && d.teamBId === teamBId) ||
        (d.teamAId === teamBId && d.teamBId === teamAId)
    );
  }, [teamAId, teamBId]);

  // Check if current matchup matches a live/upcoming ESPN fixture
  const matchedEspnFixture = useMemo(() => {
    return espnFixtures.find(
      (m) =>
        (slugifyTeam(m.home_team) === slugifyTeam(teamA.name) &&
          slugifyTeam(m.away_team) === slugifyTeam(teamB.name)) ||
        (slugifyTeam(m.home_team) === slugifyTeam(teamB.name) &&
          slugifyTeam(m.away_team) === slugifyTeam(teamA.name))
    );
  }, [espnFixtures, teamA.name, teamB.name]);

  // Run Poisson distribution match simulation
  const simulation = useMemo(() => {
    return simulateH2HMatch(teamA, teamB);
  }, [teamA, teamB]);

  // Swap teams (Home vs Away)
  const handleSwap = () => {
    hapticService.selection();
    setTeamAId(teamBId);
    setTeamBId(teamAId);
  };

  // Select a preset derby
  const handleSelectDerby = (derby: DerbyPreset) => {
    hapticService.selection();
    setActiveDerbyId(derby.id);
    setTeamAId(derby.teamAId);
    setTeamBId(derby.teamBId);
    setSearchParams({});
  };

  // Select a real ESPN fixture
  const handleSelectEspnMatch = (m: Prediction) => {
    hapticService.selection();
    const hProf = buildDynamicTeamProfile(m.home_team, m.league, m.home_form, m.home_odds);
    const aProf = buildDynamicTeamProfile(m.away_team, m.league, m.away_form, m.away_odds);
    setTeamAId(hProf.id);
    setTeamBId(aProf.id);
    setActiveDerbyId('');
    setSearchParams({ team1: m.home_team, team2: m.away_team });
  };

  // Trigger re-simulation animation
  const handleSimulate = () => {
    hapticService.boost();
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      hapticService.success();
      toast.success(`Match simulation updated for ${teamA.name} vs ${teamB.name}`);
    }, 450);
  };

  // Check if bet is in slip
  const isBetInSlip = selections.some(
    s => s.homeTeam === teamA.name && s.awayTeam === teamB.name
  );

  // Add recommended market to slip
  const handleAddToSlip = () => {
    hapticService.selection();
    addSelection({
      match: `${teamA.name} vs ${teamB.name}`,
      homeTeam: teamA.name,
      awayTeam: teamB.name,
      league: teamA.league,
      matchDate: matchedEspnFixture?.match_date || 'Upcoming Matchup',
      market: simulation.recommendedMarket,
      odds: simulation.recommendedOdds,
      confidence: Math.max(simulation.homeWinProb, simulation.over25Prob, simulation.bttsProb),
    });
    setIsOpen(true);
    toast.success(`Added ${simulation.recommendedMarket} to your bet slip!`);
  };

  // Share matchup analysis
  const handleShare = () => {
    hapticService.success();
    const text = `⚽ H2H Simulation: ${teamA.name} vs ${teamB.name}\n` +
      `📊 Win Probabilities: ${teamA.name} ${simulation.homeWinProb}% | Draw ${simulation.drawProb}% | ${teamB.name} ${simulation.awayWinProb}%\n` +
      `🔥 Over 2.5: ${simulation.over25Prob}% | BTTS: ${simulation.bttsProb}%\n` +
      `🎯 Top Score: ${simulation.topScores[0].score} (${simulation.topScores[0].prob}%)\n` +
      `💡 Value Pick: ${simulation.recommendedMarket} @ ${simulation.recommendedOdds}\n` +
      `👉 Simulated on PredictPro: https://predictpro.guru/h2h?team1=${encodeURIComponent(teamA.name)}&team2=${encodeURIComponent(teamB.name)}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success('Matchup analysis copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="AI Football Head-to-Head (H2H) Comparison & Simulator | PredictPro"
        description="Compare any two football clubs head-to-head with Poisson scoreline simulations, comparative attack ratings, and value betting recommendations."
      />
      <Navbar />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-28 md:pb-16 space-y-6">
        {/* Dark Broadcast Header Banner */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Interactive Club Comparison · Live ESPN Form &amp; Bivariate Poisson Simulator
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Head-to-Head (H2H) &amp; Matchup Simulator
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-1">
              Compare any two clubs side-by-side with live ESPN form, DraftKings market odds, Poisson scoreline probability matrices, and value market picks.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              onClick={handleShare}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share Analysis
            </Button>
            <Button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              <Zap className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
              {isSimulating ? 'Simulating...' : 'Run Simulation'}
            </Button>
          </div>
        </div>

        {/* Today's Live & Upcoming ESPN Matchups Quick Selector */}
        {espnFixtures.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                Today&apos;s Live &amp; Upcoming ESPN Matchups ({espnFixtures.length})
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Click any fixture to load real ESPN form &amp; odds
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {espnFixtures.map((m) => {
                const isSelected =
                  slugifyTeam(m.home_team) === slugifyTeam(teamA.name) &&
                  slugifyTeam(m.away_team) === slugifyTeam(teamB.name);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectEspnMatch(m)}
                    className={`px-3 py-2 rounded-xl border text-left flex-shrink-0 transition-all text-xs flex flex-col gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-foreground font-bold shadow-xs'
                        : 'bg-card border-border/70 text-muted-foreground hover:border-emerald-500/50 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
                      <TeamLogo team={m.home_team} logoUrl={m.home_logo} size="xs" />
                      <span>{m.home_team}</span>
                      {m.status === 'live' && typeof m.home_score === 'number' ? (
                        <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-500 font-mono text-[10px] font-black">
                          {m.home_score}-{m.away_score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-normal">v</span>
                      )}
                      <TeamLogo team={m.away_team} logoUrl={m.away_logo} size="xs" />
                      <span>{m.away_team}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground font-mono">
                      <span className="truncate max-w-[140px] font-sans">{m.league}</span>
                      <span>
                        {m.home_odds?.toFixed(2)} · {m.draw_odds?.toFixed(2)} · {m.away_odds?.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Featured Derby Quick Picks */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Iconic Derby &amp; Rivalry Matchups
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {DERBY_PRESETS.map(derby => {
              const isSelected = activeDerbyId === derby.id;
              return (
                <button
                  key={derby.id}
                  onClick={() => handleSelectDerby(derby)}
                  className={`px-3 py-2 rounded-xl border text-left flex-shrink-0 transition-all text-xs flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-primary/15 border-primary text-primary font-bold shadow-sm'
                      : 'bg-card border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  <span className="font-semibold text-foreground text-xs">{derby.name}</span>
                  <span className="text-[10px] text-muted-foreground">{derby.league}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Matchup Selector Card */}
        <Card className="p-6 bg-card/90 border-border/80 rounded-2xl shadow-sm space-y-6">
          {matchedEspnFixture && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span className="font-bold text-foreground">
                  Synced to Official ESPN Fixture: {matchedEspnFixture.home_team} vs {matchedEspnFixture.away_team}
                </span>
                <span className="text-muted-foreground">· {matchedEspnFixture.league}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                {matchedEspnFixture.home_record && (
                  <span>
                    Records: <strong>{matchedEspnFixture.home_record}</strong> vs <strong>{matchedEspnFixture.away_record}</strong>
                  </span>
                )}
                <span>
                  Live Market: <strong>1 ({matchedEspnFixture.home_odds?.toFixed(2)})</strong> ·{' '}
                  <strong>X ({matchedEspnFixture.draw_odds?.toFixed(2)})</strong> ·{' '}
                  <strong>2 ({matchedEspnFixture.away_odds?.toFixed(2)})</strong>
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Team A (Home) */}
            <div className="md:col-span-5 p-4 rounded-xl bg-muted/40 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Home Team
                </span>
                <Badge variant="outline" className="text-[10px]">{teamA.league}</Badge>
              </div>

              <div className="flex items-center gap-3">
                <TeamLogo team={teamA.name} logoUrl={matchedEspnFixture?.home_logo} size="lg" />
                <div className="flex-1 min-w-0">
                  <select
                    value={teamAId}
                    aria-label="Select Home Team"
                    onChange={e => {
                      setTeamAId(e.target.value);
                      setActiveDerbyId('');
                    }}
                    className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {allTeamsCatalog.map(t => (
                      <option key={t.id} value={t.id} disabled={t.id === teamBId}>
                        {t.name} ({t.league})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-muted-foreground block mt-1 truncate">
                    Form: {teamA.recentForm.join('-')} · xG/90: {teamA.xGPerGame}
                  </span>
                </div>
              </div>
            </div>

            {/* Swap & VS Center */}
            <div className="md:col-span-1 flex flex-col items-center justify-center gap-2">
              <span className="font-black text-xs text-muted-foreground tracking-widest uppercase">VS</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-border hover:bg-primary/10 hover:text-primary hover:border-primary"
                onClick={handleSwap}
                title="Swap Home & Away"
                aria-label="Swap Home and Away teams"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>

            {/* Team B (Away) */}
            <div className="md:col-span-5 p-4 rounded-xl bg-muted/40 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
                  Away Team
                </span>
                <Badge variant="outline" className="text-[10px]">{teamB.league}</Badge>
              </div>

              <div className="flex items-center gap-3">
                <TeamLogo team={teamB.name} logoUrl={matchedEspnFixture?.away_logo} size="lg" />
                <div className="flex-1 min-w-0">
                  <select
                    value={teamBId}
                    aria-label="Select Away Team"
                    onChange={e => {
                      setTeamBId(e.target.value);
                      setActiveDerbyId('');
                    }}
                    className="w-full bg-background border border-border/70 rounded-lg px-2.5 py-1.5 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {allTeamsCatalog.map(t => (
                      <option key={t.id} value={t.id} disabled={t.id === teamAId}>
                        {t.name} ({t.league})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-muted-foreground block mt-1 truncate">
                    Form: {teamB.recentForm.join('-')} · xG/90: {teamB.xGPerGame}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Simulation Output Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Simulation Probabilities */}
          <Card className="lg:col-span-2 p-6 bg-card border-border/80 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-bold">Poisson Matchup Simulation Results</CardTitle>
              </div>
              <Badge variant="secondary" className="text-[11px] font-mono">
                xG: {simulation.expectedHomeGoals} - {simulation.expectedAwayGoals}
              </Badge>
            </div>

            {/* 1X2 Win Probability Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-primary">{teamA.name} Win: {simulation.homeWinProb}%</span>
                <span className="text-muted-foreground">Draw: {simulation.drawProb}%</span>
                <span className="text-foreground">{teamB.name} Win: {simulation.awayWinProb}%</span>
              </div>

              {/* Stacked Percentage Bar */}
              <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-muted">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${simulation.homeWinProb}%` }}
                  title={`${teamA.name} Win: ${simulation.homeWinProb}%`}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${simulation.drawProb}%` }}
                  title={`Draw: ${simulation.drawProb}%`}
                />
                <div
                  className="bg-sky-600 h-full transition-all duration-500"
                  style={{ width: `${simulation.awayWinProb}%` }}
                  title={`${teamB.name} Win: ${simulation.awayWinProb}%`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-0.5">
                <span>Fair Odds: @{(100 / simulation.homeWinProb).toFixed(2)}</span>
                <span>Fair Odds: @{(100 / simulation.drawProb).toFixed(2)}</span>
                <span>Fair Odds: @{(100 / simulation.awayWinProb).toFixed(2)}</span>
              </div>
            </div>

            {/* Goal Market Probabilities */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-muted/40 border border-border/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Over 2.5 Goals</span>
                <span className="text-xl font-black text-foreground">{simulation.over25Prob}%</span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Fair: @{(100 / simulation.over25Prob).toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-muted/40 border border-border/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Both Teams Score (BTTS)</span>
                <span className="text-xl font-black text-foreground">{simulation.bttsProb}%</span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  Fair: @{(100 / simulation.bttsProb).toFixed(2)}
                </span>
              </div>

              <div className="p-3 bg-muted/40 border border-border/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">{teamA.shortName} Exp. Goals</span>
                <span className="text-xl font-black text-primary">{simulation.expectedHomeGoals}</span>
                <span className="text-[10px] text-muted-foreground block">Attack vs Defense</span>
              </div>

              <div className="p-3 bg-muted/40 border border-border/50 rounded-xl space-y-1 text-center">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">{teamB.shortName} Exp. Goals</span>
                <span className="text-xl font-black text-foreground">{simulation.expectedAwayGoals}</span>
                <span className="text-[10px] text-muted-foreground block">Away conversion</span>
              </div>
            </div>

            {/* Most Probable Correct Scores */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Top Probable Exact Scorelines (Poisson Matrix)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {simulation.topScores.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center justify-between text-xs"
                  >
                    <span className="font-black text-foreground font-mono text-sm">{item.score}</span>
                    <Badge variant="secondary" className="font-mono text-[11px] font-bold">
                      {item.prob}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Value Bet Recommendation Box */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-card border-primary/30 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Flame className="h-5 w-5 text-orange-500" />
                <h3 className="font-bold text-base">Algorithmic Best Bet</h3>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border/60 space-y-2">
                <span className="text-[11px] text-muted-foreground block">Recommended Selection:</span>
                <span className="text-lg font-black text-foreground block leading-tight">
                  {simulation.recommendedMarket}
                </span>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Estimated Odds:</span>
                  <Badge className="text-sm font-black font-mono px-2.5 py-0.5 bg-primary text-primary-foreground">
                    @ {formatOdds(simulation.recommendedOdds)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-bold text-foreground block">AI Tactical Verdict:</span>
                <p className="text-muted-foreground leading-relaxed text-xs">
                  {simulation.tacticalVerdict}
                </p>
              </div>
            </div>

            <Button
              onClick={handleAddToSlip}
              disabled={isBetInSlip}
              className={`w-full h-10 text-xs font-bold gap-2 ${
                isBetInSlip ? 'bg-emerald-600/20 text-emerald-600' : 'bg-primary text-primary-foreground shadow-md'
              }`}
            >
              {isBetInSlip ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" /> Selection In Slip
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" /> Add Selection to Bet Slip
                </>
              )}
            </Button>
          </Card>
        </div>

        {/* Head-to-Head Comparative Attribute Meters */}
        <Card className="p-6 bg-card border-border/80 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-border/50 pb-3">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">Tactical Power &amp; Ratings Comparison</CardTitle>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Attacking Threat', valA: teamA.attackRating, valB: teamB.attackRating },
              { label: 'Defensive Solidity', valA: teamA.defenseRating, valB: teamB.defenseRating },
              { label: 'Possession Control', valA: teamA.possessionRating, valB: teamB.possessionRating },
              { label: 'Set Piece Efficiency', valA: teamA.setPieceRating, valB: teamB.setPieceRating },
              { label: 'Current Form Index', valA: teamA.formRating, valB: teamB.formRating },
            ].map(metric => (
              <div key={metric.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="font-bold font-mono text-primary">{metric.valA}</span>
                  <span className="text-muted-foreground text-center">{metric.label}</span>
                  <span className="font-bold font-mono text-foreground">{metric.valB}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 h-2.5">
                  {/* Left (Team A) fills from right to left */}
                  <div className="bg-muted rounded-full overflow-hidden flex justify-end">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${metric.valA}%` }}
                    />
                  </div>
                  {/* Right (Team B) fills from left to right */}
                  <div className="bg-muted rounded-full overflow-hidden">
                    <div
                      className="bg-sky-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${metric.valB}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Season Statistics Table */}
          <div className="pt-4 border-t border-border/50">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
              Season Statistical Metrics
            </span>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-center text-xs">
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">Goals / Game</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.goalsScoredPerGame}</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.goalsScoredPerGame}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">Conceded / Game</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.goalsConcededPerGame}</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.goalsConcededPerGame}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">xG Expected Goals</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.xGPerGame}</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.xGPerGame}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">xGA Conceded</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.xGAPerGame}</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.xGAPerGame}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">Clean Sheet %</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.cleanSheetPct}%</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.cleanSheetPct}%</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl">
                <span className="text-[10px] text-muted-foreground block">BTTS Rate %</span>
                <span className="font-bold font-mono text-primary text-sm">{teamA.bttsRatePct}%</span>
                <span className="text-[10px] text-muted-foreground"> vs </span>
                <span className="font-bold font-mono text-foreground text-sm">{teamB.bttsRatePct}%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Referee Discipline & Corner Tempo Matrix for Selected H2H Matchup */}
        <RefereeSetPieceMatrix
          homeTeam={teamA.name}
          awayTeam={teamB.name}
          league={teamA.league}
          allowFixtureSwitch={false}
        />

        {/* Official ESPN Head-to-Head History & Venue Telemetry */}
        {espnDeepSummary && (espnDeepSummary.headToHead.length > 0 || espnDeepSummary.venue || espnDeepSummary.referee) && (
          <Card className="p-6 bg-card border-emerald-500/30 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-emerald-500 animate-pulse" />
                <CardTitle className="text-lg font-bold">
                  Official ESPN Head-to-Head &amp; Match Telemetry: {teamA.name} vs {teamB.name}
                </CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
                {espnDeepSummary.venue && <span>Venue: {espnDeepSummary.venue}</span>}
                {espnDeepSummary.referee && <span>· Official: {espnDeepSummary.referee}</span>}
              </div>
            </div>

            {espnDeepSummary.headToHead.length > 0 && (
              <div className="space-y-2">
                {espnDeepSummary.headToHead.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground min-w-[100px]">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-mono text-[11px]">{String(m.date || '').split('T')[0]}</span>
                    </div>

                    <div className="flex items-center gap-3 font-semibold text-foreground">
                      <span className="text-right min-w-[110px] truncate">{m.homeTeam}</span>
                      <Badge className="font-mono text-xs px-2.5 py-0.5 bg-card border border-border text-foreground">
                        {m.score}
                      </Badge>
                      <span className="text-left min-w-[110px] truncate">{m.awayTeam}</span>
                    </div>

                    <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                      {m.competition}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Historical H2H Meetings */}
        {activeDerby && activeDerby.pastMeetings.length > 0 && (
          <Card className="p-6 bg-card border-border/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-lg font-bold">Historical Encounters: {activeDerby.name}</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground font-mono">Last {activeDerby.pastMeetings.length} Matches</span>
            </div>

            <div className="space-y-2">
              {activeDerby.pastMeetings.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 text-muted-foreground min-w-[100px]">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-[11px]">{m.date}</span>
                  </div>

                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <span className="text-right min-w-[110px] truncate">{m.homeTeam}</span>
                    <Badge className="font-mono text-xs px-2.5 py-0.5 bg-card border border-border text-foreground">
                      {m.homeScore} - {m.awayScore}
                    </Badge>
                    <span className="text-left min-w-[110px] truncate">{m.awayTeam}</span>
                  </div>

                  <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                    {m.competition}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
