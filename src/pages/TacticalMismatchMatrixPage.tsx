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

const TACTICAL_MISMATCH_FIXTURES: TacticalMismatchFixture[] = [
  {
    id: 'tac-bar-rma',
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    league: 'La Liga',
    homeStyle: '48m Ultra-High Offside Line',
    awayStyle: 'Direct Vertical Channel Runners (Mbappé / Vinícius)',
    homePpda: 7.6,
    awayPpda: 10.4,
    mismatchType: 'COUNTER-ATTACK EXPLOIT',
    correlatedMarket: 'Both Teams To Score & Over 2.5 Goals',
    odds: 1.66,
    confidence: 89,
    tacticalBreakdown:
      'Barcelona’s 48-meter defensive line creates elite offside traps but leaves 40 yards of open grass behind for Real Madrid’s transition speed.',
  },
  {
    id: 'tac-ars-new',
    homeTeam: 'Arsenal',
    awayTeam: 'Everton',
    league: 'Premier League',
    homeStyle: 'Wide Touchline Siege + Set-Piece Overload',
    awayStyle: 'Deep 4-5-1 Six-Yard Box Shell',
    homePpda: 8.1,
    awayPpda: 16.2,
    mismatchType: 'CORNER SIEGE OVERLOAD',
    correlatedMarket: 'Arsenal Over 6.5 Team Corners & Win',
    odds: 1.78,
    confidence: 86,
    tacticalBreakdown:
      'When Arsenal face a deep low block (>15.0 PPDA), 38% of their final-third entries end in deflected byline crosses, averaging 8.4 team corners.',
  },
  {
    id: 'tac-liv-tot',
    homeTeam: 'Liverpool',
    awayTeam: 'Tottenham',
    league: 'Premier League',
    homeStyle: 'Vertical Gegenpress (7.8 PPDA)',
    awayStyle: 'High-Line Build-From-Back (46m Line)',
    homePpda: 7.8,
    awayPpda: 8.3,
    mismatchType: 'CHAOTIC GEGENPRESS SHOOTOUT',
    correlatedMarket: 'Over 3.5 Total Goals & 1H Over 1.5',
    odds: 1.92,
    confidence: 85,
    tacticalBreakdown:
      'Both clubs refuse to sit deep; high turnovers inside the attacking third produce an average of 4.1 combined xG in head-to-head meetings.',
  },
  {
    id: 'tac-gor-kcb',
    homeTeam: 'Gor Mahia',
    awayTeam: 'KCB FC',
    league: 'FKF Premier League',
    homeStyle: 'Positional Midfield Control (64% Possession)',
    awayStyle: 'Compact Mid-Block Physical Press',
    homePpda: 8.9,
    awayPpda: 13.4,
    mismatchType: 'TACTICAL STALEMATE LOCK',
    correlatedMarket: 'Gor Mahia 1X & Under 2.5 Goals',
    odds: 1.74,
    confidence: 84,
    tacticalBreakdown:
      'KCB’s physical central block slows first-half tempo, while Gor Mahia’s superior technical control unlocks a 1-0 or 2-0 clean-sheet win.',
  },
  {
    id: 'tac-sundowns-pirates',
    homeTeam: 'Mamelodi Sundowns',
    awayTeam: 'Orlando Pirates',
    league: 'South Africa PSL',
    homeStyle: 'Shoe-Shine & Piano Positional Overload',
    awayStyle: 'High-Speed Direct Wing Transitions',
    homePpda: 8.4,
    awayPpda: 9.6,
    mismatchType: 'COUNTER-ATTACK EXPLOIT',
    correlatedMarket: 'Over 2.0 Goal Line / BTTS — Yes',
    odds: 1.85,
    confidence: 83,
    tacticalBreakdown:
      'Sundowns commit 7 players ahead of the ball in build-up, giving Pirates’ rapid wingers high-value 1v1 transition lanes.',
  },
  {
    id: 'tac-ahly-esperance',
    homeTeam: 'Al Ahly',
    awayTeam: 'Espérance de Tunis',
    league: 'CAF Champions League',
    homeStyle: 'Relentless Flank Overlap & Set-Piece Pressure',
    awayStyle: 'Disciplined North African Low Block',
    homePpda: 8.7,
    awayPpda: 14.8,
    mismatchType: 'CORNER SIEGE OVERLOAD',
    correlatedMarket: 'Al Ahly To Win & Over 8.5 Corners',
    odds: 1.82,
    confidence: 86,
    tacticalBreakdown:
      'Espérance pack the central penalty box in Cairo, forcing Al Ahly’s fullbacks to deliver 28+ crosses and generate 9+ match corners.',
  },
];

export const TacticalMismatchMatrixPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [homeStyle, setHomeStyle] = useState<TacticalStyle>('HIGH_LINE_POSSESSION');
  const [awayStyle, setAwayStyle] = useState<TacticalStyle>('LOW_BLOCK_COUNTER');

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
          {TACTICAL_MISMATCH_FIXTURES.map((item) => (
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
                        matchDate: new Date().toISOString(),
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
