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
  Award,
  Calculator,
  Crosshair,
  Flag,
  Flame,
  Plus,
  ShieldCheck,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

interface ClubSetPieceIntel {
  clubId: string;
  clubName: string;
  league: string;
  region: 'European Elite' | 'African & CAF Giants';
  setPieceXgPer90: number;
  penaltiesWonSeason: number;
  primaryPenaltyTaker: {
    name: string;
    slug: string;
    rating: number;
    conversionPct: number;
    careerScored: string;
    anytimeGoalOdds: number;
  };
  backupPenaltyTaker: string;
  directFreeKickSpecialist: {
    name: string;
    slug: string;
    rating: number;
    shotOnTargetOdds: number;
    notes: string;
  };
  primaryCornerTaker: {
    name: string;
    slug: string;
    rating: number;
    assistOdds: number;
    deliveryStyle: string;
  };
  primaryAerialTarget: {
    name: string;
    headedGoalsSeason: number;
    headerShotOdds: number;
  };
  upcomingFixture: {
    opponent: string;
    matchLabel: string;
  };
}

const SET_PIECE_DATABASE: ClubSetPieceIntel[] = [
  {
    clubId: 'arsenal',
    clubName: 'Arsenal',
    league: 'Premier League',
    region: 'European Elite',
    setPieceXgPer90: 0.68,
    penaltiesWonSeason: 9,
    primaryPenaltyTaker: {
      name: 'Bukayo Saka',
      slug: 'bukayo-saka',
      rating: 8.8,
      conversionPct: 91,
      careerScored: '19/21',
      anytimeGoalOdds: 2.35,
    },
    backupPenaltyTaker: 'Martin Ødegaard / Kai Havertz',
    directFreeKickSpecialist: {
      name: 'Declan Rice',
      slug: 'bukayo-saka',
      rating: 8.4,
      shotOnTargetOdds: 2.60,
      notes: 'Takes right-footed direct curlers & deep in-swinging dead balls.',
    },
    primaryCornerTaker: {
      name: 'Bukayo Saka',
      slug: 'bukayo-saka',
      rating: 8.8,
      assistOdds: 2.85,
      deliveryStyle: 'In-swinging Right Corner to Near-Post Six-Yard Overload',
    },
    primaryAerialTarget: {
      name: 'Gabriel Magalhães',
      headedGoalsSeason: 6,
      headerShotOdds: 2.40,
    },
    upcomingFixture: {
      opponent: 'Chelsea',
      matchLabel: 'Arsenal vs Chelsea',
    },
  },
  {
    clubId: 'real-madrid',
    clubName: 'Real Madrid',
    league: 'La Liga',
    region: 'European Elite',
    setPieceXgPer90: 0.59,
    penaltiesWonSeason: 11,
    primaryPenaltyTaker: {
      name: 'Kylian Mbappé',
      slug: 'kylian-mbappe',
      rating: 9.1,
      conversionPct: 86,
      careerScored: '43/50',
      anytimeGoalOdds: 1.78,
    },
    backupPenaltyTaker: 'Vinícius Júnior / Jude Bellingham',
    directFreeKickSpecialist: {
      name: 'Kylian Mbappé',
      slug: 'kylian-mbappe',
      rating: 9.1,
      shotOnTargetOdds: 1.65,
      notes: 'Shares central 22-yard dead balls with Federico Valverde power strikes.',
    },
    primaryCornerTaker: {
      name: 'Luka Modrić',
      slug: 'jude-bellingham',
      rating: 8.3,
      assistOdds: 3.10,
      deliveryStyle: 'Out-swinging Penalty Spot Delivery for Rüdiger & Bellingham',
    },
    primaryAerialTarget: {
      name: 'Antonio Rüdiger',
      headedGoalsSeason: 4,
      headerShotOdds: 2.95,
    },
    upcomingFixture: {
      opponent: 'Barcelona',
      matchLabel: 'Real Madrid vs Barcelona',
    },
  },
  {
    clubId: 'manchester-city',
    clubName: 'Manchester City',
    league: 'Premier League',
    region: 'European Elite',
    setPieceXgPer90: 0.54,
    penaltiesWonSeason: 8,
    primaryPenaltyTaker: {
      name: 'Erling Haaland',
      slug: 'erling-haaland',
      rating: 9.3,
      conversionPct: 92,
      careerScored: '46/50',
      anytimeGoalOdds: 1.62,
    },
    backupPenaltyTaker: 'Kevin De Bruyne / Phil Foden',
    directFreeKickSpecialist: {
      name: 'Kevin De Bruyne',
      slug: 'erling-haaland',
      rating: 8.9,
      shotOnTargetOdds: 1.95,
      notes: 'Whipped dip over the wall from 20–28 yards.',
    },
    primaryCornerTaker: {
      name: 'Kevin De Bruyne',
      slug: 'erling-haaland',
      rating: 8.9,
      assistOdds: 2.45,
      deliveryStyle: 'Driven Whipped Delivery & Short-Corner Edge-of-Box Routines',
    },
    primaryAerialTarget: {
      name: 'Erling Haaland',
      headedGoalsSeason: 7,
      headerShotOdds: 1.85,
    },
    upcomingFixture: {
      opponent: 'Liverpool',
      matchLabel: 'Manchester City vs Liverpool',
    },
  },
  {
    clubId: 'chelsea',
    clubName: 'Chelsea',
    league: 'Premier League',
    region: 'European Elite',
    setPieceXgPer90: 0.56,
    penaltiesWonSeason: 10,
    primaryPenaltyTaker: {
      name: 'Cole Palmer',
      slug: 'cole-palmer',
      rating: 8.9,
      conversionPct: 96,
      careerScored: '22/23',
      anytimeGoalOdds: 2.15,
    },
    backupPenaltyTaker: 'Christopher Nkunku / Enzo Fernández',
    directFreeKickSpecialist: {
      name: 'Cole Palmer',
      slug: 'cole-palmer',
      rating: 8.9,
      shotOnTargetOdds: 1.80,
      notes: 'Left-footed top-corner specialist from right-channel dead balls.',
    },
    primaryCornerTaker: {
      name: 'Cole Palmer',
      slug: 'cole-palmer',
      rating: 8.9,
      assistOdds: 2.75,
      deliveryStyle: 'In-swinging Left-Footed Delivery from Right Corner Flag',
    },
    primaryAerialTarget: {
      name: 'Levi Colwill',
      headedGoalsSeason: 3,
      headerShotOdds: 3.20,
    },
    upcomingFixture: {
      opponent: 'Arsenal',
      matchLabel: 'Arsenal vs Chelsea',
    },
  },
  {
    clubId: 'liverpool',
    clubName: 'Liverpool',
    league: 'Premier League',
    region: 'European Elite',
    setPieceXgPer90: 0.61,
    penaltiesWonSeason: 9,
    primaryPenaltyTaker: {
      name: 'Mohamed Salah',
      slug: 'mohamed-salah',
      rating: 9.0,
      conversionPct: 87,
      careerScored: '42/48',
      anytimeGoalOdds: 1.92,
    },
    backupPenaltyTaker: 'Alexis Mac Allister / Dominik Szoboszlai',
    directFreeKickSpecialist: {
      name: 'Trent Alexander-Arnold',
      slug: 'mohamed-salah',
      rating: 8.5,
      shotOnTargetOdds: 2.30,
      notes: 'Elite right-footed curl & accuracy from 20–26 yards.',
    },
    primaryCornerTaker: {
      name: 'Trent Alexander-Arnold',
      slug: 'mohamed-salah',
      rating: 8.5,
      assistOdds: 2.65,
      deliveryStyle: 'High-Velocity Out-Swinger Targeting Virgil van Dijk',
    },
    primaryAerialTarget: {
      name: 'Virgil van Dijk',
      headedGoalsSeason: 5,
      headerShotOdds: 2.55,
    },
    upcomingFixture: {
      opponent: 'Manchester City',
      matchLabel: 'Manchester City vs Liverpool',
    },
  },
  {
    clubId: 'bayern-munich',
    clubName: 'Bayern Munich',
    league: 'Bundesliga',
    region: 'European Elite',
    setPieceXgPer90: 0.63,
    penaltiesWonSeason: 12,
    primaryPenaltyTaker: {
      name: 'Harry Kane',
      slug: 'harry-kane',
      rating: 9.2,
      conversionPct: 93,
      careerScored: '78/84',
      anytimeGoalOdds: 1.58,
    },
    backupPenaltyTaker: 'Joshua Kimmich / Michael Olise',
    directFreeKickSpecialist: {
      name: 'Michael Olise',
      slug: 'harry-kane',
      rating: 8.6,
      shotOnTargetOdds: 2.05,
      notes: 'Left-footed dead-ball accuracy from edge of the penalty arc.',
    },
    primaryCornerTaker: {
      name: 'Joshua Kimmich',
      slug: 'harry-kane',
      rating: 8.7,
      assistOdds: 2.50,
      deliveryStyle: 'In-Swinging Six-Yard Box Delivery from Left Corner',
    },
    primaryAerialTarget: {
      name: 'Harry Kane',
      headedGoalsSeason: 8,
      headerShotOdds: 1.90,
    },
    upcomingFixture: {
      opponent: 'Borussia Dortmund',
      matchLabel: 'Bayern Munich vs Borussia Dortmund',
    },
  },
  {
    clubId: 'gor-mahia',
    clubName: 'Gor Mahia',
    league: 'FKF Premier League',
    region: 'African & CAF Giants',
    setPieceXgPer90: 0.52,
    penaltiesWonSeason: 7,
    primaryPenaltyTaker: {
      name: 'Austin Odhiambo',
      slug: 'austin-odhiambo',
      rating: 8.6,
      conversionPct: 89,
      careerScored: '16/18',
      anytimeGoalOdds: 2.25,
    },
    backupPenaltyTaker: 'Benson Omala / Rooney Onyango',
    directFreeKickSpecialist: {
      name: 'Austin Odhiambo',
      slug: 'austin-odhiambo',
      rating: 8.6,
      shotOnTargetOdds: 1.95,
      notes: 'FKF MVP dead-ball creator with 5 direct free-kick goals in 2 seasons.',
    },
    primaryCornerTaker: {
      name: 'Austin Odhiambo',
      slug: 'austin-odhiambo',
      rating: 8.6,
      assistOdds: 2.60,
      deliveryStyle: 'Whipped Near-Post Delivery for Sylvester Owino',
    },
    primaryAerialTarget: {
      name: 'Sylvester Owino',
      headedGoalsSeason: 4,
      headerShotOdds: 3.10,
    },
    upcomingFixture: {
      opponent: 'AFC Leopards',
      matchLabel: 'Gor Mahia vs AFC Leopards',
    },
  },
  {
    clubId: 'al-ahly',
    clubName: 'Al Ahly',
    league: 'CAF Champions League',
    region: 'African & CAF Giants',
    setPieceXgPer90: 0.58,
    penaltiesWonSeason: 9,
    primaryPenaltyTaker: {
      name: 'Wessam Abou Ali',
      slug: 'mohamed-salah',
      rating: 8.7,
      conversionPct: 90,
      careerScored: '18/20',
      anytimeGoalOdds: 1.95,
    },
    backupPenaltyTaker: 'Emam Ashour / Hussein El Shahat',
    directFreeKickSpecialist: {
      name: 'Wessam Abou Ali',
      slug: 'mohamed-salah',
      rating: 8.7,
      shotOnTargetOdds: 1.85,
      notes: 'Knuckleball specialist in CAF Champions League & Egyptian Premier League.',
    },
    primaryCornerTaker: {
      name: 'Emam Ashour',
      slug: 'mohamed-salah',
      rating: 8.5,
      assistOdds: 2.70,
      deliveryStyle: 'Driven Back-Post Delivery for Rami Rabia & Yasser Ibrahim',
    },
    primaryAerialTarget: {
      name: 'Rami Rabia',
      headedGoalsSeason: 5,
      headerShotOdds: 2.85,
    },
    upcomingFixture: {
      opponent: 'Zamalek',
      matchLabel: 'Al Ahly vs Zamalek',
    },
  },
  {
    clubId: 'young-africans',
    clubName: 'Young Africans',
    league: 'Tanzania NBC Premier League',
    region: 'African & CAF Giants',
    setPieceXgPer90: 0.55,
    penaltiesWonSeason: 8,
    primaryPenaltyTaker: {
      name: 'Stephane Aziz Ki',
      slug: 'austin-odhiambo',
      rating: 8.9,
      conversionPct: 91,
      careerScored: '21/23',
      anytimeGoalOdds: 2.05,
    },
    backupPenaltyTaker: 'Pacôme Zouzoua / Prince Dube',
    directFreeKickSpecialist: {
      name: 'Stephane Aziz Ki',
      slug: 'austin-odhiambo',
      rating: 8.9,
      shotOnTargetOdds: 1.75,
      notes: 'East Africa’s most lethal left-footed dead-ball striker from 20–30 yards.',
    },
    primaryCornerTaker: {
      name: 'Stephane Aziz Ki',
      slug: 'austin-odhiambo',
      rating: 8.9,
      assistOdds: 2.55,
      deliveryStyle: 'In-Swinging Left-Footed Delivery for Ibrahim Bacca',
    },
    primaryAerialTarget: {
      name: 'Ibrahim Bacca',
      headedGoalsSeason: 4,
      headerShotOdds: 3.00,
    },
    upcomingFixture: {
      opponent: 'Simba SC',
      matchLabel: 'Young Africans vs Simba SC',
    },
  },
  {
    clubId: 'mamelodi-sundowns',
    clubName: 'Mamelodi Sundowns',
    league: 'South Africa PSL',
    region: 'African & CAF Giants',
    setPieceXgPer90: 0.53,
    penaltiesWonSeason: 8,
    primaryPenaltyTaker: {
      name: 'Lucas Ribeiro Costa',
      slug: 'victor-osimhen',
      rating: 8.8,
      conversionPct: 92,
      careerScored: '14/15',
      anytimeGoalOdds: 2.10,
    },
    backupPenaltyTaker: 'Teboho Mokoena / Peter Shalulile',
    directFreeKickSpecialist: {
      name: 'Teboho Mokoena',
      slug: 'victor-osimhen',
      rating: 8.6,
      shotOnTargetOdds: 2.15,
      notes: 'Long-range 30-yard free-kick cannon for Bafana Bafana & Sundowns.',
    },
    primaryCornerTaker: {
      name: 'Marcelo Allende',
      slug: 'victor-osimhen',
      rating: 8.4,
      assistOdds: 2.80,
      deliveryStyle: 'Short-Corner Triangle Overload & Whipped Cutbacks',
    },
    primaryAerialTarget: {
      name: 'Grant Kekana',
      headedGoalsSeason: 4,
      headerShotOdds: 3.15,
    },
    upcomingFixture: {
      opponent: 'Orlando Pirates',
      matchLabel: 'Mamelodi Sundowns vs Orlando Pirates',
    },
  },
];

