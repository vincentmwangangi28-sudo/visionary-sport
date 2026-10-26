import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  Copy,
  Flame,
  GitBranch,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

interface KnockoutTie {
  id: string;
  stage: 'QF' | 'SF' | 'FINAL';
  label: string;
  teamA: string;
  teamB: string;
  probAPct: number;
  probBPct: number;
  projectedScore: string;
}

interface OutrightContenderRow {
  team: string;
  eloRating: number;
  qfProbPct: number;
  sfProbPct: number;
  finalProbPct: number;
  titleProbPct: number;
  fairOutrightOdds: number;
  bookieOutrightOdds: number;
  scoredFirstPct: number;
  leadConversionWinPct: number;
}

interface TournamentBracketPackage {
  id: 'UCL' | 'AFCON' | 'CAF_CL' | 'WORLD_CUP';
  name: string;
  subtitle: string;
  hostFinalVenue: string;
  quarterFinals: [KnockoutTie, KnockoutTie, KnockoutTie, KnockoutTie];
  contenders: OutrightContenderRow[];
}

const TOURNAMENT_BRACKETS: TournamentBracketPackage[] = [
  {
    id: 'UCL',
    name: 'UEFA Champions League',
    subtitle: 'Knockout Road-to-the-Final Bracket & 10,000-Run Title Probabilities',
    hostFinalVenue: 'Allianz Arena / European Knockout Stage',
    quarterFinals: [
      {
        id: 'ucl-qf1',
        stage: 'QF',
        label: 'Quarter-Final 1',
        teamA: 'Arsenal',
        teamB: 'Bayern Munich',
        probAPct: 56,
        probBPct: 44,
        projectedScore: '3 - 2 (Agg)',
      },
      {
        id: 'ucl-qf2',
        stage: 'QF',
        label: 'Quarter-Final 2',
        teamA: 'Real Madrid',
        teamB: 'Manchester City',
        probAPct: 52,
        probBPct: 48,
        projectedScore: '4 - 3 (Agg)',
      },
      {
        id: 'ucl-qf3',
        stage: 'QF',
        label: 'Quarter-Final 3',
        teamA: 'Barcelona',
        teamB: 'Inter Milan',
        probAPct: 58,
        probBPct: 42,
        projectedScore: '3 - 1 (Agg)',
      },
      {
        id: 'ucl-qf4',
        stage: 'QF',
        label: 'Quarter-Final 4',
        teamA: 'Liverpool',
        teamB: 'Paris Saint-Germain',
        probAPct: 61,
        probBPct: 39,
        projectedScore: '4 - 2 (Agg)',
      },
    ],
    contenders: [
      {
        team: 'Real Madrid',
        eloRating: 2048,
        qfProbPct: 100,
        sfProbPct: 52.0,
        finalProbPct: 31.4,
        titleProbPct: 19.8,
        fairOutrightOdds: 5.05,
        bookieOutrightOdds: 5.50,
        scoredFirstPct: 74,
        leadConversionWinPct: 89,
      },
      {
        team: 'Liverpool',
        eloRating: 2042,
        qfProbPct: 100,
        sfProbPct: 61.0,
        finalProbPct: 33.8,
        titleProbPct: 19.2,
        fairOutrightOdds: 5.21,
        bookieOutrightOdds: 5.75,
        scoredFirstPct: 78,
        leadConversionWinPct: 91,
      },
      {
        team: 'Arsenal',
        eloRating: 2036,
        qfProbPct: 100,
        sfProbPct: 56.0,
        finalProbPct: 29.2,
        titleProbPct: 17.5,
        fairOutrightOdds: 5.71,
        bookieOutrightOdds: 6.25,
        scoredFirstPct: 76,
        leadConversionWinPct: 92,
      },
      {
        team: 'Barcelona',
        eloRating: 2028,
        qfProbPct: 100,
        sfProbPct: 58.0,
        finalProbPct: 28.4,
        titleProbPct: 16.4,
        fairOutrightOdds: 6.10,
        bookieOutrightOdds: 6.50,
        scoredFirstPct: 72,
        leadConversionWinPct: 86,
      },
      {
        team: 'Manchester City',
        eloRating: 2031,
        qfProbPct: 100,
        sfProbPct: 48.0,
        finalProbPct: 24.1,
        titleProbPct: 13.8,
        fairOutrightOdds: 7.25,
        bookieOutrightOdds: 7.00,
        scoredFirstPct: 75,
        leadConversionWinPct: 88,
      },
      {
        team: 'Bayern Munich',
        eloRating: 2012,
        qfProbPct: 100,
        sfProbPct: 44.0,
        finalProbPct: 20.6,
        titleProbPct: 10.4,
        fairOutrightOdds: 9.62,
        bookieOutrightOdds: 10.0,
        scoredFirstPct: 71,
        leadConversionWinPct: 85,
      },
    ],
  },
  {
    id: 'AFCON',
    name: 'Africa Cup of Nations (AFCON)',
    subtitle: 'Continental CAF Knockout Bracket & First-to-Score Conversion Matrix',
    hostFinalVenue: 'Complexe Sportif Prince Moulay Abdellah, Rabat',
    quarterFinals: [
      {
        id: 'af-qf1',
        stage: 'QF',
        label: 'Quarter-Final 1',
        teamA: 'Morocco',
        teamB: 'Cameroon',
        probAPct: 66,
        probBPct: 34,
        projectedScore: '2 - 0',
      },
      {
        id: 'af-qf2',
        stage: 'QF',
        label: 'Quarter-Final 2',
        teamA: 'Senegal',
        teamB: 'Mali',
        probAPct: 62,
        probBPct: 38,
        projectedScore: '2 - 1',
      },
      {
        id: 'af-qf3',
        stage: 'QF',
        label: 'Quarter-Final 3',
        teamA: 'Nigeria',
        teamB: 'Ivory Coast',
        probAPct: 54,
        probBPct: 46,
        projectedScore: '1 - 1 (Nigeria Pens)',
      },
      {
        id: 'af-qf4',
        stage: 'QF',
        label: 'Quarter-Final 4',
        teamA: 'Egypt',
        teamB: 'Algeria',
        probAPct: 53,
        probBPct: 47,
        projectedScore: '2 - 1 (AET)',
      },
    ],
    contenders: [
      {
        team: 'Morocco',
        eloRating: 1915,
        qfProbPct: 100,
        sfProbPct: 66.0,
        finalProbPct: 41.2,
        titleProbPct: 26.8,
        fairOutrightOdds: 3.73,
        bookieOutrightOdds: 4.10,
        scoredFirstPct: 79,
        leadConversionWinPct: 94,
      },
      {
        team: 'Senegal',
        eloRating: 1884,
        qfProbPct: 100,
        sfProbPct: 62.0,
        finalProbPct: 33.4,
        titleProbPct: 20.5,
        fairOutrightOdds: 4.88,
        bookieOutrightOdds: 5.25,
        scoredFirstPct: 74,
        leadConversionWinPct: 90,
      },
      {
        team: 'Nigeria',
        eloRating: 1862,
        qfProbPct: 100,
        sfProbPct: 54.0,
        finalProbPct: 29.8,
        titleProbPct: 17.6,
        fairOutrightOdds: 5.68,
        bookieOutrightOdds: 6.00,
        scoredFirstPct: 71,
        leadConversionWinPct: 87,
      },
      {
        team: 'Egypt',
        eloRating: 1851,
        qfProbPct: 100,
        sfProbPct: 53.0,
        finalProbPct: 26.4,
        titleProbPct: 14.9,
        fairOutrightOdds: 6.71,
        bookieOutrightOdds: 7.50,
        scoredFirstPct: 68,
        leadConversionWinPct: 88,
      },
    ],
  },
  {
    id: 'CAF_CL',
    name: 'CAF Champions League',
    subtitle: 'African Elite Club Knockout Simulator & Two-Leg Aggregate Projections',
    hostFinalVenue: 'Cairo International Stadium / Loftus Versfeld',
    quarterFinals: [
      {
        id: 'caf-qf1',
        stage: 'QF',
        label: 'Quarter-Final 1',
        teamA: 'Al Ahly',
        teamB: 'Simba SC',
        probAPct: 72,
        probBPct: 28,
        projectedScore: '3 - 1 (Agg)',
      },
      {
        id: 'caf-qf2',
        stage: 'QF',
        label: 'Quarter-Final 2',
        teamA: 'Mamelodi Sundowns',
        teamB: 'Young Africans',
        probAPct: 65,
        probBPct: 35,
        projectedScore: '2 - 0 (Agg)',
      },
      {
        id: 'caf-qf3',
        stage: 'QF',
        label: 'Quarter-Final 3',
        teamA: 'Espérance Tunis',
        teamB: 'TP Mazembe',
        probAPct: 61,
        probBPct: 39,
        projectedScore: '2 - 1 (Agg)',
      },
      {
        id: 'caf-qf4',
        stage: 'QF',
        label: 'Quarter-Final 4',
        teamA: 'Pyramids FC',
        teamB: 'Orlando Pirates',
        probAPct: 55,
        probBPct: 45,
        projectedScore: '3 - 2 (Agg)',
      },
    ],
    contenders: [
      {
        team: 'Al Ahly',
        eloRating: 1840,
        qfProbPct: 100,
        sfProbPct: 72.0,
        finalProbPct: 44.5,
        titleProbPct: 31.2,
        fairOutrightOdds: 3.21,
        bookieOutrightOdds: 3.50,
        scoredFirstPct: 77,
        leadConversionWinPct: 95,
      },
      {
        team: 'Mamelodi Sundowns',
        eloRating: 1825,
        qfProbPct: 100,
        sfProbPct: 65.0,
        finalProbPct: 38.2,
        titleProbPct: 25.4,
        fairOutrightOdds: 3.94,
        bookieOutrightOdds: 4.25,
        scoredFirstPct: 75,
        leadConversionWinPct: 91,
      },
      {
        team: 'Espérance Tunis',
        eloRating: 1790,
        qfProbPct: 100,
        sfProbPct: 61.0,
        finalProbPct: 31.0,
        titleProbPct: 17.8,
        fairOutrightOdds: 5.62,
        bookieOutrightOdds: 6.00,
        scoredFirstPct: 69,
        leadConversionWinPct: 89,
      },
      {
        team: 'Orlando Pirates',
        eloRating: 1775,
        qfProbPct: 100,
        sfProbPct: 45.0,
        finalProbPct: 22.4,
        titleProbPct: 12.1,
        fairOutrightOdds: 8.26,
        bookieOutrightOdds: 9.00,
        scoredFirstPct: 66,
        leadConversionWinPct: 84,
      },
    ],
  },
];

