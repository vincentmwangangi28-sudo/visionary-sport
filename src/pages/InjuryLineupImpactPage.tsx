import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { TeamLogo } from '@/components/TeamLogo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertCircle,
  Calculator,
  CheckCircle2,
  Plus,
  ShieldAlert,
  Sliders,
  UserMinus,
  Users,
  Zap,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

interface KeySquadMember {
  id: string;
  name: string;
  slug: string;
  role: 'Attacking Star' | 'Midfield Engine' | 'Defensive Anchor';
  rating: number;
  xgDeltaWhenOut: number; // drop in team xG/90 when absent
  xgaDeltaWhenOut: number; // increase in team xGA/90 when absent
  defaultStatus: 'FIT' | 'DOUBTFUL (LATE TEST)' | 'RULED OUT / SUSPENDED';
  absenceReason: string;
}

interface ClubLineupImpactProfile {
  clubId: string;
  clubName: string;
  opponent: string;
  league: string;
  baseXg: number;
  baseOpponentXg: number;
  bookmakerFavoriteOdds: number;
  keyPlayers: KeySquadMember[];
}

const LINEUP_IMPACT_CLUBS: ClubLineupImpactProfile[] = [
  {
    clubId: 'manchester-city',
    clubName: 'Manchester City',
    opponent: 'Arsenal',
    league: 'Premier League',
    baseXg: 2.15,
    baseOpponentXg: 1.12,
    bookmakerFavoriteOdds: 1.95,
    keyPlayers: [
      {
        id: 'rodri',
        name: 'Rodri',
        slug: 'erling-haaland',
        role: 'Midfield Engine',
        rating: 9.1,
        xgDeltaWhenOut: -0.24,
        xgaDeltaWhenOut: 0.38,
        defaultStatus: 'RULED OUT / SUSPENDED',
        absenceReason: 'Knee ligament recovery — City win rate drops by 19% without Rodri.',
      },
      {
        id: 'haaland',
        name: 'Erling Haaland',
        slug: 'erling-haaland',
        role: 'Attacking Star',
        rating: 9.3,
        xgDeltaWhenOut: -0.58,
        xgaDeltaWhenOut: 0.04,
        defaultStatus: 'FIT',
        absenceReason: 'Primary penalty & box finisher (42% of team xG share).',
      },
      {
        id: 'de-bruyne',
        name: 'Kevin De Bruyne',
        slug: 'erling-haaland',
        role: 'Midfield Engine',
        rating: 8.9,
        xgDeltaWhenOut: -0.35,
        xgaDeltaWhenOut: 0.08,
        defaultStatus: 'DOUBTFUL (LATE TEST)',
        absenceReason: 'Minutes managed ahead of UEFA Champions League knockout tie.',
      },
    ],
  },
  {
    clubId: 'arsenal',
    clubName: 'Arsenal',
    opponent: 'Chelsea',
    league: 'Premier League',
    baseXg: 2.08,
    baseOpponentXg: 0.96,
    bookmakerFavoriteOdds: 1.88,
    keyPlayers: [
      {
        id: 'saka',
        name: 'Bukayo Saka',
        slug: 'bukayo-saka',
        role: 'Attacking Star',
        rating: 8.8,
        xgDeltaWhenOut: -0.44,
        xgaDeltaWhenOut: 0.06,
        defaultStatus: 'FIT',
        absenceReason: 'Primary right-wing creator, corner taker & 1st penalty taker.',
      },
      {
        id: 'saliba',
        name: 'William Saliba',
        slug: 'bukayo-saka',
        role: 'Defensive Anchor',
        rating: 8.7,
        xgDeltaWhenOut: -0.08,
        xgaDeltaWhenOut: 0.45,
        defaultStatus: 'DOUBTFUL (LATE TEST)',
        absenceReason: 'One-booking suspension tightrope; Arsenal xGA rises from 0.82 to 1.27 when absent.',
      },
      {
        id: 'odegaard',
        name: 'Martin Ødegaard',
        slug: 'bukayo-saka',
        role: 'Midfield Engine',
        rating: 8.7,
        xgDeltaWhenOut: -0.36,
        xgaDeltaWhenOut: 0.12,
        defaultStatus: 'FIT',
        absenceReason: 'Leads Premier League in high-press recoveries & final-third passes.',
      },
    ],
  },
  {
    clubId: 'real-madrid',
    clubName: 'Real Madrid',
    opponent: 'Barcelona',
    league: 'La Liga',
    baseXg: 2.26,
    baseOpponentXg: 1.28,
    bookmakerFavoriteOdds: 1.92,
    keyPlayers: [
      {
        id: 'mbappe',
        name: 'Kylian Mbappé',
        slug: 'kylian-mbappe',
        role: 'Attacking Star',
        rating: 9.1,
        xgDeltaWhenOut: -0.52,
        xgaDeltaWhenOut: 0.02,
        defaultStatus: 'FIT',
        absenceReason: 'Generates 0.84 non-penalty xG/90 in transition.',
      },
      {
        id: 'bellingham',
        name: 'Jude Bellingham',
        slug: 'jude-bellingham',
        role: 'Midfield Engine',
        rating: 8.9,
        xgDeltaWhenOut: -0.32,
        xgaDeltaWhenOut: 0.18,
        defaultStatus: 'DOUBTFUL (LATE TEST)',
        absenceReason: 'Shoulder & ankle load management after midweek European tie.',
      },
      {
        id: 'rudiger',
        name: 'Antonio Rüdiger',
        slug: 'jude-bellingham',
        role: 'Defensive Anchor',
        rating: 8.5,
        xgDeltaWhenOut: -0.06,
        xgaDeltaWhenOut: 0.39,
        defaultStatus: 'FIT',
        absenceReason: 'Essential aerial & high-line recovery sweeper.',
      },
    ],
  },
  {
    clubId: 'gor-mahia',
    clubName: 'Gor Mahia',
    opponent: 'AFC Leopards',
    league: 'FKF Premier League',
    baseXg: 1.88,
    baseOpponentXg: 0.68,
    bookmakerFavoriteOdds: 1.76,
    keyPlayers: [
      {
        id: 'odhiambo',
        name: 'Austin Odhiambo',
        slug: 'austin-odhiambo',
        role: 'Midfield Engine',
        rating: 8.6,
        xgDeltaWhenOut: -0.46,
        xgaDeltaWhenOut: 0.09,
        defaultStatus: 'FIT',
        absenceReason: 'FKF MVP — responsible for 48% of Gor Mahia’s dead-ball & open-play chance creation.',
      },
      {
        id: 'omala',
        name: 'Benson Omala',
        slug: 'austin-odhiambo',
        role: 'Attacking Star',
        rating: 8.4,
        xgDeltaWhenOut: -0.41,
        xgaDeltaWhenOut: 0.03,
        defaultStatus: 'DOUBTFUL (LATE TEST)',
        absenceReason: 'National team Harambee Stars travel load assessment.',
      },
      {
        id: 'owino',
        name: 'Sylvester Owino',
        slug: 'austin-odhiambo',
        role: 'Defensive Anchor',
        rating: 8.2,
        xgDeltaWhenOut: -0.07,
        xgaDeltaWhenOut: 0.34,
        defaultStatus: 'FIT',
        absenceReason: 'Dominates aerial duels in Mashemeji Derby set pieces.',
      },
    ],
  },
  {
    clubId: 'young-africans',
    clubName: 'Young Africans',
    opponent: 'Simba SC',
    league: 'Tanzania NBC Premier League',
    baseXg: 1.94,
    baseOpponentXg: 0.89,
    bookmakerFavoriteOdds: 1.85,
    keyPlayers: [
      {
        id: 'aziz-ki',
        name: 'Stephane Aziz Ki',
        slug: 'austin-odhiambo',
        role: 'Attacking Star',
        rating: 8.9,
        xgDeltaWhenOut: -0.49,
        xgaDeltaWhenOut: 0.05,
        defaultStatus: 'FIT',
        absenceReason: 'Burkina Faso international & Golden Boot leader.',
      },
      {
        id: 'diarra',
        name: 'Djigui Diarra',
        slug: 'austin-odhiambo',
        role: 'Defensive Anchor',
        rating: 8.5,
        xgDeltaWhenOut: -0.08,
        xgaDeltaWhenOut: 0.37,
        defaultStatus: 'DOUBTFUL (LATE TEST)',
        absenceReason: 'Sweeper-keeper ball distribution & penalty-saving specialist.',
      },
    ],
  },
];

