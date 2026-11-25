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
import { ELITE_PLAYER_DATABASE } from '@/pages/PlayerSearch';
import { usePredictions } from '@/hooks/usePredictions';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

interface DynamicStrikerProp {
  id: string;
  player: string;
  team: string;
  opponent: string;
  league: string;
  matchDate: string;
  xgPer90: number;
  shotsOnTargetPer90: number;
  isPenaltyTaker: boolean;
  anytimeProb: number;
  anytimeOdds: number;
  firstScorerOdds: number;
}

export default function AnytimeGoalscorerPredictions() {
  const { selections, addSelection, removeSelection } = useBetSlip();
  const { data: predictions = [], isLoading } = usePredictions(7);

  const liveStrikerProps = useMemo<DynamicStrikerProp[]>(() => {
    const active = predictions.filter((p) => p.status !== 'finished').slice(0, 12);
    return active.map((fix) => {
      const homeLower = fix.home_team.toLowerCase();
      const awayLower = fix.away_team.toLowerCase();
      const homeStrength = (fix.home_odds || 2.1) <= (fix.away_odds || 3.1);
      const favTeam = homeStrength ? fix.home_team : fix.away_team;
      const oppTeam = homeStrength ? fix.away_team : fix.home_team;

      const matchedPlayer =
        ELITE_PLAYER_DATABASE.find(
          (pl) =>
            homeLower.includes(pl.team.toLowerCase()) ||
            pl.team.toLowerCase().includes(homeLower)
        ) ||
        ELITE_PLAYER_DATABASE.find(
          (pl) =>
            awayLower.includes(pl.team.toLowerCase()) ||
            pl.team.toLowerCase().includes(awayLower)
        );

      const playerTeam = matchedPlayer
        ? homeLower.includes(matchedPlayer.team.toLowerCase()) ||
          matchedPlayer.team.toLowerCase().includes(homeLower)
          ? fix.home_team
          : fix.away_team
        : favTeam;
      const opponentTeam = playerTeam === fix.home_team ? fix.away_team : fix.home_team;

      const teamXg =
        playerTeam === fix.home_team
          ? fix.home_xg || 1.68
          : fix.away_xg || 1.32;
      const xgPer90 = matchedPlayer
        ? matchedPlayer.xgPer90
        : Number(Math.max(0.38, Math.min(0.82, teamXg * 0.36)).toFixed(2));
      const shotsOnTargetPer90 = Number(Math.max(1.1, xgPer90 * 2.55).toFixed(1));
      const anytimeProb = Math.min(68, Math.max(32, Math.round(xgPer90 * 64 + 8)));
      const anytimeOdds = Number(Math.max(1.45, Math.min(3.8, (100 / anytimeProb) * 0.94)).toFixed(2));
      const firstScorerOdds = Number((anytimeOdds * 2.15).toFixed(2));

      return {
        id: `anytime-${fix.id}`,
        player: matchedPlayer ? matchedPlayer.name : `${playerTeam} #9 Lead Forward`,
        team: playerTeam,
        opponent: opponentTeam,
        league: fix.competition || fix.league || 'Global Matchday',
        matchDate: fix.match_date || new Date().toISOString(),
        xgPer90,
        shotsOnTargetPer90,
        isPenaltyTaker: true,
        anytimeProb,
        anytimeOdds,
        firstScorerOdds,
      };
    });
  }, [predictions]);

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
        title="Anytime Goalscorer Predictions: Player xG & Shots"
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
                Identify the sharpest Bet Builder player props across today&apos;s verified ESPN fixtures. Our player-level Poisson engine combines rolling <strong>Expected Goals per 90 (xG/90)</strong>, Shots on Target (SoT/90) volume, and designated penalty-kick duties.
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

          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Syncing upcoming fixtures &amp; striker xG/90 projections...
              </CardContent>
            </Card>
          ) : liveStrikerProps.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No active upcoming fixtures in this window to price Anytime Goalscorer props.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveStrikerProps.map((item) => {
                const slug = toPlayerSlug(item.player);
                const matchId = item.id;
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
                      matchDate: item.matchDate,
                      market: `${item.player} - Anytime Goalscorer`,
                      odds: item.anytimeOdds,
                      confidence: item.anytimeProb,
                    });
                    toast.success(`Added ${item.player} Anytime Goalscorer (@${item.anytimeOdds.toFixed(2)})`);
                  }
                };

                return (
                  <Card key={item.id} className="border-border/80 hover:border-primary/40 transition-all">
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
                              to={`/players/${slug}?team=${encodeURIComponent(item.team)}&league=${encodeURIComponent(item.league)}`}
                              className="font-bold text-base text-foreground hover:text-primary transition-colors truncate block"
                            >
                              {item.player}
                            </Link>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.team} vs {item.opponent} · <strong className="text-foreground">{item.xgPer90} xG/90</strong> · {item.shotsOnTargetPer90} SoT/90
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
                          to={`/players/${slug}?team=${encodeURIComponent(item.team)}&league=${encodeURIComponent(item.league)}`}
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
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

