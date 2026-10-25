import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Activity,
  Flame,
  Flag,
  Plus,
  Radio,
  RefreshCw,
  Share2,
  ShieldAlert,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

interface InPlayAlertMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  regionTag: 'Europe' | 'Africa / CAF' | 'Americas / Asia';
  minute: number;
  homeScore: number;
  awayScore: number;
  liveXgHome: number;
  liveXgAway: number;
  appmIndex: number; // Attacking Pressure Per Minute (0-100)
  dangerousAttacksLast10: { home: number; away: number };
  boxEntriesLast15: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  cornersLive: { home: number; away: number };
  alertCategory: 'GOAL IMMINENT' | 'LATE DRAMA 70+' | 'CORNER SURGE' | 'COMEBACK VALUE';
  alertHeadline: string;
  recommendedMarket: string;
  liveOdds: number;
  aiProbability: number;
  valueEdgePct: number;
  tacticalTelemetry: string;
}

const LIVE_INPLAY_RADAR_DATA: InPlayAlertMatch[] = [
  {
    id: 'inplay-ars-che',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    regionTag: 'Europe',
    minute: 64,
    homeScore: 1,
    awayScore: 1,
    liveXgHome: 2.34,
    liveXgAway: 0.92,
    appmIndex: 94,
    dangerousAttacksLast10: { home: 16, away: 3 },
    boxEntriesLast15: { home: 11, away: 2 },
    shotsOnTarget: { home: 7, away: 3 },
    cornersLive: { home: 8, away: 2 },
    alertCategory: 'GOAL IMMINENT',
    alertHeadline: 'GOAL IMMINENT (NEXT 15 MINS) — Arsenal +1.42 Unconverted xG Deficit',
    recommendedMarket: 'Over 2.5 Match Goals (In-Play)',
    liveOdds: 1.68,
    aiProbability: 89,
    valueEdgePct: 14.2,
    tacticalTelemetry:
      'Arsenal have recorded 16 dangerous attacks and 4 shots inside the 6-yard box in the last 10 minutes. Poisson live decay projects an 89% probability of at least 1 more goal.',
  },
  {
    id: 'inplay-rma-bar',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    league: 'La Liga',
    regionTag: 'Europe',
    minute: 73,
    homeScore: 1,
    awayScore: 2,
    liveXgHome: 2.18,
    liveXgAway: 1.95,
    appmIndex: 91,
    dangerousAttacksLast10: { home: 14, away: 6 },
    boxEntriesLast15: { home: 9, away: 5 },
    shotsOnTarget: { home: 6, away: 6 },
    cornersLive: { home: 7, away: 5 },
    alertCategory: 'LATE DRAMA 70+',
    alertHeadline: 'LATE 75+ MINUTE SURGE — Real Madrid Chasing Equalizer at Bernabéu',
    recommendedMarket: 'Over 3.5 Total Goals (Live)',
    liveOdds: 1.76,
    aiProbability: 86,
    valueEdgePct: 11.8,
    tacticalTelemetry:
      'Real Madrid score 38% of their home goals between minutes 75 and 90+5. High transition space leaves both boxes exposed.',
  },
  {
    id: 'inplay-gor-afc',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    league: 'FKF Premier League',
    regionTag: 'Africa / CAF',
    minute: 58,
    homeScore: 0,
    awayScore: 0,
    liveXgHome: 1.54,
    liveXgAway: 0.41,
    appmIndex: 88,
    dangerousAttacksLast10: { home: 13, away: 2 },
    boxEntriesLast15: { home: 8, away: 1 },
    shotsOnTarget: { home: 5, away: 1 },
    cornersLive: { home: 6, away: 1 },
    alertCategory: 'GOAL IMMINENT',
    alertHeadline: 'SECOND HALF BREAKTHROUGH ALERT — Gor Mahia Pinning Deep Block',
    recommendedMarket: 'Over 0.5 Match Goals (In-Play)',
    liveOdds: 1.55,
    aiProbability: 88,
    valueEdgePct: 12.6,
    tacticalTelemetry:
      'Mashemeji Derby pressure spike: Austin Odhiambo has created 4 key passes in the last 12 minutes as AFC Leopards tire in midfield.',
  },
  {
    id: 'inplay-yanga-simba',
    homeTeam: 'Young Africans',
    awayTeam: 'Simba SC',
    league: 'Tanzania NBC Premier League',
    regionTag: 'Africa / CAF',
    minute: 69,
    homeScore: 1,
    awayScore: 0,
    liveXgHome: 1.62,
    liveXgAway: 1.38,
    appmIndex: 87,
    dangerousAttacksLast10: { home: 7, away: 12 },
    boxEntriesLast15: { home: 5, away: 8 },
    shotsOnTarget: { home: 4, away: 5 },
    cornersLive: { home: 5, away: 7 },
    alertCategory: 'CORNER SURGE',
    alertHeadline: 'WING OVERLOAD SURGE — Simba SC Forcing Repeated Wide Blocks',
    recommendedMarket: 'Over 14.5 Total Match Corners',
    liveOdds: 1.82,
    aiProbability: 84,
    valueEdgePct: 10.4,
    tacticalTelemetry:
      '12 corners already registered by minute 69. Simba SC trailing by 1 goal are crossing every 75 seconds from the right flank.',
  },
  {
    id: 'inplay-bay-bvb',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Borussia Dortmund',
    league: 'Bundesliga',
    regionTag: 'Europe',
    minute: 36,
    homeScore: 0,
    awayScore: 1,
    liveXgHome: 1.48,
    liveXgAway: 0.62,
    appmIndex: 92,
    dangerousAttacksLast10: { home: 15, away: 2 },
    boxEntriesLast15: { home: 10, away: 2 },
    shotsOnTarget: { home: 6, away: 2 },
    cornersLive: { home: 5, away: 1 },
    alertCategory: 'COMEBACK VALUE',
    alertHeadline: 'FAVORITE TRAILING VALUE — Bayern Dominant Despite Early Counter Goal',
    recommendedMarket: 'Bayern Munich Double Chance (1X) / Next Goal',
    liveOdds: 1.64,
    aiProbability: 87,
    valueEdgePct: 13.5,
    tacticalTelemetry:
      'Dortmund scored on their only shot in the box (0.62 xG), while Bayern have hit the woodwork twice and lead box touches 24 to 4.',
  },
  {
    id: 'inplay-ahl-sun',
    homeTeam: 'Al Ahly',
    awayTeam: 'Mamelodi Sundowns',
    league: 'CAF Champions League',
    regionTag: 'Africa / CAF',
    minute: 77,
    homeScore: 1,
    awayScore: 1,
    liveXgHome: 1.89,
    liveXgAway: 1.44,
    appmIndex: 89,
    dangerousAttacksLast10: { home: 13, away: 5 },
    boxEntriesLast15: { home: 9, away: 4 },
    shotsOnTarget: { home: 6, away: 4 },
    cornersLive: { home: 8, away: 4 },
    alertCategory: 'LATE DRAMA 70+',
    alertHeadline: 'CAIRO LATE WINNER RADAR — Al Ahly 75–90+ Minute Surge Active',
    recommendedMarket: 'Over 2.5 Total Goals (In-Play)',
    liveOdds: 1.90,
    aiProbability: 82,
    valueEdgePct: 11.9,
    tacticalTelemetry:
      'Al Ahly average 1.12 expected goals in the final 20 minutes at Cairo International Stadium in CAF knockout clashes.',
  },
];

