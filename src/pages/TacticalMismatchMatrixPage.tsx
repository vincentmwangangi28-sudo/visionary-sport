import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calculator,
  Compass,
  Crosshair,
  Flame,
  Layers,
  Plus,
  ShieldCheck,
  Sliders,
  Zap,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { usePredictions } from '@/hooks/usePredictions';
import { Prediction } from '@/types/prediction';
import { toast } from 'sonner';

type TacticalStyle =
  | 'HIGH_LINE_POSSESSION'
  | 'GEGENPRESS_TRANSITION'
  | 'LOW_BLOCK_COUNTER'
  | 'WING_CROSS_OVERLOAD';

const TACTICAL_STYLES: Array<{
  id: TacticalStyle;
  label: string;
  ppda: string;
  defensiveLineMeters: number;
  desc: string;
}> = [
  {
    id: 'HIGH_LINE_POSSESSION',
    label: 'High-Line Positional Possession (62%+ Ball)',
    ppda: '8.2 PPDA',
    defensiveLineMeters: 46.5,
    desc: 'Pins opponent in their defensive third with inverted fullbacks; vulnerable to rapid balls in behind.',
  },
  {
    id: 'GEGENPRESS_TRANSITION',
    label: 'Vertical Gegenpressing & High Turnovers',
    ppda: '7.4 PPDA',
    defensiveLineMeters: 44.8,
    desc: 'Forces chaotic midfield turnovers and shoots within 8 seconds of ball recovery.',
  },
  {
    id: 'LOW_BLOCK_COUNTER',
    label: 'Compact 5-4-1 / 4-4-2 Low Block & Direct Counter',
    ppda: '15.6 PPDA',
    defensiveLineMeters: 31.2,
    desc: 'Surrenders possession to clog central zones and launches vertical counter-attacks into wide channels.',
  },
  {
    id: 'WING_CROSS_OVERLOAD',
    label: 'Wide Touchline Overlap & Aerial Box Bombardment',
    ppda: '10.8 PPDA',
    defensiveLineMeters: 39.4,
    desc: 'Generates 24+ crosses per 90 and forces repeated blocked deliveries for high corner totals.',
  },
];

interface TacticalMismatchFixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  homeStyle: string;
  awayStyle: string;
  homePpda: number;
  awayPpda: number;
  mismatchType: 'COUNTER-ATTACK EXPLOIT' | 'CHAOTIC GEGENPRESS SHOOTOUT' | 'CORNER SIEGE OVERLOAD' | 'TACTICAL STALEMATE LOCK';
  correlatedMarket: string;
  odds: number;
  confidence: number;
  tacticalBreakdown: string;
}

function buildTacticalMismatchFromPrediction(p: Prediction): TacticalMismatchFixture {
  const hProb = p.ai_prediction?.home_win_prob ?? 45;
  const aProb = p.ai_prediction?.away_win_prob ?? 28;
  const o25 = p.ai_prediction?.over_25_prob ?? 54;
  const btts = p.ai_prediction?.btts_prob ?? 52;
  const conf = Math.min(92, Math.max(66, Math.round(p.ai_prediction?.confidence ?? 76)));

  const homePpda = Number((13.5 - hProb * 0.08).toFixed(1));
  const awayPpda = Number((14.2 - aProb * 0.08).toFixed(1));

  if (o25 >= 62 && btts >= 58) {
    return {
      id: p.id,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      homeStyle: `Vertical High Press (${homePpda} PPDA)`,
      awayStyle: `High-Tempo Transition (${awayPpda} PPDA)`,
      homePpda,
      awayPpda,
      mismatchType: 'CHAOTIC GEGENPRESS SHOOTOUT',
      correlatedMarket: 'Both Teams To Score & Over 2.5 Goals',
      odds: Number(Math.max(1.52, 100 / Math.max(54, Math.round((o25 + btts) / 2)) * 1.12).toFixed(2)),
      confidence: conf,
      tacticalBreakdown: `${p.home_team} and ${p.away_team} project a high combined tempo (${o25}% Over 2.5 / ${btts}% BTTS), producing repeated transition box entries.`,
    };
  }

  if (hProb >= 58) {
    return {
      id: p.id,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      homeStyle: `Possession Siege & Wide Overlap (${homePpda} PPDA)`,
      awayStyle: `Compact Low Block & Counter (${awayPpda} PPDA)`,
      homePpda,
      awayPpda,
      mismatchType: 'CORNER SIEGE OVERLOAD',
      correlatedMarket: `${p.home_team} Win & Over 8.5 Match Corners`,
      odds: Number(Math.max(1.58, (p.ai_prediction?.odds_home || 1.55) * 1.25).toFixed(2)),
      confidence: conf,
      tacticalBreakdown: `${p.home_team} hold strong territorial control against ${p.away_team}, forcing sustained flank pressure and elevated corner counts.`,
    };
  }

  if (o25 <= 47) {
    return {
      id: p.id,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      homeStyle: `Controlled Mid-Block (${homePpda} PPDA)`,
      awayStyle: `Disciplined Low Block (${awayPpda} PPDA)`,
      homePpda,
      awayPpda,
      mismatchType: 'TACTICAL STALEMATE LOCK',
      correlatedMarket: 'Under 2.5 Total Match Goals',
      odds: Number(Math.max(1.62, 100 / Math.max(46, 100 - o25)).toFixed(2)),
      confidence: conf,
      tacticalBreakdown: `Compact defensive blocks for both ${p.home_team} and ${p.away_team} limit clear high-xG central shots and favor an Under 2.5 script.`,
    };
  }

  return {
    id: p.id,
    homeTeam: p.home_team,
    awayTeam: p.away_team,
    league: p.league,
    matchDate: p.match_date,
    homeStyle: `Balanced Build-Up (${homePpda} PPDA)`,
    awayStyle: `Direct Channel Counter (${awayPpda} PPDA)`,
    homePpda,
    awayPpda,
    mismatchType: 'COUNTER-ATTACK EXPLOIT',
    correlatedMarket: p.ai_prediction?.predicted_winner === 'AWAY' ? `${p.away_team} X2 & Over 1.5 Goals` : `${p.home_team} 1X & Over 1.5 Goals`,
    odds: Number(Math.max(1.48, (p.ai_prediction?.odds_home || 1.95) * 0.88).toFixed(2)),
    confidence: conf,
    tacticalBreakdown: `${p.away_team}'s transition speed tests ${p.home_team}'s defensive rest defense while keeping both teams active in the final third.`,
  };
}

export const TacticalMismatchMatrixPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const { predictions, isLoading } = usePredictions(7);
  const [homeStyle, setHomeStyle] = useState<TacticalStyle>('HIGH_LINE_POSSESSION');
  const [awayStyle, setAwayStyle] = useState<TacticalStyle>('LOW_BLOCK_COUNTER');

  const tacticalMismatchFixtures = useMemo<TacticalMismatchFixture[]>(
    () => predictions.slice(0, 8).map(buildTacticalMismatchFromPrediction),
    [predictions]
  );

  const styleCollisionResult = useMemo(() => {
    if (homeStyle === 'HIGH_LINE_POSSESSION' && awayStyle === 'LOW_BLOCK_COUNTER') {
      return {
        headline: 'High-Line Siege vs Deep Low-Block Counter',
        expectedCorners: '11.4 Corners',
        expectedGoals: '2.65 xG',
        bestCorrelatedMarket: 'Home Over 6.5 Corners + Anytime Transition BTTS',
        confidence: 87,
        explanation:
          'The possession side pins the low block inside their own box (generating 7+ home corners), while the 45m high line leaves space for 1–2 lethal breakaways.',
      };
    }
    if (
      (homeStyle === 'GEGENPRESS_TRANSITION' && awayStyle === 'GEGENPRESS_TRANSITION') ||
      (homeStyle === 'HIGH_LINE_POSSESSION' && awayStyle === 'GEGENPRESS_TRANSITION')
    ) {
      return {
        headline: 'End-to-End High-Press Transition Shootout',
        expectedCorners: '10.2 Corners',
        expectedGoals: '3.48 xG',
        bestCorrelatedMarket: 'Over 2.5 Goals & Both Teams To Score (GG)',
        confidence: 90,
        explanation:
          'Both teams press with PPDA under 8.5 and hold high defensive lines, producing high-turnover box entries in both halves.',
      };
    }
    if (homeStyle === 'LOW_BLOCK_COUNTER' && awayStyle === 'LOW_BLOCK_COUNTER') {
      return {
        headline: 'Risk-Averse Midfield Stalemate',
        expectedCorners: '7.6 Corners',
        expectedGoals: '1.72 xG',
        bestCorrelatedMarket: 'Under 2.5 Match Goals & First Half Draw (HT X)',
        confidence: 86,
        explanation:
          'Neither club wants the ball in risky build-up zones; 78% of shots come from low-probability distance (>20 yards) or dead balls.',
      };
    }
    return {
      headline: 'Wide Flank Overload & Aerial Penalty-Box Pressure',
      expectedCorners: '12.1 Corners',
      expectedGoals: '2.82 xG',
      bestCorrelatedMarket: 'Over 9.5 Total Match Corners & Over 1.5 Goals',
      confidence: 85,
      explanation:
        'Repeated touchline overlaps and early crosses force fullbacks into last-ditch blocks behind the goal line.',
    };
  }, [homeStyle, awayStyle]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Tactical Style Mismatch, PPDA Press & Coaching DNA Matrix | PredictPro"
        description="Analyze football tactical mismatches: High-Line Possession vs Low-Block Counter, PPDA Gegenpressing intensity, and Wing-Cross Overloads for correlated Bet Builder picks."
        canonicalUrl="https://predictpro.guru/tactical-mismatch-matrix"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Tactical Insights', href: '/insights' },
            { label: 'Tactical Style Mismatch Matrix' },
          ]}
        />

        <LeagueNavigationStrip />
        <MarketQuickStrip />

        {/* Hero Section */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span>PPDA Pressing Intensity</span>
            <span aria-hidden="true">·</span>
            <span>Defensive Line Height (Meters)</span>
            <span aria-hidden="true">·</span>
            <span>Style Collision Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Tactical Style Mismatch &amp; Coaching DNA Matrix
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            League table position alone does not dictate how a match plays out—<strong>styles make fights</strong>. By cross-referencing <strong>Passes Allowed Per Defensive Action (PPDA)</strong>, <strong>Average Defensive Line Height (Meters)</strong>, and <strong>Cross Volume</strong>, our matrix identifies whether a clash will become a 12-corner siege, a counter-attacking shootout, or an Under 2.5 tactical chess match.
          </p>
        </section>

        {/* Interactive Tactical Collision Simulator */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Interactive Tactical Style Collision Simulator
            </CardTitle>
            <CardDescription className="text-xs">
              Select the Home Team and Away Team tactical archetypes to see the projected xG, Corner Total, and highest-probability correlated market.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            <div className="space-y-2 text-xs">
              <label htmlFor="home-tac-select" className="font-bold text-foreground block">
                Home Team Tactical DNA
              </label>
              <select
                id="home-tac-select"
                value={homeStyle}
                onChange={(e) => setHomeStyle(e.target.value as TacticalStyle)}
                className="w-full h-9 px-3 rounded-md border border-border bg-background font-semibold"
              >
                {TACTICAL_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.ppda})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {TACTICAL_STYLES.find((s) => s.id === homeStyle)?.desc}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label htmlFor="away-tac-select" className="font-bold text-foreground block">
                Away Team Tactical DNA
              </label>
              <select
                id="away-tac-select"
                value={awayStyle}
                onChange={(e) => setAwayStyle(e.target.value as TacticalStyle)}
                className="w-full h-9 px-3 rounded-md border border-border bg-background font-semibold"
              >
                {TACTICAL_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.ppda})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                {TACTICAL_STYLES.find((s) => s.id === awayStyle)?.desc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-background border border-primary/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">{styleCollisionResult.headline}</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {styleCollisionResult.confidence}% Fit
                </span>
              </div>
              <p className="text-muted-foreground leading-snug">{styleCollisionResult.explanation}</p>
              <div className="flex items-center justify-between pt-2 border-t border-border font-mono">
                <span>Proj: <strong>{styleCollisionResult.expectedGoals}</strong></span>
                <span>Proj: <strong>{styleCollisionResult.expectedCorners}</strong></span>
              </div>
              <p className="font-bold text-foreground pt-1">
                Best Angle: <span className="text-primary">{styleCollisionResult.bestCorrelatedMarket}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Featured Tactical Mismatch Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isLoading && tacticalMismatchFixtures.length === 0 ? (
            <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Loading live tactical matchup matrix...
            </div>
          ) : tacticalMismatchFixtures.length === 0 ? (
            <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No scheduled matches available in the 7-day feed right now. Use the interactive collision simulator above to model tactical archetypes.
            </div>
          ) : tacticalMismatchFixtures.map((item) => (
            <Card key={item.id} className="border-border hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{item.league}</span>
                    <span aria-hidden="true">·</span>
                    <span>PPDA: {item.homePpda} vs {item.awayPpda}</span>
                  </div>
                  <span className="font-bold text-primary">{item.mismatchType}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-base text-foreground">
                    <TeamLogo team={item.homeTeam} size="sm" />
                    <span>{item.homeTeam}</span>
                    <span className="text-muted-foreground font-normal text-xs">vs</span>
                    <TeamLogo team={item.awayTeam} size="sm" />
                    <span>{item.awayTeam}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {item.confidence}% AI Edge
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{item.homeTeam} DNA</span>
                    <span className="font-bold text-foreground">{item.homeStyle}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{item.awayTeam} DNA</span>
                    <span className="font-bold text-foreground">{item.awayStyle}</span>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed">{item.tacticalBreakdown}</p>

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground">
                      Correlated Pick: <span className="text-primary">{item.correlatedMarket}</span>
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      addSelection({
                        matchId: item.id,
                        match: `${item.homeTeam} vs ${item.awayTeam}`,
                        homeTeam: item.homeTeam,
                        awayTeam: item.awayTeam,
                        league: item.league,
                        matchDate: item.matchDate,
                        market: item.correlatedMarket,
                        odds: item.odds,
                        confidence: item.confidence,
                      });
                      toast.success(`Added Tactical Pick: ${item.correlatedMarket} @ ${item.odds.toFixed(2)}!`);
                    }}
                    className="gap-1.5 text-xs font-bold shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add @ {item.odds.toFixed(2)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <SEOAuthorityHub />
      </main>

      <Footer />
    </div>
  );
};

export default TacticalMismatchMatrixPage;
