import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Award, Sliders, Plus, CheckCircle2, ArrowRight } from 'lucide-react';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { formatPlayerSlug as toPlayerSlug } from '@/pages/PlayerProfilePage';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

const ELITE_STRIKERS_PROPS = [
  {
    player: 'Erling Haaland',
    team: 'Manchester City',
    opponent: 'Arsenal',
    league: 'Premier League',
    xgPer90: 0.94,
    shotsOnTargetPer90: 2.4,
    isPenaltyTaker: true,
    anytimeProb: 64,
    anytimeOdds: 1.65,
    firstScorerOdds: 3.40,
  },
  {
    player: 'Kylian Mbappé',
    team: 'Real Madrid',
    opponent: 'Barcelona',
    league: 'La Liga',
    xgPer90: 0.89,
    shotsOnTargetPer90: 2.3,
    isPenaltyTaker: true,
    anytimeProb: 61,
    anytimeOdds: 1.72,
    firstScorerOdds: 3.60,
  },
  {
    player: 'Harry Kane',
    team: 'Bayern Munich',
    opponent: 'Bayer Leverkusen',
    league: 'Bundesliga',
    xgPer90: 0.92,
    shotsOnTargetPer90: 2.2,
    isPenaltyTaker: true,
    anytimeProb: 63,
    anytimeOdds: 1.68,
    firstScorerOdds: 3.50,
  },
  {
    player: 'Mohamed Salah',
    team: 'Liverpool',
    opponent: 'Chelsea',
    league: 'Premier League',
    xgPer90: 0.78,
    shotsOnTargetPer90: 1.9,
    isPenaltyTaker: true,
    anytimeProb: 55,
    anytimeOdds: 1.95,
    firstScorerOdds: 4.20,
  },
  {
    player: 'Victor Osimhen',
    team: 'Galatasaray',
    opponent: 'Fenerbahçe',
    league: 'Süper Lig / UEL',
    xgPer90: 0.86,
    shotsOnTargetPer90: 2.2,
    isPenaltyTaker: true,
    anytimeProb: 59,
    anytimeOdds: 1.78,
    firstScorerOdds: 3.75,
  },
  {
    player: 'Ademola Lookman',
    team: 'Atalanta',
    opponent: 'AC Milan',
    league: 'Serie A',
    xgPer90: 0.62,
    shotsOnTargetPer90: 1.6,
    isPenaltyTaker: false,
    anytimeProb: 46,
    anytimeOdds: 2.35,
    firstScorerOdds: 5.40,
  },
  {
    player: 'Cole Palmer',
    team: 'Chelsea',
    opponent: 'Newcastle United',
    league: 'Premier League',
    xgPer90: 0.68,
    shotsOnTargetPer90: 1.7,
    isPenaltyTaker: true,
    anytimeProb: 50,
    anytimeOdds: 2.10,
    firstScorerOdds: 4.75,
  },
  {
    player: 'Lamine Yamal',
    team: 'Barcelona',
    opponent: 'Atlético Madrid',
    league: 'La Liga',
    xgPer90: 0.42,
    shotsOnTargetPer90: 1.4,
    isPenaltyTaker: false,
    anytimeProb: 36,
    anytimeOdds: 2.90,
    firstScorerOdds: 6.80,
  },
  {
    player: 'Robert Lewandowski',
    team: 'Barcelona',
    opponent: 'Atlético Madrid',
    league: 'La Liga',
    xgPer90: 0.84,
    shotsOnTargetPer90: 2.0,
    isPenaltyTaker: true,
    anytimeProb: 58,
    anytimeOdds: 1.85,
    firstScorerOdds: 3.90,
  },
  {
    player: 'Lautaro Martínez',
    team: 'Inter Milan',
    opponent: 'Juventus',
    league: 'Serie A',
    xgPer90: 0.76,
    shotsOnTargetPer90: 1.8,
    isPenaltyTaker: false,
    anytimeProb: 52,
    anytimeOdds: 2.05,
    firstScorerOdds: 4.50,
  },
  {
    player: 'Viktor Gyökeres',
    team: 'Sporting CP',
    opponent: 'Benfica',
    league: 'Primeira Liga',
    xgPer90: 0.91,
    shotsOnTargetPer90: 2.3,
    isPenaltyTaker: true,
    anytimeProb: 62,
    anytimeOdds: 1.70,
    firstScorerOdds: 3.55,
  },
  {
    player: 'Bukayo Saka',
    team: 'Arsenal',
    opponent: 'Manchester City',
    league: 'Premier League',
    xgPer90: 0.64,
    shotsOnTargetPer90: 1.6,
    isPenaltyTaker: true,
    anytimeProb: 47,
    anytimeOdds: 2.30,
    firstScorerOdds: 5.25,
  },
];

