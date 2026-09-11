import { PinnedTeamStats } from '@/services/personalizedDashboardService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamLogo } from '@/components/TeamLogo';
import { useBetSlip } from '@/hooks/useBetSlip';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  Pin,
  TrendingUp,
  Shield,
  Activity,
  Calendar,
  Sparkles,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PinnedTeamCardProps {
  team: PinnedTeamStats;
  onUnpin: (name: string) => void;
}

export function PinnedTeamCard({ team, onUnpin }: PinnedTeamCardProps) {
  const { addSelection } = useBetSlip();
  const { formatOdds, formatKickoff, getKickoffRelative } = useUserPreferences();

  const handleAddNextMatchToSlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!team.nextMatch) return;
    const isHome = team.nextMatch.isHome;
    const homeTeam = isHome ? team.name : team.nextMatch.opponent;
    const awayTeam = isHome ? team.nextMatch.opponent : team.name;
    const odds = isHome
      ? team.nextMatch.odds?.home || 1.85
      : team.nextMatch.odds?.away || 2.10;

    addSelection({
      match: `${homeTeam} vs ${awayTeam}`,
      homeTeam,
      awayTeam,
      league: team.nextMatch.competition || team.league,
      market: team.nextMatch.prediction,
      odds,
      confidence: team.nextMatch.confidence,
    });
  };

  return (
    <Card className="overflow-hidden border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md bg-card">
      {/* Accent header */}
      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-emerald-500" />

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Top bar: Team info, position, and pin toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <TeamLogo
              teamName={team.name}
              className="w-12 h-12 rounded-xl border bg-background p-1 object-contain shadow-xs flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg leading-tight truncate">
                  {team.name}
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono font-semibold px-1.5 py-0 h-4">
                  {team.shortName}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                <span>{team.league}</span>
                <span>•</span>
                <span className="font-semibold text-foreground">
                  #{team.position} in Table
                </span>
                <span>({team.points} pts)</span>
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onUnpin(team.name)}
            title="Unpin this club from your dashboard"
            className="h-8 w-8 text-primary hover:text-destructive hover:bg-destructive/10 -mr-1 -mt-1 flex-shrink-0"
          >
            <Pin className="h-4 w-4 fill-primary" />
          </Button>
        </div>

        {/* Form Guide & Streak */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Form:</span>
            <div className="flex items-center gap-1">
              {team.form.map((r, i) => (
                <span
                  key={i}
                  className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white ${
                    r === 'W'
                      ? 'bg-emerald-500'
                      : r === 'D'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  title={r === 'W' ? 'Win' : r === 'D' ? 'Draw' : 'Loss'}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          <Badge
            variant="secondary"
            className="text-[10px] font-medium gap-1 bg-primary/10 text-primary border-primary/20"
          >
            <Flame className="h-3 w-3 text-amber-500 fill-amber-500" />
            {team.streak}
          </Badge>
        </div>

        {/* Statistical Performance Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Win Rate</p>
            <p className="text-base font-black text-primary mt-0.5">{team.winRate}%</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Clean Sht</p>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {team.cleanSheetRate}%
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Scored/G</p>
            <p className="text-base font-black text-foreground mt-0.5">{team.goalsPerGame}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase font-medium">Conceded</p>
            <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {team.concededPerGame}
            </p>
          </div>
        </div>

        {/* Next Scheduled Fixture Spotlight */}
        {team.nextMatch ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Next Fixture
              </span>
              <span className="text-[10px] font-semibold text-primary">
                {formatKickoff(team.nextMatch.date, { includeDate: true, includeWeekday: false })}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogo
                  teamName={team.nextMatch.opponent}
                  className="w-7 h-7 rounded-full border bg-background p-0.5 object-contain flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">
                    {team.nextMatch.isHome ? 'vs' : '@'} {team.nextMatch.opponent}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {team.nextMatch.isHome ? 'Home Ground' : 'Away Fixture'}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <Badge className="text-[10px] font-semibold bg-primary text-primary-foreground">
                  {team.nextMatch.prediction}
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {team.nextMatch.confidence}% Confidence
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-primary/10">
              <Link
                to={`/predict?match=${encodeURIComponent(team.name)}`}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Match Analysis <ChevronRight className="h-3 w-3" />
              </Link>

              <Button
                size="sm"
                variant="outline"
                onClick={handleAddNextMatchToSlip}
                className="h-7 px-2.5 text-[10px] font-semibold gap-1 bg-background hover:bg-primary/10 hover:text-primary"
              >
                <PlusCircle className="h-3 w-3" />
                Add to Acca ({formatOdds(team.nextMatch.odds?.home || 1.85)})
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
            No upcoming fixtures scheduled this week
          </div>
        )}
      </CardContent>
    </Card>
  );
}