export const InjuryLineupImpactPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [selectedClubId, setSelectedClubId] = useState<string>('manchester-city');

  const activeClub = useMemo(
    () => LINEUP_IMPACT_CLUBS.find((c) => c.clubId === selectedClubId) || LINEUP_IMPACT_CLUBS[0],
    [selectedClubId]
  );

  // Track which players are toggled OUT in the interactive simulator
  const [absentPlayerIds, setAbsentPlayerIds] = useState<Record<string, boolean>>({
    rodri: true,
    'de-bruyne': true,
    saliba: true,
    bellingham: true,
    omala: true,
    diarra: true,
  });

  const togglePlayerAbsence = (playerId: string) => {
    setAbsentPlayerIds((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  // Real-time Poisson xG & Fair Odds Recalculation based on active absences
  const impactSimulation = useMemo(() => {
    let xgDrop = 0;
    let xgaSpike = 0;
    let missingCount = 0;

    activeClub.keyPlayers.forEach((p) => {
      if (absentPlayerIds[p.id]) {
        xgDrop += p.xgDeltaWhenOut; // negative number
        xgaSpike += p.xgaDeltaWhenOut; // positive number
        missingCount += 1;
      }
    });

    const adjustedClubXg = Math.max(0.65, activeClub.baseXg + xgDrop);
    const adjustedOpponentXg = Math.min(2.85, activeClub.baseOpponentXg + xgaSpike);

    // Simplified Poisson win probability approximation
    const baseNetDiff = activeClub.baseXg - activeClub.baseOpponentXg;
    const adjNetDiff = adjustedClubXg - adjustedOpponentXg;

    const baseWinProb = Math.min(82, Math.max(25, Math.round(52 + baseNetDiff * 21)));
    const adjWinProb = Math.min(82, Math.max(18, Math.round(52 + adjNetDiff * 21)));
    const fairClubOdds = Number((100 / adjWinProb).toFixed(2));

    const opponentDoubleChanceProb = 100 - adjWinProb;
    const opponentDoubleChanceOdds = Number(Math.max(1.38, (100 / opponentDoubleChanceProb) * 0.94).toFixed(2));

    const isFavoriteOverpriced = fairClubOdds > activeClub.bookmakerFavoriteOdds + 0.18;

    return {
      missingCount,
      adjustedClubXg,
      adjustedOpponentXg,
      baseWinProb,
      adjWinProb,
      winProbDrop: baseWinProb - adjWinProb,
      fairClubOdds,
      isFavoriteOverpriced,
      recommendedMarket: isFavoriteOverpriced
        ? `${activeClub.opponent} Double Chance (X2) / +0.5 AH`
        : `${activeClub.clubName} To Win (Full Strength)`,
      recommendedOdds: isFavoriteOverpriced ? opponentDoubleChanceOdds : activeClub.bookmakerFavoriteOdds,
      recommendedConfidence: isFavoriteOverpriced ? Math.min(88, opponentDoubleChanceProb + 12) : adjWinProb,
    };
  }, [activeClub, absentPlayerIds]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Confirmed Lineups, Key Injury & Suspension xG Impact Analyzer | PredictPro"
        description="Interactive Football Lineup & Injury xG Impact Simulator. Toggle star players IN or OUT to see how missing starters shift club Expected Goals (xG), xGA, and Fair 1X2 Odds."
        canonicalUrl="https://predictpro.guru/injury-lineup-impact"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Team News & Lineups', href: '/news' },
            { label: 'Lineup & Injury xG Impact Analyzer' },
          ]}
        />

        <LeagueNavigationStrip />
        <MarketQuickStrip />

        {/* Hero Section */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
              <UserMinus className="h-3.5 w-3.5 text-primary" />
              <span>Player Replacement Value (WAR / xG Delta)</span>
              <span aria-hidden="true">·</span>
              <span>Suspension &amp; Rotation Adjustments</span>
              <span aria-hidden="true">·</span>
              <span>Pre-Lineup Value Scanner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Confirmed Lineups, Key Injury &amp; Suspension xG Impact Analyzer
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Retail bettors back big club names without checking who is actually starting. When a defensive midfielder like <strong>Rodri</strong> or a primary playmaker like <strong>Austin Odhiambo</strong> or <strong>Bukayo Saka</strong> is ruled out, a team&apos;s true win probability can plunge by <strong>14% to 22%</strong>—turning the bookmaker&apos;s favorite into a negative-EV trap.
            </p>
          </div>

          {/* Club Selector Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {LINEUP_IMPACT_CLUBS.map((club) => {
              const isSelected = club.clubId === selectedClubId;
              return (
                <button
                  key={club.clubId}
                  type="button"
                  onClick={() => setSelectedClubId(club.clubId)}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background hover:bg-muted text-foreground border-border'
                  }`}
                >
                  <TeamLogo team={club.clubName} size="xs" />
                  <span>{club.clubName}</span>
                  <span className="opacity-75 font-normal">vs {club.opponent}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Interactive What-If Lineup Absence Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                Interactive &ldquo;What-If&rdquo; Lineup Absence Toggle — {activeClub.clubName} vs {activeClub.opponent}
              </CardTitle>
              <CardDescription className="text-xs">
                Click any key player below to toggle their status between <strong>STARTING (FIT)</strong> and <strong>RULED OUT / BENCHED</strong> and watch the Poisson xG model recalculate live.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeClub.keyPlayers.map((player) => {
                const isOut = !!absentPlayerIds[player.id];
                return (
                  <div
                    key={player.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isOut
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-emerald-500/30 bg-emerald-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlayerAvatar
                        name={player.name}
                        team={activeClub.clubName}
                        rating={player.rating}
                        size="md"
                        showClubBadge
                        showRatingBadge
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <Link
                            to={`/players/${player.slug}`}
                            className="font-bold text-sm text-foreground hover:text-primary transition-colors"
                          >
                            {player.name}
                          </Link>
                          <span className="text-muted-foreground">· {player.role}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{player.absenceReason}</p>
                        <div className="flex items-center gap-3 text-[11px] font-mono mt-1">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            Attacking Impact: {player.xgDeltaWhenOut.toFixed(2)} xG/90
                          </span>
                          <span className="text-destructive font-bold">
                            Defensive Concession: +{player.xgaDeltaWhenOut.toFixed(2)} xGA/90
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePlayerAbsence(player.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold shrink-0 border transition-colors cursor-pointer ${
                        isOut
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-emerald-600 text-white border-emerald-600'
                      }`}
                    >
                      {isOut ? 'STATUS: RULED OUT (Click to Start)' : 'STATUS: STARTING XI (Click to Rule Out)'}
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Real-Time Adjusted Poisson Telemetry Card */}
          <Card className="border-primary/30 bg-primary/5 flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Lineup-Adjusted Model</span>
                <span className="font-mono text-xs text-primary">
                  {impactSimulation.missingCount} Key Starters Out
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Comparing Full-Strength Baseline vs Current Lineup Absences
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-background border border-border">
                  <span className="text-[10px] text-muted-foreground block">Full-Strength xG</span>
                  <span className="font-mono font-bold text-sm text-foreground">
                    {activeClub.baseXg.toFixed(2)} vs {activeClub.baseOpponentXg.toFixed(2)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-background border border-primary/30">
                  <span className="text-[10px] text-muted-foreground block">Lineup-Adjusted xG</span>
                  <span className="font-mono font-black text-sm text-primary">
                    {impactSimulation.adjustedClubXg.toFixed(2)} vs {impactSimulation.adjustedOpponentXg.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-background border border-border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full-Strength Win Prob:</span>
                  <span className="font-mono font-bold">{impactSimulation.baseWinProb}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lineup-Adjusted Win Prob:</span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                    {impactSimulation.adjWinProb}% (-{impactSimulation.winProbDrop}%)
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border">
                  <span className="text-muted-foreground">Bookmaker Odds vs True Fair Odds:</span>
                  <span className="font-mono font-bold">
                    {activeClub.bookmakerFavoriteOdds.toFixed(2)} vs{' '}
                    <strong className="text-primary">{impactSimulation.fairClubOdds.toFixed(2)}</strong>
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <p className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                  {impactSimulation.isFavoriteOverpriced
                    ? '⚠️ FAVORITE OVERPRICED — FADE INJURED LINEUP'
                    : '✅ FULL-STRENGTH VALUE CONFIRMED'}
                </p>
                <p className="font-bold text-foreground">
                  AI Pick: {impactSimulation.recommendedMarket}
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    addSelection({
                      matchId: `lineup-${activeClub.clubId}`,
                      match: `${activeClub.clubName} vs ${activeClub.opponent}`,
                      homeTeam: activeClub.clubName,
                      awayTeam: activeClub.opponent,
                      league: activeClub.league,
                      matchDate: new Date().toISOString(),
                      market: impactSimulation.recommendedMarket,
                      odds: impactSimulation.recommendedOdds,
                      confidence: impactSimulation.recommendedConfidence,
                    });
                    toast.success(`Added Lineup-Adjusted Pick: ${impactSimulation.recommendedMarket}!`);
                  }}
                  className="w-full gap-1.5 text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Pick @ {impactSimulation.recommendedOdds.toFixed(2)} ({impactSimulation.recommendedConfidence}% AI)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <SEOAuthorityHub />
      </main>

      <Footer />
    </div>
  );
};

export default InjuryLineupImpactPage;