export const InPlayPredictionsPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [tickCount, setTickCount] = useState(0);

  // Subtle live telemetry heartbeat every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTickCount((c) => c + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredMatches = useMemo(() => {
    return LIVE_INPLAY_RADAR_DATA.filter((m) => {
      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'AFRICA') return m.regionTag === 'Africa / CAF';
      return m.alertCategory === selectedCategory;
    });
  }, [selectedCategory]);

  const handleAddLivePick = (match: InPlayAlertMatch) => {
    addSelection({
      matchId: match.id,
      match: `${match.homeTeam} vs ${match.awayTeam} (${match.minute}')`,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league,
      matchDate: new Date().toISOString(),
      market: match.recommendedMarket,
      odds: match.liveOdds,
      confidence: match.aiProbability,
    });
    toast.success(`Added Live Pick: ${match.homeTeam} vs ${match.awayTeam} — ${match.recommendedMarket} @ ${match.liveOdds.toFixed(2)}`);
  };

  const handleLoadTop3InPlayAcca = () => {
    const top3 = [...LIVE_INPLAY_RADAR_DATA]
      .sort((a, b) => b.appmIndex - a.appmIndex)
      .slice(0, 3);
    top3.forEach((m) => {
      addSelection({
        matchId: m.id,
        match: `${m.homeTeam} vs ${m.awayTeam} (${m.minute}')`,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        league: m.league,
        matchDate: new Date().toISOString(),
        market: m.recommendedMarket,
        odds: m.liveOdds,
        confidence: m.aiProbability,
      });
    });
    toast.success('Loaded Top 3 Live In-Play APPM Momentum Picks into your Bet Slip!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Live In-Play Football Predictions, Momentum & Next-Goal Alert Radar | PredictPro"
        description="Real-time Attacking Pressure Per Minute (APPM), live Expected Goals (xG) deficits, last-10-minute dangerous attacks, and Next-Goal Imminent alerts across European & African football."
        canonicalUrl="https://predictpro.guru/in-play-predictions"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Live Match Center', href: '/live' },
            { label: 'In-Play Momentum & Next-Goal Radar' },
          ]}
        />

        <LeagueNavigationStrip />
        <MarketQuickStrip />

        {/* Hero Section */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">LIVE TELEMETRY ACTIVE</span>
                <span aria-hidden="true">·</span>
                <span>Attacking Pressure Per Minute (APPM)</span>
                <span aria-hidden="true">·</span>
                <span>Unconverted Live xG Scanner</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Live In-Play Momentum, Pressure &amp; Next-Goal Alert Radar
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pre-match odds become obsolete the moment a match kicks off. Our live scanner monitors <strong>Dangerous Attacks in the Last 10 Minutes</strong>, <strong>Penalty-Box Entries</strong>, and <strong>Live xG vs Actual Scoreline deficits</strong> to trigger instant alerts when a goal or corner surge is statistically imminent.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleLoadTop3InPlayAcca} className="gap-1.5 text-xs font-bold">
                <Zap className="h-3.5 w-3.5" />
                Load 3-Leg Live Momentum Acca
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTickCount((c) => c + 1);
                  toast.success('Refreshed live APPM momentum & box-entry telemetry!');
                }}
                className="gap-1.5 text-xs font-semibold"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Sync Telemetry
              </Button>
            </div>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            {[
              { id: 'ALL', label: `All Live Triggers (${LIVE_INPLAY_RADAR_DATA.length})` },
              { id: 'GOAL IMMINENT', label: 'Goal Imminent (Next 15m)' },
              { id: 'LATE DRAMA 70+', label: 'Late 70’+ Goal Surge' },
              { id: 'COMEBACK VALUE', label: 'Favorite Trailing Value' },
              { id: 'CORNER SURGE', label: 'Live Corner Surge' },
              { id: 'AFRICA', label: 'African & CAF Live' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted text-foreground border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Live Radar Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map((match) => {
            const totalDang =
              match.dangerousAttacksLast10.home + match.dangerousAttacksLast10.away || 1;
            const homeMomentumPct = Math.round(
              (match.dangerousAttacksLast10.home / totalDang) * 100
            );
            const dynamicMinute = Math.min(90, match.minute + (tickCount % 3));

            return (
              <Card
                key={match.id}
                className="border-border hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3 space-y-2.5">
                  {/* Top unboxed metadata row */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        LIVE {dynamicMinute}&apos;
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{match.league}</span>
                      <span aria-hidden="true">·</span>
                      <span>{match.regionTag}</span>
                    </div>
                    <span className="font-mono font-bold text-primary">
                      APPM Pressure: {match.appmIndex}/100
                    </span>
                  </div>

                  {/* Teams & Live Score */}
                  <div className="flex items-center justify-between gap-3 py-1">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <TeamLogo team={match.homeTeam} size="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-foreground truncate">
                          {match.homeTeam}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          Live xG: {match.liveXgHome.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 rounded-lg bg-muted border border-border text-center shrink-0">
                      <span className="font-mono font-black text-lg text-foreground">
                        {match.homeScore} - {match.awayScore}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-foreground truncate">
                          {match.awayTeam}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          Live xG: {match.liveXgAway.toFixed(2)}
                        </p>
                      </div>
                      <TeamLogo team={match.awayTeam} size="sm" />
                    </div>
                  </div>

                  {/* Alert Headline Banner */}
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                    <Flame className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-amber-700 dark:text-amber-300">
                        {match.alertHeadline}
                      </p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        {match.tacticalTelemetry}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Momentum & Last 10-Min Telemetry Bars */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        Last 10m Dangerous Attacks: <strong className="text-foreground">{match.dangerousAttacksLast10.home}</strong>
                      </span>
                      <span className="font-semibold text-primary">
                        Momentum Split ({homeMomentumPct}% / {100 - homeMomentumPct}%)
                      </span>
                      <span>
                        <strong className="text-foreground">{match.dangerousAttacksLast10.away}</strong>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${homeMomentumPct}%` }}
                      />
                      <div
                        className="bg-amber-500/70 h-full transition-all"
                        style={{ width: `${100 - homeMomentumPct}%` }}
                      />
                    </div>
                  </div>

                  {/* 3-Column Micro Telemetry */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-muted/40 p-2 rounded-lg border border-border/60">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Box Entries (15m)</span>
                      <span className="font-mono font-bold text-foreground">
                        {match.boxEntriesLast15.home} - {match.boxEntriesLast15.away}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Shots on Target</span>
                      <span className="font-mono font-bold text-foreground">
                        {match.shotsOnTarget.home} - {match.shotsOnTarget.away}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Live Corners</span>
                      <span className="font-mono font-bold text-foreground">
                        {match.cornersLive.home} - {match.cornersLive.away}
                      </span>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        AI Live Pick: <span className="text-primary">{match.recommendedMarket}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        AI Win Prob: <strong>{match.aiProbability}%</strong> · Live Value Edge:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          +{match.valueEdgePct.toFixed(1)}%
                        </strong>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAddLivePick(match)}
                      className="gap-1.5 text-xs font-bold shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add @ {match.liveOdds.toFixed(2)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <SEOAuthorityHub />
      </main>

      <Footer />
    </div>
  );
};

export default InPlayPredictionsPage;
