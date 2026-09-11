import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePredictions } from '@/hooks/usePredictions';
import {
  calculateTeamStats,
  calculateLeagueOverview,
  PinnedTeamStats,
  PinnedLeagueOverview,
  POPULAR_LEAGUES_CATALOG,
  POPULAR_CLUBS_CATALOG,
} from '@/services/personalizedDashboardService';
import { toast } from 'sonner';

const DEFAULT_PINNED_LEAGUES = ['Premier League', 'Champions League', 'La Liga'];
const DEFAULT_PINNED_TEAMS = ['Arsenal', 'Real Madrid', 'Manchester City'];

export interface PinnedDashboardData {
  pinnedLeagues: string[];
  pinnedTeams: string[];
  lastUpdated: string;
}

export function usePersonalizedDashboard() {
  const { user } = useAuth();
  const { predictions } = usePredictions(1);

  const storageKey = useMemo(() => {
    return user ? `predictpro_pinned_dashboard_${user.id}` : 'predictpro_pinned_dashboard_guest';
  }, [user]);

  const [pinnedLeagues, setPinnedLeagues] = useState<string[]>(() => {
    try {
      const activeKey = user ? `predictpro_pinned_dashboard_${user.id}` : 'predictpro_pinned_dashboard_guest';
      const saved = localStorage.getItem(activeKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.pinnedLeagues) && parsed.pinnedLeagues.length > 0) {
          return parsed.pinnedLeagues;
        }
      }
    } catch {
      // Ignore parse error
    }
    return DEFAULT_PINNED_LEAGUES;
  });

  const [pinnedTeams, setPinnedTeams] = useState<string[]>(() => {
    try {
      const activeKey = user ? `predictpro_pinned_dashboard_${user.id}` : 'predictpro_pinned_dashboard_guest';
      const saved = localStorage.getItem(activeKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.pinnedTeams) && parsed.pinnedTeams.length > 0) {
          return parsed.pinnedTeams;
        }
      }
    } catch {
      // Ignore parse error
    }
    return DEFAULT_PINNED_TEAMS;
  });

  // When auth state transitions from guest to logged in, migrate guest pins if user has none
  useEffect(() => {
    if (user) {
      const userKey = `predictpro_pinned_dashboard_${user.id}`;
      const userSaved = localStorage.getItem(userKey);
      if (!userSaved) {
        // Check if guest had customized pins
        const guestSaved = localStorage.getItem('predictpro_pinned_dashboard_guest');
        if (guestSaved) {
          try {
            const guestData = JSON.parse(guestSaved);
            localStorage.setItem(userKey, JSON.stringify({
              ...guestData,
              lastUpdated: new Date().toISOString(),
            }));
            if (guestData.pinnedLeagues?.length) setPinnedLeagues(guestData.pinnedLeagues);
            if (guestData.pinnedTeams?.length) setPinnedTeams(guestData.pinnedTeams);
            return;
          } catch {
            // fallback
          }
        }
      } else {
        try {
          const parsed = JSON.parse(userSaved);
          if (parsed.pinnedLeagues?.length) setPinnedLeagues(parsed.pinnedLeagues);
          if (parsed.pinnedTeams?.length) setPinnedTeams(parsed.pinnedTeams);
        } catch {
          // fallback
        }
      }
    }
  }, [user]);

  // Persist changes to storageKey
  const persist = useCallback((leagues: string[], teams: string[]) => {
    try {
      const payload: PinnedDashboardData = {
        pinnedLeagues: leagues,
        pinnedTeams: teams,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save pinned dashboard preferences', e);
    }
  }, [storageKey]);

  const isLeaguePinned = useCallback((leagueName: string) => {
    const norm = leagueName.toLowerCase().trim();
    return pinnedLeagues.some(l => l.toLowerCase().trim() === norm);
  }, [pinnedLeagues]);

  const isTeamPinned = useCallback((teamName: string) => {
    const norm = teamName.toLowerCase().trim();
    return pinnedTeams.some(t => t.toLowerCase().trim() === norm);
  }, [pinnedTeams]);

  const togglePinLeague = useCallback((leagueName: string) => {
    setPinnedLeagues(prev => {
      const norm = leagueName.toLowerCase().trim();
      const exists = prev.some(l => l.toLowerCase().trim() === norm);
      const next = exists
        ? prev.filter(l => l.toLowerCase().trim() !== norm)
        : [...prev, leagueName];

      persist(next, pinnedTeams);
      if (exists) {
        toast.info(`Unpinned ${leagueName} from dashboard`);
      } else {
        toast.success(`Pinned ${leagueName} to dashboard!`);
      }
      return next;
    });
  }, [pinnedTeams, persist]);

  const togglePinTeam = useCallback((teamName: string) => {
    setPinnedTeams(prev => {
      const norm = teamName.toLowerCase().trim();
      const exists = prev.some(t => t.toLowerCase().trim() === norm);
      const next = exists
        ? prev.filter(t => t.toLowerCase().trim() !== norm)
        : [...prev, teamName];

      persist(pinnedLeagues, next);
      if (exists) {
        toast.info(`Unpinned ${teamName} from dashboard`);
      } else {
        toast.success(`Pinned ${teamName} to dashboard!`);
      }
      return next;
    });
  }, [pinnedLeagues, persist]);

  const pinLeague = useCallback((leagueName: string) => {
    if (!isLeaguePinned(leagueName)) {
      togglePinLeague(leagueName);
    }
  }, [isLeaguePinned, togglePinLeague]);

  const unpinLeague = useCallback((leagueName: string) => {
    if (isLeaguePinned(leagueName)) {
      togglePinLeague(leagueName);
    }
  }, [isLeaguePinned, togglePinLeague]);

  const pinTeam = useCallback((teamName: string) => {
    if (!isTeamPinned(teamName)) {
      togglePinTeam(teamName);
    }
  }, [isTeamPinned, togglePinTeam]);

  const unpinTeam = useCallback((teamName: string) => {
    if (isTeamPinned(teamName)) {
      togglePinTeam(teamName);
    }
  }, [isTeamPinned, togglePinTeam]);

  const clearAllPins = useCallback(() => {
    setPinnedLeagues([]);
    setPinnedTeams([]);
    persist([], []);
    toast.info('Cleared all pinned leagues and teams');
  }, [persist]);

  const resetPins = useCallback(() => {
    setPinnedLeagues(DEFAULT_PINNED_LEAGUES);
    setPinnedTeams(DEFAULT_PINNED_TEAMS);
    persist(DEFAULT_PINNED_LEAGUES, DEFAULT_PINNED_TEAMS);
    toast.success('Reset pinned items to default recommendations');
  }, [persist]);

  // Compute stats for all pinned teams
  const pinnedTeamStatsList: PinnedTeamStats[] = useMemo(() => {
    return pinnedTeams.map(teamName => calculateTeamStats(teamName, predictions));
  }, [pinnedTeams, predictions]);

  // Compute overview for all pinned leagues
  const pinnedLeagueOverviews: PinnedLeagueOverview[] = useMemo(() => {
    return pinnedLeagues.map(leagueName => calculateLeagueOverview(leagueName, predictions));
  }, [pinnedLeagues, predictions]);

  // Matches involving pinned leagues or pinned teams
  const personalizedMatches = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];
    const pinnedTeamsNorm = pinnedTeams.map(t => t.toLowerCase().trim());
    const pinnedLeaguesNorm = pinnedLeagues.map(l => l.toLowerCase().trim());

    const nowMs = Date.now() - 105 * 60 * 1000;
    return predictions.filter(p => {
      const matchTime = new Date(p.match_date).getTime();
      if (!isNaN(matchTime) && matchTime < nowMs) return false;

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
    }).sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  }, [predictions, pinnedTeams, pinnedLeagues]);

  return {
    isAuthenticated: !!user,
    user,
    pinnedLeagues,
    pinnedTeams,
    pinnedTeamStatsList,
    pinnedLeagueOverviews,
    personalizedMatches,
    isLeaguePinned,
    isTeamPinned,
    togglePinLeague,
    togglePinTeam,
    pinLeague,
    unpinLeague,
    pinTeam,
    unpinTeam,
    clearAllPins,
    resetPins,
    popularLeagues: POPULAR_LEAGUES_CATALOG,
    popularClubs: POPULAR_CLUBS_CATALOG,
  };
}
