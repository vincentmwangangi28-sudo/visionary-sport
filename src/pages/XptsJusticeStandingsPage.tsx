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
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Plus,
  Scale,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  XPTS_JUSTICE_STANDINGS,
  XptsTeamStandingRow,
} from '@/services/pitchTelemetryAndXptsService';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

type StandingsViewMode = 'XPTS_JUSTICE' | 'ACTUAL' | 'HOME_ONLY' | 'AWAY_ONLY' | 'FIRST_HALF';

export const XptsJusticeStandingsPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [viewMode, setViewMode] = useState<StandingsViewMode>('XPTS_JUSTICE');

  const sortedRows = useMemo(() => {
    const copy = [...XPTS_JUSTICE_STANDINGS];
    if (viewMode === 'XPTS_JUSTICE') {
      return copy.sort((a, b) => b.xPTS - a.xPTS);
    }
    if (viewMode === 'HOME_ONLY') {
      return copy.sort((a, b) => b.homePoints - a.homePoints);
    }
    if (viewMode === 'AWAY_ONLY') {
      return copy.sort((a, b) => b.awayPoints - a.awayPoints);
    }
    if (viewMode === 'FIRST_HALF') {
      return copy.sort((a, b) => b.firstHalfPoints - a.firstHalfPoints);
    }
    return copy.sort((a, b) => b.actualPoints - a.actualPoints);
  }, [viewMode]);

  const handleAddRegressionPlay = (row: XptsTeamStandingRow) => {
    addSelection({
      id: `xpts-${row.club}-${Date.now()}`,
      matchId: `xpts-${row.club}`,
      match: `${row.club} (Next League Fixture)`,
      homeTeam: row.club,
      awayTeam: 'Next Opponent',
      league: row.league,
      kickoff: 'Upcoming Matchday',
      market: row.nextFixtureMarket,
      selection: row.nextFixtureMarket,
      odds: row.nextFixtureOdds,
      confidence: row.regressionSignal === 'STRONG BUY (UNLUCKY)' ? 85 : 78,
    });
    toast.success(`Added ${row.club} xPTS Regression Pick (${row.nextFixtureMarket}) to Slip!`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Expected Points (xPTS) Justice Table & Home/Away/1st-Half Form Standings | PredictPro"
        description="Compare actual league points against Poisson-simulated Expected Points (xPTS), Expected Goal Difference (xGD), Home/Away splits, and First-Half tables to spot unlucky value teams."
      />
      <Navbar />

      <main
        id="main-content"
        className="flex-1 container mx-auto max-w-7xl px-4 pt-6 pb-24 space-y-6"
      >
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'League Standings', href: '/standings' },
            { label: 'Expected Points (xPTS) Justice Table' },
          ]}
        />

        {/* Hero Section */}
        <section className="rounded-2xl border border-sky-500/30 bg-slate-950 text-white p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono text-[11px]">
                  EXPECTED POINTS (xPTS) &amp; VARIANCE REGRESSION TABLE
                </Badge>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  Home / Away / 1st-Half / xGD Justice Filter
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                <Scale className="h-6 w-6 text-emerald-400" />
                <span>Expected Points (xPTS) Justice Standings &amp; Form Splits</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                League tables lie over small sample sizes due to woodwork hits and goalkeeper variance. Our <strong>xPTS Justice Table</strong> simulates every match’s shot-by-shot Expected Goals 10,000 times to reveal <strong>Underperforming Value Clubs</strong> (positive Justice Delta) primed for a winning streak vs. <strong>Overperforming Fade Clubs</strong>.
              </p>
            </div>

            <Link to="/pitch-telemetry">
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800"
              >
                Open 2D Pitch Shot Map &amp; Momentum Wave &rarr;
              </Button>
            </Link>
          </div>

          {/* 5-Way Table Mode Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
            {(
              [
                { id: 'XPTS_JUSTICE', label: '⚖️ xPTS Justice Rank' },
                { id: 'ACTUAL', label: '🏆 Actual Points Table' },
                { id: 'HOME_ONLY', label: '🏟️ Home-Only Form Table' },
                { id: 'AWAY_ONLY', label: '✈️ Away-Only Form Table' },
                { id: 'FIRST_HALF', label: '⏱️ 1st-Half (HT) Table' },
              ] as Array<{ id: StandingsViewMode; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === tab.id
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Justice Table */}
        <Card className="border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Club</th>
                  <th className="py-3 px-3 text-center">P</th>
                  <th className="py-3 px-3 text-center">Actual PTS</th>
                  <th className="py-3 px-3 text-center text-emerald-500">xPTS (Sim)</th>
                  <th className="py-3 px-3 text-center">xGF / xGA</th>
                  <th className="py-3 px-3 text-center">xGD</th>
                  <th className="py-3 px-3 text-center">Home / Away / HT PTS</th>
                  <th className="py-3 px-3 text-center">Justice Delta</th>
                  <th className="py-3 px-3">Regression Signal</th>
                  <th className="py-3 px-3 text-right">Next Value Edge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono tabular-nums">
                {sortedRows.map((row, idx) => {
                  const ptsDiff = Number((row.xPTS - row.actualPoints).toFixed(1));
                  return (
                    <tr
                      key={row.club}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-3 font-black text-foreground">
                        #{idx + 1}
                        <span className="text-[10px] text-muted-foreground ml-1">
                          (Act #{row.actualRank})
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-2">
                          <TeamLogo team={row.club} size="sm" />
                          <span className="font-bold text-sm text-foreground">{row.club}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-muted-foreground">
                        {row.played}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-foreground">
                        {row.actualPoints}
                      </td>
                      <td className="py-3 px-3 text-center font-black text-sm text-emerald-500">
                        {row.xPTS.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center text-muted-foreground">
                        {row.xGF.toFixed(1)} / {row.xGA.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-sky-500">
                        {row.xGD >= 0 ? '+' : ''}
                        {row.xGD.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center text-muted-foreground">
                        {row.homePoints} / {row.awayPoints} / {row.firstHalfPoints}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-bold text-[11px] ${
                            ptsDiff >= 2.0
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : ptsDiff <= -3.0
                              ? 'bg-rose-500/15 text-rose-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {ptsDiff >= 0 ? '+' : ''}
                          {ptsDiff} xPTS
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            row.regressionSignal.includes('BUY')
                              ? 'text-emerald-500 border-emerald-500/40 bg-emerald-500/10'
                              : row.regressionSignal.includes('FADE')
                              ? 'text-rose-500 border-rose-500/40 bg-rose-500/10'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {row.regressionSignal}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddRegressionPlay(row)}
                          className="h-7 text-[11px] gap-1 font-semibold"
                        >
                          <Plus className="h-3 w-3 text-emerald-500" />
                          {row.nextFixtureMarket} (@{row.nextFixtureOdds.toFixed(2)})
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default XptsJusticeStandingsPage;