export default function AnytimeGoalscorerPredictions() {
  const { selections, addSelection, removeSelection } = useBetSlip();

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Dataset',
          name: 'Anytime Goalscorer & Player Shots on Target Predictions Today (xG/90 Model)',
          description:
            'Daily Anytime Goalscorer, First Goalscorer, and 1+ / 2+ Player Shots on Target predictions powered by non-penalty Expected Goals per 90 (npxG/90) and penalty-taker duty.',
          url: 'https://predictpro.guru/anytime-goalscorer-predictions',
          creator: {
            '@type': 'Organization',
            name: 'PredictPro',
            url: 'https://predictpro.guru',
          },
        },
      ],
    }),
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Anytime Goalscorer Predictions Today: Player xG & Shots on Target"
        description="Free Anytime Goalscorer, First Goalscorer, and Player Shots on Target predictions today. Backed by xG per 90, penalty-taker status, and defensive xGA matchups."
        canonical="/anytime-goalscorer-predictions"
        keywords="anytime goalscorer predictions today, first goalscorer tips, player shots on target predictions, football player props today, striker xg per 90 stats"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Anytime Goalscorer & Player Props' },
          ]}
        />

        <LeagueNavigationStrip />

        <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                  <Target className="h-3.5 w-3.5 mr-1.5" /> Player Prop xG/90 Radar
                </Badge>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 font-semibold">
                  Penalty Taker Boosted
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                Anytime Goalscorer &amp; Shots on Target Predictions Today
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Identify the sharpest Bet Builder player props. Our player-level Poisson engine combines rolling <strong>Expected Goals per 90 (xG/90)</strong>, Shots on Target (SoT/90) volume, and designated penalty-kick duties to price fair Anytime &amp; First Goalscorer probabilities.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <Link to="/player-props">
                <Button className="w-full font-bold gap-2 shadow-sm">
                  <Sliders className="h-4 w-4" />
                  Launch Interactive Prop Simulator
                </Button>
              </Link>
              <Link to="/players">
                <Button variant="outline" className="w-full font-semibold gap-2 border-primary/30 hover:bg-primary/10">
                  10.0 Player Ratings &amp; Radar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Top Striker xG/90 &amp; Anytime Scorer Projections
            </h2>
            <span className="text-xs text-muted-foreground">
              Click any striker to customize minutes &amp; opponent xGA or add directly to your Bet Slip
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ELITE_STRIKERS_PROPS.map((item) => {
              const slug = toPlayerSlug(item.player);
              const matchId = `anytime-${slug}`;
              const isAdded = selections.some((s) => s.matchId === matchId);

              const handleToggleSlip = () => {
                if (isAdded) {
                  removeSelection(matchId);
                } else {
                  addSelection({
                    matchId,
                    match: `${item.team} vs ${item.opponent}`,
                    homeTeam: item.team,
                    awayTeam: item.opponent,
                    league: item.league,
                    matchDate: new Date().toISOString(),
                    market: `${item.player} - Anytime Goalscorer`,
                    odds: item.anytimeOdds,
                    confidence: item.anytimeProb,
                  });
                  toast.success(`Added ${item.player} Anytime Goalscorer (@${item.anytimeOdds.toFixed(2)})`);
                }
              };

              return (
                <Card key={item.player} className="border-border/80 hover:border-primary/40 transition-all">
                  <CardHeader className="py-3 px-5 bg-muted/20 border-b border-border/50 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        {item.league}
                      </Badge>
                      {item.isPenaltyTaker && (
                        <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] font-bold">
                          PK Taker
                        </Badge>
                      )}
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-xs font-bold">
                      {item.anytimeProb}% Score Prob
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <PlayerAvatar
                          name={item.player}
                          team={item.team}
                          size="md"
                          showClubBadge
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/players/${slug}`}
                            className="font-bold text-base text-foreground hover:text-primary transition-colors truncate block"
                          >
                            {item.player}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.team} · <strong className="text-foreground">{item.xgPer90} xG/90</strong> · {item.shotsOnTargetPer90} SoT/90
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-muted-foreground block">Anytime / 1st Scorer</span>
                        <span className="font-black text-sm text-primary font-mono tabular-nums">
                          @{item.anytimeOdds.toFixed(2)} / @{item.firstScorerOdds.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                      <Link
                        to={`/players/${slug}`}
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        Simulate Props &amp; Heatmap →
                      </Link>
                      <Button
                        size="sm"
                        variant={isAdded ? 'default' : 'outline'}
                        onClick={handleToggleSlip}
                        className="h-8 text-xs font-bold gap-1.5"
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> In Slip (@{item.anytimeOdds.toFixed(2)})
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Add Anytime (@{item.anytimeOdds.toFixed(2)})
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

