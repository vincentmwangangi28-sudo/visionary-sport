import { useMemo } from 'react';
import { usePredictions } from '@/hooks/usePredictions';
import { isPlayedOrPastMatch, sortMatchesByDatePriority } from '@/lib/dateFilterUtils';
import {
  calculateTeamStats,
  calculateLeagueOverview,
  PinnedTeamStats,
  PinnedLeagueOverview,
  POPULAR_LEAGUES_CATALOG,
  POPULAR_CLUBS_CATALOG,
} from '@/services/personalizedDashboardService';
import { usePinnedFavorites, PinnedDashboardData } from '@/hooks/usePinnedFavorites';

export type { PinnedDashboardData };

export function usePersonalizedDashboard(options?: { lightweight?: boolean }) {
  const isLightweight = Boolean(options?.lightweight);
  const pins = usePinnedFavorites();
  const { pinnedLeagues, pinnedTeams } = pins;

  const { predictions: pagePredictions, data } = usePredictions(1);
  const predictions = useMemo(() => {
    if (isLightweight) return [];
    const raw = data?.allPredictions ?? pagePredictions;
    return sortMatchesByDatePriority(raw.filter(p => !isPlayedOrPastMatch(p)));
  }, [isLightweight, data?.allPredictions, pagePredictions]);

  // Compute stats for all pinned teams
  const pinnedTeamStatsList: PinnedTeamStats[] = useMemo(() => {
    if (isLightweight) return [];
    return pinnedTeams.map(teamName => calculateTeamStats(teamName, predictions));
  }, [isLightweight, pinnedTeams, predictions]);

  // Compute overview for all pinned leagues
  const pinnedLeagueOverviews: PinnedLeagueOverview[] = useMemo(() => {
    if (isLightweight) return [];
    return pinnedLeagues.map(leagueName => calculateLeagueOverview(leagueName, predictions));
  }, [isLightweight, pinnedLeagues, predictions]);

  // Matches involving pinned leagues or pinned teams
  const personalizedMatches = useMemo(() => {
    if (isLightweight || !predictions || predictions.length === 0) return [];
    const pinnedTeamsNorm = pinnedTeams.map(t => t.toLowerCase().trim());
    const pinnedLeaguesNorm = pinnedLeagues.map(l => l.toLowerCase().trim());

    return sortMatchesByDatePriority(
      predictions.filter(p => {
        if (isPlayedOrPastMatch(p)) return false;

        const h = p.home_team.toLowerCase().trim();
        const a = p.away_team.toLowerCase().trim();
        const lg = p.league.toLowerCase().trim();

        const matchesTeam = pinnedTeamsNorm.some(t => h.includes(t) || a.includes(t) || t.includes(h) || t.includes(a));
        const matchesLeague = pinnedLeaguesNorm.some(l => lg.includes(l) || l.includes(lg));

        return matchesTeam || matchesLeague;
      }).map(p => {
        const h = p.home_team.toLowerCase().trim();
        const a = p.away_team.toLowerCase().trim();
        const lg = p.league.toLowerCase().trim();

        const isPinnedTeamMatch = pinnedTeamsNorm.some(t => h.includes(t) || a.includes(t) || t.includes(h) || t.includes(a));
        const isPinnedLeagueMatch = pinnedLeaguesNorm.some(l => lg.includes(l) || l.includes(lg));

        return {
          ...p,
          isPinnedTeamMatch,
          isPinnedLeagueMatch,
        };
      })
    );
  }, [isLightweight, predictions, pinnedTeams, pinnedLeagues]);

  return {
    ...pins,
    pinnedTeamStatsList,
    pinnedLeagueOverviews,
    personalizedMatches,
    popularLeagues: POPULAR_LEAGUES_CATALOG,
    popularClubs: POPULAR_CLUBS_CATALOG,
  };
}
