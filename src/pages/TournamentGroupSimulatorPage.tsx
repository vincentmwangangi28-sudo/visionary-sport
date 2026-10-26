import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { TeamLogo } from '@/components/TeamLogo';
import { Button } from '@/components/ui/button';
import {
  TOURNAMENT_PRESETS,
  buildGroupFixtures,
  calculateGroupStandings,
  type GroupFixtureItem,
  type TournamentPreset,
} from '@/services/phase11AnalyticsService';
import { toast } from 'sonner';
import { Trophy, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';

export const TournamentGroupSimulatorPage: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<'afcon' | 'worldcup' | 'ucl'>('afcon');
  const activePreset: TournamentPreset = useMemo(
    () => TOURNAMENT_PRESETS.find((p) => p.id === selectedPresetId) || TOURNAMENT_PRESETS[0],
    [selectedPresetId]
  );

  const [fixturesByPreset, setFixturesByPreset] = useState<Record<string, GroupFixtureItem[]>>(
    () => ({
      afcon: buildGroupFixtures(TOURNAMENT_PRESETS[0]),
      worldcup: buildGroupFixtures(TOURNAMENT_PRESETS[1]),
      ucl: buildGroupFixtures(TOURNAMENT_PRESETS[2]),
    })
  );

  const [knockoutWinners, setKnockoutWinners] = useState<Record<string, string>>({});

  const activeFixtures = useMemo(
    () => fixturesByPreset[selectedPresetId] || buildGroupFixtures(activePreset),
    [fixturesByPreset, selectedPresetId, activePreset]
  );

  const groupStandingsMap = useMemo(() => {
    const result: Record<string, ReturnType<typeof calculateGroupStandings>> = {};
    for (const grp of activePreset.groups) {
      const grpFixtures = activeFixtures.filter((f) => f.groupName === grp.groupName);
      result[grp.groupName] = calculateGroupStandings(
        grp.teams.map((t) => t.name),
        grpFixtures
      );
    }
    return result;
  }, [activePreset, activeFixtures]);

  const handleScoreChange = (
    fixtureId: string,
    side: 'home' | 'away',
    value: string
  ) => {
    const num = Math.max(0, Math.min(9, parseInt(value, 10) || 0));
    setFixturesByPreset((prev) => ({
      ...prev,
      [selectedPresetId]: (prev[selectedPresetId] || []).map((f) =>
        f.id === fixtureId
          ? {
              ...f,
              homeGoals: side === 'home' ? num : f.homeGoals,
              awayGoals: side === 'away' ? num : f.awayGoals,
            }
          : f
      ),
    }));
  };

  const handleMonteCarloSimulateAll = () => {
    const simulated = (fixturesByPreset[selectedPresetId] || []).map((f) => {
      // Sample Poisson-like goals around xG with slight variance
      const randA = (Math.random() - 0.45) * 1.3;
      const randB = (Math.random() - 0.48) * 1.2;
      const hGoals = Math.max(0, Math.round(f.homeXg + randA));
      const aGoals = Math.max(0, Math.round(f.awayXg + randB));
      return {
        ...f,
        homeGoals: hGoals,
        awayGoals: aGoals,
      };
    });
    setFixturesByPreset((prev) => ({
      ...prev,
      [selectedPresetId]: simulated,
    }));
    setKnockoutWinners({});
    toast.success(`Simulated all 24 group fixtures for ${activePreset.name}`);
  };

  const handleResetToModel = () => {
    setFixturesByPreset((prev) => ({
      ...prev,
      [selectedPresetId]: buildGroupFixtures(activePreset),
    }));
    setKnockoutWinners({});
    toast.info('Reset group scores to baseline Poisson xG projections');
  };

  // Build Quarter-Final -> Semi-Final -> Final knockout tree from top 2 of each group
  const knockoutBracket = useMemo(() => {
    const groups = activePreset.groups.map((g) => g.groupName);
    const gA = groupStandingsMap[groups[0]] || [];
    const gB = groupStandingsMap[groups[1]] || [];
    const gC = groupStandingsMap[groups[2]] || [];
    const gD = groupStandingsMap[groups[3]] || [];

    const qf1 = {
      id: 'QF1',
      label: 'Quarter-Final 1 (1A vs 2B)',
      teamA: gA[0]?.team || '1A',
      teamB: gB[1]?.team || '2B',
    };
    const qf2 = {
      id: 'QF2',
      label: 'Quarter-Final 2 (1B vs 2A)',
      teamA: gB[0]?.team || '1B',
      teamB: gA[1]?.team || '2A',
    };
    const qf3 = {
      id: 'QF3',
      label: 'Quarter-Final 3 (1C vs 2D)',
      teamA: gC[0]?.team || '1C',
      teamB: gD[1]?.team || '2D',
    };
    const qf4 = {
      id: 'QF4',
      label: 'Quarter-Final 4 (1D vs 2C)',
      teamA: gD[0]?.team || '1D',
      teamB: gC[1]?.team || '2C',
    };

    const wQf1 = knockoutWinners['QF1'] || qf1.teamA;
    const wQf2 = knockoutWinners['QF2'] || qf2.teamA;
    const wQf3 = knockoutWinners['QF3'] || qf3.teamA;
    const wQf4 = knockoutWinners['QF4'] || qf4.teamA;

    const sf1 = {
      id: 'SF1',
      label: 'Semi-Final 1 (W-QF1 vs W-QF3)',
      teamA: wQf1,
      teamB: wQf3,
    };
    const sf2 = {
      id: 'SF2',
      label: 'Semi-Final 2 (W-QF2 vs W-QF4)',
      teamA: wQf2,
      teamB: wQf4,
    };

    const wSf1 = knockoutWinners['SF1'] || sf1.teamA;
    const wSf2 = knockoutWinners['SF2'] || sf2.teamA;

    const finalMatch = {
      id: 'FINAL',
      label: 'Championship Final',
      teamA: wSf1,
      teamB: wSf2,
    };

    const champion = knockoutWinners['FINAL'] || finalMatch.teamA;

    return {
      quarterFinals: [qf1, qf2, qf3, qf4],
      semiFinals: [sf1, sf2],
      finalMatch,
      champion,
    };
  }, [activePreset, groupStandingsMap, knockoutWinners]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Interactive Group-Stage & Knockout Tournament Predictor | PredictPro"
        description="Simulate AFCON, FIFA World Cup, and UEFA Champions League group stage standings, goal difference tie-breakers, and knockout bracket progression."
        canonical="/tournament-simulator"
      />
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Group + Knockout Engine</span>
              <span aria-hidden="true">·</span>
              <span>Live Tie-Breaker Math (PTS / GD / GF)</span>
              <span aria-hidden="true">·</span>
              <span>100% Free Simulator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Interactive Group-Stage &amp; Knockout Tournament Predictor
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Edit group matchday scores or run a Monte Carlo Poisson simulation to calculate live group tables and automatically seed the knockout bracket to the trophy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToModel}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset to Poisson Baseline</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleMonteCarloSimulateAll}
              className="gap-1.5 text-xs font-bold cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Simulate All Group Matches</span>
            </Button>
          </div>
        </div>

        {/* Tournament Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-1.5 rounded-lg border border-border">
          {TOURNAMENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setSelectedPresetId(preset.id);
                setKnockoutWinners({});
              }}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                selectedPresetId === preset.id
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* 4 Group Cards Grid (2x2 on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activePreset.groups.map((grp) => {
            const standings = groupStandingsMap[grp.groupName] || [];
            const grpFixtures = activeFixtures.filter((f) => f.groupName === grp.groupName);

            return (
              <div
                key={grp.groupName}
                className="rounded-xl border border-border bg-card overflow-hidden space-y-4 p-4"
              >
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h2 className="text-sm font-extrabold text-foreground">{grp.groupName}</h2>
                  <span className="text-[11px] text-muted-foreground">
                    Top 2 Qualify to Knockout Stage
                  </span>
                </div>

                {/* Standings Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border/60">
                        <th className="py-1.5 text-left font-medium w-6">#</th>
                        <th className="py-1.5 text-left font-medium">Team</th>
                        <th className="py-1.5 text-right font-mono">P</th>
                        <th className="py-1.5 text-right font-mono">W</th>
                        <th className="py-1.5 text-right font-mono">D</th>
                        <th className="py-1.5 text-right font-mono">L</th>
                        <th className="py-1.5 text-right font-mono">GF:GA</th>
                        <th className="py-1.5 text-right font-mono">GD</th>
                        <th className="py-1.5 text-right font-mono font-bold text-foreground">
                          PTS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {standings.map((row, idx) => (
                        <tr
                          key={row.team}
                          className={idx < 2 ? 'bg-emerald-500/5' : ''}
                        >
                          <td className="py-2 font-mono tabular-nums">
                            <span
                              className={`inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold ${
                                idx < 2
                                  ? 'bg-emerald-700 text-white'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-2 font-semibold text-foreground">
                            <div className="flex items-center gap-2">
                              <TeamLogo team={row.team} size="xs" badgeOnly />
                              <span>{row.team}</span>
                            </div>
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                            {row.played}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                            {row.won}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                            {row.drawn}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                            {row.lost}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                            {row.gf}:{row.ga}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums font-medium">
                            {row.gd > 0 ? `+${row.gd}` : row.gd}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums font-extrabold text-foreground">
                            {row.pts}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Editable Group Matchday Scores */}
                <div className="pt-2 border-t border-border/60 space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Group Matchday Fixtures (Edit scores to recalculate table)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {grpFixtures.map((fix) => (
                      <div
                        key={fix.id}
                        className="p-2 rounded-lg border border-border/70 bg-muted/20 flex items-center justify-between gap-1.5 text-xs"
                      >
                        <span className="font-medium text-foreground truncate flex-1">
                          {fix.homeTeam}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={9}
                            aria-label={`${fix.homeTeam} goals vs ${fix.awayTeam}`}
                            value={fix.homeGoals ?? 0}
                            onChange={(e) =>
                              handleScoreChange(fix.id, 'home', e.target.value)
                            }
                            className="w-8 h-6 text-center rounded border border-border bg-background font-mono tabular-nums text-xs font-bold"
                          />
                          <span className="text-muted-foreground font-mono">-</span>
                          <input
                            type="number"
                            min={0}
                            max={9}
                            aria-label={`${fix.awayTeam} goals vs ${fix.homeTeam}`}
                            value={fix.awayGoals ?? 0}
                            onChange={(e) =>
                              handleScoreChange(fix.id, 'away', e.target.value)
                            }
                            className="w-8 h-6 text-center rounded border border-border bg-background font-mono tabular-nums text-xs font-bold"
                          />
                        </div>
                        <span className="font-medium text-foreground truncate flex-1 text-right">
                          {fix.awayTeam}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Auto-Seeded Knockout Stage Progression */}
        <section className="p-5 rounded-xl border border-border bg-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Auto-Seeded Knockout Stage Progression
              </h2>
              <p className="text-xs text-muted-foreground">
                Qualifiers update automatically from your group tables above. Click any team to advance them to the next round.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-600 dark:text-amber-300 flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5" />
              <span>Projected Champion: {knockoutBracket.champion}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quarter-Finals */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Quarter-Finals
              </h3>
              {knockoutBracket.quarterFinals.map((qf) => {
                const winner = knockoutWinners[qf.id] || qf.teamA;
                return (
                  <div
                    key={qf.id}
                    className="p-3 rounded-lg border border-border bg-background space-y-1.5"
                  >
                    <p className="text-[10px] text-muted-foreground font-mono">{qf.label}</p>
                    {[qf.teamA, qf.teamB].map((team) => (
                      <button
                        key={team}
                        type="button"
                        onClick={() =>
                          setKnockoutWinners((prev) => ({ ...prev, [qf.id]: team }))
                        }
                        className={`w-full px-2.5 py-1.5 rounded text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          winner === team
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'bg-muted/40 text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <TeamLogo team={team} size="xs" badgeOnly />
                          <span>{team}</span>
                        </span>
                        {winner === team && <ArrowRight className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Semi-Finals */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Semi-Finals
              </h3>
              {knockoutBracket.semiFinals.map((sf) => {
                const winner = knockoutWinners[sf.id] || sf.teamA;
                return (
                  <div
                    key={sf.id}
                    className="p-3 rounded-lg border border-border bg-background space-y-1.5"
                  >
                    <p className="text-[10px] text-muted-foreground font-mono">{sf.label}</p>
                    {[sf.teamA, sf.teamB].map((team) => (
                      <button
                        key={team}
                        type="button"
                        onClick={() =>
                          setKnockoutWinners((prev) => ({ ...prev, [sf.id]: team }))
                        }
                        className={`w-full px-2.5 py-1.5 rounded text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                          winner === team
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'bg-muted/40 text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <TeamLogo team={team} size="xs" badgeOnly />
                          <span>{team}</span>
                        </span>
                        {winner === team && <ArrowRight className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Championship Final */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Championship Final
              </h3>
              <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 space-y-2.5">
                <p className="text-xs font-bold text-foreground">
                  {knockoutBracket.finalMatch.label}
                </p>
                {[
                  knockoutBracket.finalMatch.teamA,
                  knockoutBracket.finalMatch.teamB,
                ].map((team) => {
                  const isChamp = knockoutBracket.champion === team;
                  return (
                    <button
                      key={team}
                      type="button"
                      onClick={() =>
                        setKnockoutWinners((prev) => ({ ...prev, FINAL: team }))
                      }
                      className={`w-full px-3 py-2 rounded-md text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                        isChamp
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-background border border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <TeamLogo team={team} size="xs" badgeOnly />
                        <span>{team}</span>
                      </span>
                      {isChamp && <Trophy className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}

                <div className="pt-3 border-t border-amber-500/30 text-center space-y-1">
                  <p className="text-[11px] text-muted-foreground">
                    Simulated Tournament Winner
                  </p>
                  <p className="text-lg font-extrabold text-foreground">
                    {knockoutBracket.champion}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TournamentGroupSimulatorPage;