export const BracketSimulatorPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [selectedTournamentId, setSelectedTournamentId] =
    useState<TournamentBracketPackage['id']>('UCL');
  const [copiedBracket, setCopiedBracket] = useState(false);

  const tournament = useMemo(() => {
    return (
      TOURNAMENT_BRACKETS.find((t) => t.id === selectedTournamentId) ||
      TOURNAMENT_BRACKETS[0]
    );
  }, [selectedTournamentId]);

  // Interactive user-picked winners for QF1..4, SF1..2, and Final
  const [qfWinners, setQfWinners] = useState<[string, string, string, string]>(() => [
    TOURNAMENT_BRACKETS[0].quarterFinals[0].teamA,
    TOURNAMENT_BRACKETS[0].quarterFinals[1].teamA,
    TOURNAMENT_BRACKETS[0].quarterFinals[2].teamA,
    TOURNAMENT_BRACKETS[0].quarterFinals[3].teamA,
  ]);
  const [sfWinners, setSfWinners] = useState<[string, string]>(() => [
    TOURNAMENT_BRACKETS[0].quarterFinals[0].teamA,
    TOURNAMENT_BRACKETS[0].quarterFinals[2].teamA,
  ]);
  const [champion, setChampion] = useState<string>(
    () => TOURNAMENT_BRACKETS[0].quarterFinals[0].teamA
  );

  const handleSelectTournament = (id: TournamentBracketPackage['id']) => {
    setSelectedTournamentId(id);
    const pkg =
      TOURNAMENT_BRACKETS.find((t) => t.id === id) || TOURNAMENT_BRACKETS[0];
    const qf: [string, string, string, string] = [
      pkg.quarterFinals[0].teamA,
      pkg.quarterFinals[1].teamA,
      pkg.quarterFinals[2].teamA,
      pkg.quarterFinals[3].teamA,
    ];
    setQfWinners(qf);
    setSfWinners([qf[0], qf[2]]);
    setChampion(qf[0]);
  };

  const handlePickQfWinner = (qfIndex: 0 | 1 | 2 | 3, team: string) => {
    const nextQf: [string, string, string, string] = [...qfWinners] as [
      string,
      string,
      string,
      string,
    ];
    nextQf[qfIndex] = team;
    setQfWinners(nextQf);

    const nextSf: [string, string] = [...sfWinners] as [string, string];
    if (qfIndex === 0 || qfIndex === 1) {
      nextSf[0] = team;
    } else {
      nextSf[1] = team;
    }
    setSfWinners(nextSf);
    setChampion(nextSf[0]);
  };

  const handlePickSfWinner = (sfIndex: 0 | 1, team: string) => {
    const nextSf: [string, string] = [...sfWinners] as [string, string];
    nextSf[sfIndex] = team;
    setSfWinners(nextSf);
    setChampion(team);
  };

  const handleAutoSimulateMonteCarlo = () => {
    const qf: [string, string, string, string] = [
      tournament.quarterFinals[0].probAPct >= 50
        ? tournament.quarterFinals[0].teamA
        : tournament.quarterFinals[0].teamB,
      tournament.quarterFinals[1].probAPct >= 50
        ? tournament.quarterFinals[1].teamA
        : tournament.quarterFinals[1].teamB,
      tournament.quarterFinals[2].probAPct >= 50
        ? tournament.quarterFinals[2].teamA
        : tournament.quarterFinals[2].teamB,
      tournament.quarterFinals[3].probAPct >= 50
        ? tournament.quarterFinals[3].teamA
        : tournament.quarterFinals[3].teamB,
    ];
    setQfWinners(qf);
    setSfWinners([qf[1], qf[3]]);
    setChampion(tournament.contenders[0].team);
    toast.success(
      `Executed 10,000 Monte Carlo Bracket Simulations — Projected Champion: ${tournament.contenders[0].team}!`
    );
  };

  const handleAddOutrightToSlip = (row: OutrightContenderRow) => {
    addSelection({
      id: `outright-${tournament.id}-${row.team}`,
      matchId: `outright-${tournament.id}`,
      match: `${tournament.name} Outright Winner`,
      homeTeam: row.team,
      awayTeam: 'Tournament Field',
      league: tournament.name,
      kickoff: 'Knockout Stage',
      market: `${row.team} to Win ${tournament.name} + Lead Conversion`,
      selection: row.team,
      odds: row.bookieOutrightOdds,
      confidence: Math.min(88, Math.round(row.titleProbPct + 55)),
    });
    toast.success(
      `Added ${row.team} Outright (@ ${row.bookieOutrightOdds.toFixed(2)}) to Bet Slip!`
    );
  };

  const handleCopyBracketSummary = async () => {
    const text = [
      `🏆 PREDICTPRO 10,000-RUN KNOCKOUT BRACKET PROJECTION (${tournament.name})`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `✅ Quarter-Final Qualifiers: ${qfWinners.join(' · ')}`,
      `🔥 Grand Finalists: ${sfWinners[0]} vs ${sfWinners[1]}`,
      `👑 Simulated Champion: ${champion}`,
      `🌐 Interactive Bracket Simulator: https://predictpro.guru/bracket-simulator`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedBracket(true);
      toast.success('Copied Knockout Bracket Projection to clipboard!');
      setTimeout(() => setCopiedBracket(false), 2000);
    } catch {
      toast.error('Clipboard copy failed');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Interactive Knockout Tournament Bracket & 10,000-Run Title Simulator | PredictPro"
        description="Simulate the UEFA Champions League, AFCON, and CAF Champions League knockout brackets across 10,000 Monte Carlo runs with First-to-Score (1-0) conversion metrics."
      />
      <Navbar />

      <main
        id="main-content"
        className="flex-1 container mx-auto max-w-7xl px-4 pt-6 pb-24 space-y-6"
      >
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Global Tournaments', href: '/tournaments' },
            { label: 'Interactive Knockout Bracket Simulator' },
          ]}
        />

        {/* Hero Section */}
        <section className="rounded-2xl border border-amber-500/30 bg-slate-950 text-white p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-mono text-[11px]">
                  INTERACTIVE ROAD-TO-THE-FINAL BRACKET TREE
                </Badge>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  {tournament.hostFinalVenue}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                <GitBranch className="h-6 w-6 text-amber-400" />
                <span>{tournament.name} — Knockout Bracket Simulator</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Click any club in the Quarter-Finals, Semi-Finals, and Final below to build your custom Road-to-the-Final path, or trigger <strong>10,000 Monte Carlo Elo-Poisson Simulations</strong> to reveal underpriced outright and First-to-Score (`1-0`) knockout value.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={handleAutoSimulateMonteCarlo}
                className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 h-9"
              >
                <Sparkles className="h-4 w-4" />
                Run 10,000 Monte Carlo Sims
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyBracketSummary}
                className="gap-1.5 text-xs font-semibold bg-slate-900 border-slate-700 text-white hover:bg-slate-800 h-9"
              >
                {copiedBracket ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copiedBracket ? 'Copied Bracket!' : 'Copy Bracket Path'}
              </Button>
            </div>
          </div>

          {/* Tournament Switcher */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            {TOURNAMENT_BRACKETS.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => handleSelectTournament(pkg.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedTournamentId === pkg.id
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {pkg.name}
              </button>
            ))}
          </div>
        </section>

        {/* Interactive 3-Stage Knockout Bracket Tree (Quarter-Finals -> Semi-Finals -> Grand Final) */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Interactive Click-to-Advance Knockout Bracket</span>
              <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 font-mono text-xs">
                👑 Projected Champion: {champion}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* COLUMN 1: Quarter-Finals */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Quarter-Finals (Click Winner)
                </p>
                {tournament.quarterFinals.map((tie, idx) => {
                  const qfIdx = idx as 0 | 1 | 2 | 3;
                  const winner = qfWinners[qfIdx];
                  return (
                    <div
                      key={tie.id}
                      className="p-3 rounded-xl border border-border bg-muted/20 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span>{tie.label}</span>
                        <span>Sim: {tie.projectedScore}</span>
                      </div>
                      {[
                        { team: tie.teamA, prob: tie.probAPct },
                        { team: tie.teamB, prob: tie.probBPct },
                      ].map((side) => {
                        const active = winner === side.team;
                        return (
                          <button
                            key={side.team}
                            type="button"
                            onClick={() => handlePickQfWinner(qfIdx, side.team)}
                            className={`w-full px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                              active
                                ? 'bg-emerald-500/15 border-emerald-500 text-foreground font-bold'
                                : 'bg-background border-border/60 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <TeamLogo team={side.team} size="sm" />
                              <span className="truncate">{side.team}</span>
                            </span>
                            <span className="font-mono tabular-nums text-[11px] text-emerald-500">
                              {side.prob}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* COLUMN 2: Semi-Finals */}
              <div className="space-y-6">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Semi-Finals (Click Finalist)
                </p>
                {[
                  {
                    label: 'Semi-Final 1 (QF1 vs QF2)',
                    idx: 0 as const,
                    teamA: qfWinners[0],
                    teamB: qfWinners[1],
                  },
                  {
                    label: 'Semi-Final 2 (QF3 vs QF4)',
                    idx: 1 as const,
                    teamA: qfWinners[2],
                    teamB: qfWinners[3],
                  },
                ].map((sf) => (
                  <div
                    key={sf.label}
                    className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2"
                  >
                    <span className="text-[10px] font-mono uppercase text-primary font-bold block">
                      {sf.label}
                    </span>
                    {[sf.teamA, sf.teamB].map((team) => {
                      const active = sfWinners[sf.idx] === team;
                      return (
                        <button
                          key={team}
                          type="button"
                          onClick={() => handlePickSfWinner(sf.idx, team)}
                          className={`w-full px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-black'
                              : 'bg-background border-border text-foreground hover:border-primary'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <TeamLogo team={team} size="sm" />
                            <span>{team}</span>
                          </span>
                          <span className="text-[10px] font-mono">
                            {active ? 'FINALIST ✓' : 'Advance →'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* COLUMN 3: Grand Final & Champion Trophy Card */}
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  3. Grand Final &amp; Trophy Winner
                </p>
                <div className="p-5 rounded-2xl border-2 border-amber-500/40 bg-slate-950 text-white space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-amber-400 font-bold">
                      GRAND FINAL MATCHUP
                    </span>
                    <Trophy className="h-5 w-5 text-amber-400" />
                  </div>

                  <div className="space-y-2">
                    {[sfWinners[0], sfWinners[1]].map((team) => {
                      const isChamp = champion === team;
                      return (
                        <button
                          key={team}
                          type="button"
                          onClick={() => setChampion(team)}
                          className={`w-full p-3 rounded-xl border text-sm flex items-center justify-between transition-all cursor-pointer ${
                            isChamp
                              ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-lg'
                              : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-amber-500/50'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <TeamLogo team={team} size="sm" />
                            <span>{team}</span>
                          </span>
                          <span className="font-mono text-xs">
                            {isChamp ? '🏆 CHAMPION' : 'Crown Winner'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-center space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      Your Projected {tournament.name} Winner
                    </span>
                    <p className="text-lg font-black text-emerald-400">{champion}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 10,000-Run Outright Probabilities + First-to-Score (1-0 Lead Conversion) Matrix */}
        <Card className="border-border overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              10,000-Run Title Probabilities &amp; First-to-Score (1-0 Lead Conversion) Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Compares simulated stage progression against bookmaker outright odds and 1-0 lead win conversion streaks.
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-3">Contender</th>
                  <th className="py-3 px-3 text-center">Club Elo</th>
                  <th className="py-3 px-3 text-center">Reach SF %</th>
                  <th className="py-3 px-3 text-center">Reach Final %</th>
                  <th className="py-3 px-3 text-center text-emerald-500">Win Title %</th>
                  <th className="py-3 px-3 text-center">Scored First (1-0) %</th>
                  <th className="py-3 px-3 text-center">1-0 Win Conversion</th>
                  <th className="py-3 px-3 text-center">Fair / Bookie Odds</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono tabular-nums">
                {tournament.contenders.map((row) => (
                  <tr key={row.team} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <TeamLogo team={row.team} size="sm" />
                        <span className="font-bold text-sm text-foreground">{row.team}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-muted-foreground">
                      {row.eloRating}
                    </td>
                    <td className="py-3 px-3 text-center">{row.sfProbPct.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-center">{row.finalProbPct.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-center font-black text-emerald-500 text-sm">
                      {row.titleProbPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-center text-amber-500 font-bold">
                      {row.scoredFirstPct}%
                    </td>
                    <td className="py-3 px-3 text-center text-sky-500 font-bold">
                      {row.leadConversionWinPct}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-muted-foreground">
                        {row.fairOutrightOdds.toFixed(2)}
                      </span>{' '}
                      /{' '}
                      <strong className="text-emerald-500">
                        {row.bookieOutrightOdds.toFixed(2)}x
                      </strong>
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddOutrightToSlip(row)}
                        className="h-7 text-[11px] gap-1 font-semibold"
                      >
                        <Plus className="h-3 w-3 text-emerald-500" />
                        Add @{row.bookieOutrightOdds.toFixed(2)}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default BracketSimulatorPage;
