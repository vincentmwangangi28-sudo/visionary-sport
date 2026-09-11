import { PinnedLeagueOverview } from '@/services/personalizedDashboardService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamLogo } from '@/components/TeamLogo';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import {
  Pin,
  Trophy,
  Calendar,
  ChevronRight,
  ExternalLink,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PinnedLeagueCardProps {
  league: PinnedLeagueOverview;
  onUnpin: (name: string) => void;
}

export function PinnedLeagueCard({ league, onUnpin }: PinnedLeagueCardProps) {
  const { formatKickoff } = useUserPreferences();

  return (
    <Card className="overflow-hidden border border-border/70 hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md bg-card flex flex-col justify-between">
      {/* Accent header */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-primary to-blue-500" />

      <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Top Bar: Flag, League Name, Matchday & Pin toggle */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-3xl flex-shrink-0" role="img" aria-label={league.name}>
                {league.flag}
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg leading-tight truncate">
                  {league.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {league.season} • {league.matchdayLabel}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onUnpin(league.name)}
              title="Unpin this league from your dashboard"
              className="h-8 w-8 text-primary hover:text-destructive hover:bg-destructive/10 -mr-1 -mt-1 flex-shrink-0"
            >
              <Pin className="h-4 w-4 fill-primary" />
            </Button>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-muted/30 border border-border/40 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span>Matchday:</span>
              <span className="font-bold text-foreground">
                {league.currentMatchday || 2} of {league.totalMatchdays || 38}
              </span>
            </div>

            <Badge variant="outline" className="text-[10px] font-semibold">
              {league.upcomingMatchesCount} Upcoming Fixtures
            </Badge>
          </div>

          {/* Top 4 Standings Miniature Table */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1">
              <span>TABLE LEADERS</span>
              <div className="flex items-center gap-4">
                <span>GD</span>
                <span>PTS</span>
              </div>
            </div>

            <div className="space-y-1">
              {league.topTeams.map((team) => (
                <div
                  key={team.team}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-black w-4 text-center text-muted-foreground">
                      {team.position}
                    </span>
                    <TeamLogo
                      teamName={team.team}
                      className="w-5 h-5 rounded-full object-contain flex-shrink-0"
                    />
                    <span className="font-semibold text-xs truncate max-w-[140px] sm:max-w-[170px]">
                      {team.team}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-[11px] text-muted-foreground w-6 text-right">
                      {team.gd > 0 ? `+${team.gd}` : team.gd}
                    </span>
                    <span className="font-bold text-primary w-6 text-right">
                      {team.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Featured Match */}
          {league.nextMatch && (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="h-3 w-3 text-primary" /> Next Highlighted Match
                </span>
                <span className="font-semibold text-foreground">
                  {formatKickoff(league.nextMatch.date, { includeDate: true, includeWeekday: false })}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <TeamLogo teamName={league.nextMatch.home} className="w-6 h-6 object-contain" />
                  <span className="text-xs font-bold truncate max-w-[85px] sm:max-w-[105px]">
                    {league.nextMatch.home}
                  </span>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <TeamLogo teamName={league.nextMatch.away} className="w-6 h-6 object-contain" />
                  <span className="text-xs font-bold truncate max-w-[85px] sm:max-w-[105px]">
                    {league.nextMatch.away}
                  </span>
                </div>

                <Badge className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20 shrink-0">
                  {league.nextMatch.prediction}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Action Shortcuts */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          <Link
            to={`/standings?league=${encodeURIComponent(league.name)}`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Full Table <ChevronRight className="h-3 w-3" />
          </Link>

          <Link
            to={`/?league=${encodeURIComponent(league.name)}`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View Predictions <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
