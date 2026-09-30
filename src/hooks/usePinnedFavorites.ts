import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const DEFAULT_PINNED_LEAGUES = ['Premier League', 'Champions League', 'La Liga'];
export const DEFAULT_PINNED_TEAMS = ['Arsenal', 'Real Madrid', 'Manchester City'];

export interface PinnedDashboardData {
  pinnedLeagues: string[];
  pinnedTeams: string[];
  lastUpdated: string;
}

const PINS_UPDATED_EVENT = 'predictpro_pins_updated';

function readStoredPins(storageKey: string): { pinnedLeagues: string[]; pinnedTeams: string[] } {
  if (typeof window === 'undefined') {
    return { pinnedLeagues: DEFAULT_PINNED_LEAGUES, pinnedTeams: DEFAULT_PINNED_TEAMS };
  }
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        pinnedLeagues:
          Array.isArray(parsed.pinnedLeagues) && parsed.pinnedLeagues.length > 0
            ? parsed.pinnedLeagues
            : DEFAULT_PINNED_LEAGUES,
        pinnedTeams:
          Array.isArray(parsed.pinnedTeams) && parsed.pinnedTeams.length > 0
            ? parsed.pinnedTeams
            : DEFAULT_PINNED_TEAMS,
      };
    }
  } catch {
    // Ignore parse error
  }
  return { pinnedLeagues: DEFAULT_PINNED_LEAGUES, pinnedTeams: DEFAULT_PINNED_TEAMS };
}

export function usePinnedFavorites() {
  const { user } = useAuth();

  const storageKey = useMemo(() => {
    return user ? `predictpro_pinned_dashboard_${user.id}` : 'predictpro_pinned_dashboard_guest';
  }, [user]);

  const [pinnedLeagues, setPinnedLeagues] = useState<string[]>(() => readStoredPins(storageKey).pinnedLeagues);
  const [pinnedTeams, setPinnedTeams] = useState<string[]>(() => readStoredPins(storageKey).pinnedTeams);

  useEffect(() => {
    const syncFromStorage = () => {
      const current = readStoredPins(storageKey);
      setPinnedLeagues(current.pinnedLeagues);
      setPinnedTeams(current.pinnedTeams);
    };

    window.addEventListener(PINS_UPDATED_EVENT, syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener(PINS_UPDATED_EVENT, syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, [storageKey]);

  useEffect(() => {
    if (user) {
      const userKey = `predictpro_pinned_dashboard_${user.id}`;
      const userSaved = localStorage.getItem(userKey);
      if (!userSaved) {
        const guestSaved = localStorage.getItem('predictpro_pinned_dashboard_guest');
        if (guestSaved) {
          try {
            const guestData = JSON.parse(guestSaved);
            localStorage.setItem(
              userKey,
              JSON.stringify({
                ...guestData,
                lastUpdated: new Date().toISOString(),
              })
            );
            if (guestData.pinnedLeagues?.length) setPinnedLeagues(guestData.pinnedLeagues);
            if (guestData.pinnedTeams?.length) setPinnedTeams(guestData.pinnedTeams);
            return;
          } catch {
            // fallback
          }
        }
      } else {
        const current = readStoredPins(userKey);
        setPinnedLeagues(current.pinnedLeagues);
        setPinnedTeams(current.pinnedTeams);
      }
    }
  }, [user]);

  const persist = useCallback(
    (leagues: string[], teams: string[]) => {
      try {
        const payload: PinnedDashboardData = {
          pinnedLeagues: leagues,
          pinnedTeams: teams,
          lastUpdated: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent(PINS_UPDATED_EVENT));
      } catch (e) {
        console.warn('Failed to save pinned dashboard preferences', e);
      }
    },
    [storageKey]
  );

  const isLeaguePinned = useCallback(
    (leagueName: string) => {
      const norm = leagueName.toLowerCase().trim();
      return pinnedLeagues.some((l) => l.toLowerCase().trim() === norm);
    },
    [pinnedLeagues]
  );

  const isTeamPinned = useCallback(
    (teamName: string) => {
      const norm = teamName.toLowerCase().trim();
      return pinnedTeams.some((t) => t.toLowerCase().trim() === norm);
    },
    [pinnedTeams]
  );

  const togglePinLeague = useCallback(
    (leagueName: string) => {
      setPinnedLeagues((prev) => {
        const norm = leagueName.toLowerCase().trim();
        const exists = prev.some((l) => l.toLowerCase().trim() === norm);
        const next = exists ? prev.filter((l) => l.toLowerCase().trim() !== norm) : [...prev, leagueName];

        persist(next, pinnedTeams);
        if (exists) {
          toast.info(`Unpinned ${leagueName} from dashboard`);
        } else {
          toast.success(`Pinned ${leagueName} to dashboard!`);
        }
        return next;
      });
    },
    [pinnedTeams, persist]
  );

  const togglePinTeam = useCallback(
    (teamName: string) => {
      setPinnedTeams((prev) => {
        const norm = teamName.toLowerCase().trim();
        const exists = prev.some((t) => t.toLowerCase().trim() === norm);
        const next = exists ? prev.filter((t) => t.toLowerCase().trim() !== norm) : [...prev, teamName];

        persist(pinnedLeagues, next);
        if (exists) {
          toast.info(`Unpinned ${teamName} from dashboard`);
        } else {
          toast.success(`Pinned ${teamName} to dashboard!`);
        }
        return next;
      });
    },
    [pinnedLeagues, persist]
  );

  const pinLeague = useCallback(
    (leagueName: string) => {
      if (!isLeaguePinned(leagueName)) {
        togglePinLeague(leagueName);
      }
    },
    [isLeaguePinned, togglePinLeague]
  );

  const unpinLeague = useCallback(
    (leagueName: string) => {
      if (isLeaguePinned(leagueName)) {
        togglePinLeague(leagueName);
      }
    },
    [isLeaguePinned, togglePinLeague]
  );

  const pinTeam = useCallback(
    (teamName: string) => {
      if (!isTeamPinned(teamName)) {
        togglePinTeam(teamName);
      }
    },
    [isTeamPinned, togglePinTeam]
  );

  const unpinTeam = useCallback(
    (teamName: string) => {
      if (isTeamPinned(teamName)) {
        togglePinTeam(teamName);
      }
    },
    [isTeamPinned, togglePinTeam]
  );

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

  return {
    isAuthenticated: !!user,
    user,
    pinnedLeagues,
    pinnedTeams,
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
  };
}
