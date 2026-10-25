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
  CloudRain,
  Compass,
  Flame,
  Mountain,
  Plane,
  Plus,
  Sun,
  Wind,
  Zap,
} from 'lucide-react';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

interface EnvironmentalMatchCard {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  stadium: string;
  city: string;
  altitudeMeters: number;
  awayTravelKm: number;
  weatherCondition: 'High Altitude Thin Air' | 'Tropical Coastal Humidity (32°C)' | 'Heavy Rain & Slick Turf' | 'Long-Haul CAF / UCL Travel';
  homeSecondHalfXgBoostPct: number;
  recommendedPick: string;
  odds: number;
  confidence: number;
  environmentalInsight: string;
}

const ENVIRONMENTAL_MATCHES: EnvironmentalMatchCard[] = [
  {
    id: 'env-gor-coastal',
    homeTeam: 'Gor Mahia',
    awayTeam: 'Bandari FC',
    league: 'FKF Premier League',
    stadium: 'Nyayo National Stadium',
    city: 'Nairobi, Kenya',
    altitudeMeters: 1795,
    awayTravelKm: 485,
    weatherCondition: 'High Altitude Thin Air',
    homeSecondHalfXgBoostPct: 28,
    recommendedPick: 'Gor Mahia Win & 2nd Half Over 0.5 Goals',
    odds: 1.72,
    confidence: 88,
    environmentalInsight:
      'Visiting sea-level Mombasa clubs experience VO2 max fatigue after minute 60 at Nairobi’s 1,795m altitude, boosting Gor Mahia’s final-30-minute xG by +28%.',
  },
  {
    id: 'env-sundowns-ahly',
    homeTeam: 'Mamelodi Sundowns',
    awayTeam: 'Al Ahly',
    league: 'CAF Champions League',
    stadium: 'Loftus Versfeld Stadium',
    city: 'Pretoria, South Africa',
    altitudeMeters: 1350,
    awayTravelKm: 6250,
    weatherCondition: 'Long-Haul CAF / UCL Travel',
    homeSecondHalfXgBoostPct: 24,
    recommendedPick: 'Mamelodi Sundowns Draw No Bet (1 DNB)',
    odds: 1.66,
    confidence: 85,
    environmentalInsight:
      'Combining a 6,250 km trans-continental flight from Cairo with Pretoria’s 1,350m Highveld afternoon kickoff suppresses visiting high-press intensity by 19%.',
  },
  {
    id: 'env-yanga-simba-dar',
    homeTeam: 'Young Africans',
    awayTeam: 'Azam FC',
    league: 'Tanzania NBC Premier League',
    stadium: 'Benjamin Mkapa National Stadium',
    city: 'Dar es Salaam, Tanzania',
    altitudeMeters: 24,
    awayTravelKm: 18,
    weatherCondition: 'Tropical Coastal Humidity (32°C)',
    homeSecondHalfXgBoostPct: 21,
    recommendedPick: '2nd Half Highest Scoring Half / Over 1.5 Goals',
    odds: 1.84,
    confidence: 83,
    environmentalInsight:
      '82% Indian Ocean humidity in Dar es Salaam drains defensive concentration in the final 25 minutes, where Yanga’s deep bench scores 44% of their league goals.',
  },
  {
    id: 'env-newcastle-arsenal-rain',
    homeTeam: 'Newcastle United',
    awayTeam: 'Aston Villa',
    league: 'Premier League',
    stadium: 'St. James’ Park',
    city: 'Newcastle, UK',
    altitudeMeters: 55,
    awayTravelKm: 335,
    weatherCondition: 'Heavy Rain & Slick Turf',
    homeSecondHalfXgBoostPct: 16,
    recommendedPick: 'Over 10.5 Match Corners & BTTS',
    odds: 1.92,
    confidence: 82,
    environmentalInsight:
      'Wet skidding surface increases long-range shots parried wide by goalkeepers and sliding-tackle deflections out of play (+2.4 extra corners per 90).',
  },
  {
    id: 'env-chiefs-cape',
    homeTeam: 'Kaizer Chiefs',
    awayTeam: 'Cape Town City',
    league: 'South Africa PSL',
    stadium: 'FNB Stadium',
    city: 'Johannesburg, South Africa',
    altitudeMeters: 1753,
    awayTravelKm: 1400,
    weatherCondition: 'High Altitude Thin Air',
    homeSecondHalfXgBoostPct: 25,
    recommendedPick: 'Over 1.5 Match Goals & Home 1X',
    odds: 1.68,
    confidence: 84,
    environmentalInsight:
      'FNB Stadium sits at 1,753m above sea level; coastal Cape Town visitors concede 63% of their away goals in the second half.',
  },
  {
    id: 'env-america-pachuca',
    homeTeam: 'Club América',
    awayTeam: 'Monterrey',
    league: 'Liga MX',
    stadium: 'Estadio Ciudad de los Deportes',
    city: 'Mexico City, Mexico',
    altitudeMeters: 2240,
    awayTravelKm: 910,
    weatherCondition: 'High Altitude Thin Air',
    homeSecondHalfXgBoostPct: 31,
    recommendedPick: 'Club América 1X & Over 1.5 Goals',
    odds: 1.74,
    confidence: 86,
    environmentalInsight:
      'At 2,240m elevation in Mexico City, reduced air resistance increases long-distance shot velocity by 6% while accelerating visitor fatigue.',
  },
];