export const SetPieceSpecialistsPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'European Elite' | 'African & CAF Giants'>('ALL');
  const [selectedClubId, setSelectedClubId] = useState<string>('arsenal');
  const [opponentFoulRate, setOpponentFoulRate] = useState<number>(14); // fouls per match

  const filteredClubs = useMemo(() => {
    if (regionFilter === 'ALL') return SET_PIECE_DATABASE;
    return SET_PIECE_DATABASE.filter((c) => c.region === regionFilter);
  }, [regionFilter]);

  const simulatorClub = useMemo(
    () => SET_PIECE_DATABASE.find((c) => c.clubId === selectedClubId) || SET_PIECE_DATABASE[0],
    [selectedClubId]
  );

  // Dead-Ball & Penalty Goal Impact Simulator Calculation
  const simulatedStats = useMemo(() => {
    const foulMultiplier = opponentFoulRate / 12.5;
    const penaltyAwardProb = Math.min(48, Math.round(22 * foulMultiplier + simulatorClub.penaltiesWonSeason * 1.1));
    const takerPenaltyGoalProb = Math.round(
      (penaltyAwardProb / 100) * simulatorClub.primaryPenaltyTaker.conversionPct
    );
    const totalAnytimeGoalProb = Math.min(
      78,
      Math.round(100 / simulatorClub.primaryPenaltyTaker.anytimeGoalOdds + (foulMultiplier - 1) * 9)
    );
    const setPieceGoalProb = Math.min(
      68,
      Math.round((1 - Math.exp(-simulatorClub.setPieceXgPer90 * foulMultiplier)) * 100)
    );
    return {
      penaltyAwardProb,
      takerPenaltyGoalProb,
      totalAnytimeGoalProb,
      setPieceGoalProb,
    };
  }, [simulatorClub, opponentFoulRate]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Set-Piece, Penalty Taker & Tactical Dead-Ball Intelligence Hub | PredictPro"
        description="Designated 1st & 2nd Penalty Takers, career conversion rates, Direct Free-Kick specialists, and Primary Corner Takers + Aerial Targets across European & African clubs."
        canonicalUrl="https://predictpro.guru/set-piece-specialists"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Player Props & Ratings', href: '/players' },
            { label: 'Set-Piece & Penalty Taker Intelligence' },
          ]}
        />

        <LeagueNavigationStrip />
        <MarketQuickStrip />

        {/* Hero Header */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Crosshair className="h-3.5 w-3.5 text-primary" />
                <span>Dead-Ball Expected Goals (xG)</span>
                <span aria-hidden="true">·</span>
                <span>1st &amp; 2nd Penalty Hierarchy</span>
                <span aria-hidden="true">·</span>
                <span>Corner Delivery &amp; Aerial Threat Matrix</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Set-Piece, Penalty Taker &amp; Tactical Dead-Ball Intelligence Hub
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Over <strong>31% of all football goals</strong> originate from penalties, corners, and direct free kicks. Backing an <em>Anytime Goalscorer</em> who is also his club&apos;s designated 1st Penalty Taker and Direct Free-Kick specialist adds <strong>+0.28 hidden xG per 90</strong> over open-play-only forwards.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'European Elite', 'African & CAF Giants'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRegionFilter(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    regionFilter === tab
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted text-foreground border-border'
                  }`}
                >
                  {tab === 'ALL' ? 'All 10 Elite Clubs' : tab}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Dead-Ball & Penalty Goal Impact Simulator */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Interactive Penalty &amp; Dead-Ball Goal Impact Simulator
            </CardTitle>
            <CardDescription className="text-xs">
              Select a club and adjust opponent foul intensity to calculate the boost to the Designated Penalty Taker&apos;s Anytime Goalscorer probability.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            <div className="space-y-3">
              <div>
                <label htmlFor="sp-club-select" className="block text-xs font-bold text-foreground mb-1">
                  Select Club Hierarchy
                </label>
                <select
                  id="sp-club-select"
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-xs font-semibold text-foreground"
                >
                  {SET_PIECE_DATABASE.map((c) => (
                    <option key={c.clubId} value={c.clubId}>
                      {c.clubName} ({c.primaryPenaltyTaker.name} — {c.primaryPenaltyTaker.conversionPct}% Pen)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label htmlFor="foul-rate-slider" className="font-semibold text-muted-foreground">
                    Opponent Fouls Committed / 90:
                  </label>
                  <span className="font-mono font-bold text-primary">{opponentFoulRate} Fouls/Match</span>
                </div>
                <input
                  id="foul-rate-slider"
                  type="range"
                  min={8}
                  max={20}
                  step={1}
                  value={opponentFoulRate}
                  onChange={(e) => setOpponentFoulRate(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-[11px] text-muted-foreground block">Club Set-Piece Goal Prob</span>
                <span className="text-lg font-black text-primary">{simulatedStats.setPieceGoalProb}%</span>
                <span className="text-[10px] text-muted-foreground block">
                  {simulatorClub.setPieceXgPer90.toFixed(2)} Dead-Ball xG/90
                </span>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <span className="text-[11px] text-muted-foreground block">Penalty Awarded Prob</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                  {simulatedStats.penaltyAwardProb}%
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Taker Conversion: {simulatorClub.primaryPenaltyTaker.conversionPct}%
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-background border border-primary/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <PlayerAvatar
                  name={simulatorClub.primaryPenaltyTaker.name}
                  team={simulatorClub.clubName}
                  rating={simulatorClub.primaryPenaltyTaker.rating}
                  size="md"
                  showClubBadge
                  showRatingBadge
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {simulatorClub.primaryPenaltyTaker.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    True Anytime Goal Prob: <strong className="text-emerald-600 dark:text-emerald-400">{simulatedStats.totalAnytimeGoalProb}%</strong>
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      addSelection({
                        matchId: `sp-sim-${simulatorClub.clubId}`,
                        match: simulatorClub.upcomingFixture.matchLabel,
                        homeTeam: simulatorClub.clubName,
                        awayTeam: simulatorClub.upcomingFixture.opponent,
                        league: simulatorClub.league,
                        matchDate: new Date().toISOString(),
                        market: `${simulatorClub.primaryPenaltyTaker.name} Anytime Goalscorer`,
                        odds: simulatorClub.primaryPenaltyTaker.anytimeGoalOdds,
                        confidence: simulatedStats.totalAnytimeGoalProb,
                      });
                      toast.success(
                        `Added ${simulatorClub.primaryPenaltyTaker.name} Anytime Goalscorer @ ${simulatorClub.primaryPenaltyTaker.anytimeGoalOdds.toFixed(2)}!`
                      );
                    }}
                    className="h-7 px-2.5 text-xs font-bold mt-1.5 gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Goalscorer @ {simulatorClub.primaryPenaltyTaker.anytimeGoalOdds.toFixed(2)}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Club-by-Club Set-Piece & Penalty Taker Directory */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredClubs.map((club) => (
            <Card key={club.clubId} className="border-border hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <TeamLogo team={club.clubName} size="md" />
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Link to={`/teams/${club.clubId}`} className="hover:text-primary transition-colors">
                          {club.clubName}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{club.league}</span>
                        <span aria-hidden="true">·</span>
                        <span>Set-Piece xG/90: <strong className="text-foreground">{club.setPieceXgPer90.toFixed(2)}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>Pens Won: <strong className="text-foreground">{club.penaltiesWonSeason}</strong></span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-primary font-bold">
                    Next: vs {club.upcomingFixture.opponent}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3.5 text-xs">
                {/* 1st Penalty Taker Row */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <PlayerAvatar
                      name={club.primaryPenaltyTaker.name}
                      team={club.clubName}
                      rating={club.primaryPenaltyTaker.rating}
                      size="md"
                      showClubBadge
                      showRatingBadge
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                        <Target className="h-3.5 w-3.5" />
                        <span>1st Designated Penalty Taker</span>
                      </div>
                      <Link
                        to={`/players/${club.primaryPenaltyTaker.slug}`}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {club.primaryPenaltyTaker.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        Conversion: <strong className="text-emerald-600 dark:text-emerald-400">{club.primaryPenaltyTaker.conversionPct}%</strong> ({club.primaryPenaltyTaker.careerScored}) · 2nd: {club.backupPenaltyTaker}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      addSelection({
                        matchId: `pen-${club.clubId}`,
                        match: club.upcomingFixture.matchLabel,
                        homeTeam: club.clubName,
                        awayTeam: club.upcomingFixture.opponent,
                        league: club.league,
                        matchDate: new Date().toISOString(),
                        market: `${club.primaryPenaltyTaker.name} Anytime Goalscorer`,
                        odds: club.primaryPenaltyTaker.anytimeGoalOdds,
                        confidence: club.primaryPenaltyTaker.conversionPct - 10,
                      });
                      toast.success(`Added ${club.primaryPenaltyTaker.name} Anytime Goalscorer to Bet Slip!`);
                    }}
                    className="h-8 px-2.5 text-xs font-bold shrink-0 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Goal @ {club.primaryPenaltyTaker.anytimeGoalOdds.toFixed(2)}
                  </Button>
                </div>

                {/* Free Kick & Corner Specialists Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-lg border border-border bg-background space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-primary">Direct Free-Kick Specialist</span>
                      <span className="font-mono text-[11px] font-bold">
                        1+ SOT @ {club.directFreeKickSpecialist.shotOnTargetOdds.toFixed(2)}
                      </span>
                    </div>
                    <p className="font-bold text-foreground">{club.directFreeKickSpecialist.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {club.directFreeKickSpecialist.notes}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        addSelection({
                          matchId: `fk-${club.clubId}`,
                          match: club.upcomingFixture.matchLabel,
                          homeTeam: club.clubName,
                          awayTeam: club.upcomingFixture.opponent,
                          league: club.league,
                          matchDate: new Date().toISOString(),
                          market: `${club.directFreeKickSpecialist.name} 1+ Shot on Target`,
                          odds: club.directFreeKickSpecialist.shotOnTargetOdds,
                          confidence: 80,
                        });
                        toast.success(`Added ${club.directFreeKickSpecialist.name} 1+ Shot on Target!`);
                      }}
                      className="w-full h-7 text-[11px] font-semibold gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add 1+ SOT Prop
                    </Button>
                  </div>

                  <div className="p-2.5 rounded-lg border border-border bg-background space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        Corner Taker &amp; Aerial Target
                      </span>
                      <span className="font-mono text-[11px] font-bold">
                        Assist @ {club.primaryCornerTaker.assistOdds.toFixed(2)}
                      </span>
                    </div>
                    <p className="font-bold text-foreground">
                      {club.primaryCornerTaker.name} → {club.primaryAerialTarget.name} ({club.primaryAerialTarget.headedGoalsSeason} Headed Goals)
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {club.primaryCornerTaker.deliveryStyle}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        addSelection({
                          matchId: `cor-ast-${club.clubId}`,
                          match: club.upcomingFixture.matchLabel,
                          homeTeam: club.clubName,
                          awayTeam: club.upcomingFixture.opponent,
                          league: club.league,
                          matchDate: new Date().toISOString(),
                          market: `${club.primaryCornerTaker.name} To Assist / Create Goal`,
                          odds: club.primaryCornerTaker.assistOdds,
                          confidence: 76,
                        });
                        toast.success(`Added ${club.primaryCornerTaker.name} To Assist @ ${club.primaryCornerTaker.assistOdds.toFixed(2)}!`);
                      }}
                      className="w-full h-7 text-[11px] font-semibold gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add Assist Prop
                    </Button>
                  </div>
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

export default SetPieceSpecialistsPage;