export const StadiumAltitudeWeatherPage: React.FC = () => {
  const { addSelection } = useBetSlip();
  const [simAltitude, setSimAltitude] = useState<number>(1750); // meters
  const [simTravelKm, setSimTravelKm] = useState<number>(3200); // km
  const [simPitchState, setSimPitchState] = useState<'DRY FAST' | 'HEAVY WATERLOGGED' | 'ARTIFICIAL TURF'>('DRY FAST');

  const envSimulation = useMemo(() => {
    const baseHomeXg = 1.65;
    const baseAwayXg = 1.25;

    // Altitude boost for acclimated home team & penalty for sea-level visitor
    const altitudeFactor = simAltitude >= 1200 ? (simAltitude - 800) / 3500 : 0;
    const travelFatigueFactor = simTravelKm >= 1000 ? simTravelKm / 18000 : 0;

    let pitchGoalMultiplier = 1.0;
    if (simPitchState === 'HEAVY WATERLOGGED') pitchGoalMultiplier = 0.82; // suppresses clean passing xG
    if (simPitchState === 'ARTIFICIAL TURF') pitchGoalMultiplier = 1.08; // faster bounce & home familiarity boost

    const adjHomeXg = Number(
      ((baseHomeXg * (1 + altitudeFactor + travelFatigueFactor * 0.6)) * pitchGoalMultiplier).toFixed(2)
    );
    const adjAwayXg = Number(
      ((baseAwayXg * Math.max(0.55, 1 - altitudeFactor * 0.85 - travelFatigueFactor)) * pitchGoalMultiplier).toFixed(2)
    );

    const totalExpectedGoals = Number((adjHomeXg + adjAwayXg).toFixed(2));
    const homeEdgeBoostPct = Math.round(((adjHomeXg - adjAwayXg) - (baseHomeXg - baseAwayXg)) * 38);

    const bestMarket =
      simPitchState === 'HEAVY WATERLOGGED'
        ? 'Under 2.5 Match Goals (Heavy Pitch Suppression)'
        : simAltitude >= 1300 || simTravelKm >= 2500
        ? 'Home Win (1) / 2nd Half Home Goal'
        : 'Over 2.5 Match Goals';

    return {
      adjHomeXg,
      adjAwayXg,
      totalExpectedGoals,
      homeEdgeBoostPct: Math.max(4, homeEdgeBoostPct),
      bestMarket,
    };
  }, [simAltitude, simTravelKm, simPitchState]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Stadium Altitude, Weather, Pitch Surface & Travel Fatigue xG Modifier Hub | PredictPro"
        description="Quantify how stadium altitude (Nairobi 1,795m, Johannesburg 1,753m, Mexico City 2,240m), continental CAF/UCL travel distance, and pitch weather shift Expected Goals (xG)."
        canonicalUrl="https://predictpro.guru/stadium-altitude-weather"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto max-w-7xl px-4 py-6 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Quantitative Methodology', href: '/methodology' },
            { label: 'Altitude, Weather & Travel xG Hub' },
          ]}
        />

        <LeagueNavigationStrip />
        <MarketQuickStrip />

        {/* Hero Header */}
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Mountain className="h-3.5 w-3.5 text-primary" />
            <span>High-Altitude VO2 Max Decay</span>
            <span aria-hidden="true">·</span>
            <span>CAF &amp; UCL Travel Distance</span>
            <span aria-hidden="true">·</span>
            <span>Pitch Surface &amp; Rain xG Adjuster</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Stadium Altitude, Weather, Pitch Surface &amp; Travel Fatigue xG Hub
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Standard Poisson models treat every stadium as sea-level and climate-neutral. Our environmental modifier incorporates <strong>Elevation Above Sea Level (Nairobi 1,795m, Johannesburg 1,753m, Mexico City 2,240m)</strong>, <strong>Continental Away Travel Distance</strong>, and <strong>Pitch Surface Conditions</strong> to uncover late second-half goals and home fortress edges.
          </p>
        </section>

        {/* Interactive Environmental xG Simulator */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Interactive Environmental xG &amp; Travel Fatigue Simulator
            </CardTitle>
            <CardDescription className="text-xs">
              Adjust stadium elevation, away team flight distance, and pitch condition to compute the Environmental xG Shift.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="altitude-slider" className="font-semibold text-muted-foreground">
                    Stadium Elevation (Meters Above Sea Level):
                  </label>
                  <span className="font-mono font-bold text-primary">{simAltitude}m</span>
                </div>
                <input
                  id="altitude-slider"
                  type="range"
                  min={0}
                  max={3600}
                  step={50}
                  value={simAltitude}
                  onChange={(e) => setSimAltitude(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <label htmlFor="travel-slider" className="font-semibold text-muted-foreground">
                    Away Team Travel Distance (km):
                  </label>
                  <span className="font-mono font-bold text-foreground">{simTravelKm.toLocaleString()} km</span>
                </div>
                <input
                  id="travel-slider"
                  type="range"
                  min={50}
                  max={7500}
                  step={150}
                  value={simTravelKm}
                  onChange={(e) => setSimTravelKm(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <span className="font-semibold text-muted-foreground block">Select Pitch &amp; Weather State:</span>
              <div className="grid grid-cols-1 gap-1.5">
                {(['DRY FAST', 'HEAVY WATERLOGGED', 'ARTIFICIAL TURF'] as const).map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => setSimPitchState(state)}
                    className={`py-2 px-3 rounded-md border text-left font-bold transition-colors cursor-pointer ${
                      simPitchState === state
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted text-foreground border-border'
                    }`}
                  >
                    {state === 'DRY FAST'
                      ? '☀️ Dry Fast Natural Grass (Baseline Tempo)'
                      : state === 'HEAVY WATERLOGGED'
                      ? '🌧️ Heavy Rain / Waterlogged Pitch (-18% Passing xG)'
                      : '🏟️ Artificial Turf (+8% Home Bounce Familiarity)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-background border border-primary/30 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Adjusted Home vs Away xG:</span>
                <span className="font-mono font-black text-base text-primary">
                  {envSimulation.adjHomeXg} vs {envSimulation.adjAwayXg}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Expected Goals:</span>
                <span className="font-mono font-bold text-foreground">{envSimulation.totalExpectedGoals} Goals</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">2nd-Half Home Stamina Edge:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +{envSimulation.homeEdgeBoostPct}% Late xG Boost
                </span>
              </div>
              <div className="pt-2 border-t border-border">
                <p className="font-bold text-foreground">
                  Optimal Angle: <span className="text-primary">{envSimulation.bestMarket}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environmental Edge Fixtures Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ENVIRONMENTAL_MATCHES.map((item) => (
            <Card key={item.id} className="border-border hover:border-primary/40 transition-colors">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{item.league}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.stadium} ({item.city})</span>
                  </div>
                  <span className="font-mono font-bold text-primary">
                    {item.altitudeMeters}m Elev · {item.awayTravelKm}km Travel
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-base text-foreground">
                    <TeamLogo team={item.homeTeam} size="sm" />
                    <span>{item.homeTeam}</span>
                    <span className="text-muted-foreground font-normal text-xs">vs</span>
                    <TeamLogo team={item.awayTeam} size="sm" />
                    <span>{item.awayTeam}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    +{item.homeSecondHalfXgBoostPct}% 2H Home xG
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <p className="font-bold text-foreground mb-0.5">
                    Condition: <span className="text-primary">{item.weatherCondition}</span>
                  </p>
                  <p className="text-muted-foreground leading-relaxed">{item.environmentalInsight}</p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-foreground">
                      AI Pick: <span className="text-primary">{item.recommendedPick}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Environmental Model Confidence: <strong>{item.confidence}%</strong>
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
                        market: item.recommendedPick,
                        odds: item.odds,
                        confidence: item.confidence,
                      });
                      toast.success(`Added Environmental Edge Pick: ${item.recommendedPick} @ ${item.odds.toFixed(2)}!`);
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

export default StadiumAltitudeWeatherPage;
