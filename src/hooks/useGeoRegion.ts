import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GeographicRegionId,
  RegionDefinition,
  GEOGRAPHIC_REGIONS,
  detectUserGeographicRegion,
  setGeographicRegionOverride,
  getPrioritizedLeaguesForRegion,
  getLeagueRelevanceScore,
  sortPredictionsByRegion,
  sortLiveFixturesByRegion,
} from '@/services/geoRegionService';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export function useGeoRegion() {
  const { preferences } = useUserPreferences();
  const [geoState, setGeoState] = useState(() => detectUserGeographicRegion());

  // Listen for storage or external custom changes
  useEffect(() => {
    const handleRegionChange = () => {
      setGeoState(detectUserGeographicRegion());
    };

    window.addEventListener('predictpro_geo_region_changed', handleRegionChange);
    window.addEventListener('storage', handleRegionChange);

    return () => {
      window.removeEventListener('predictpro_geo_region_changed', handleRegionChange);
      window.removeEventListener('storage', handleRegionChange);
    };
  }, []);

  const changeRegion = useCallback((newRegionId: GeographicRegionId | 'auto') => {
    setGeographicRegionOverride(newRegionId);
    setGeoState(detectUserGeographicRegion());
  }, []);

  const prioritizedLeagues = useMemo(() => {
    return getPrioritizedLeaguesForRegion(geoState.regionId, preferences?.favoriteLeagues || []);
  }, [geoState.regionId, preferences?.favoriteLeagues]);

  const sortPredictions = useCallback(
    <T extends { league: string; match_date?: string | Date; confidence?: number; confidence_score?: number }>(items: T[]): T[] => {
      return sortPredictionsByRegion(items, geoState.regionId, preferences?.favoriteLeagues || []);
    },
    [geoState.regionId, preferences?.favoriteLeagues]
  );

  const sortLiveFixtures = useCallback(
    <T extends { league: string; status: string; minute?: number | string; match_date?: string | Date }>(items: T[]): T[] => {
      return sortLiveFixturesByRegion(items, geoState.regionId, preferences?.favoriteLeagues || []);
    },
    [geoState.regionId, preferences?.favoriteLeagues]
  );

  const getLeagueBadge = useCallback(
    (leagueName: string) => {
      const info = getLeagueRelevanceScore(leagueName, geoState.regionId, preferences?.favoriteLeagues || []);
      return {
        badgeLabel: info.badgeLabel,
        isDomestic: info.isDomestic,
        score: info.score,
      };
    },
    [geoState.regionId, preferences?.favoriteLeagues]
  );

  const allRegions = useMemo(() => Object.values(GEOGRAPHIC_REGIONS), []);

  return {
    regionId: geoState.regionId,
    region: geoState.region,
    isAutoDetected: geoState.isAutoDetected,
    detectedTimezone: geoState.detectedTimezone,
    matchedBy: geoState.matchedBy,
    setRegion: changeRegion,
    prioritizedLeagues,
    sortPredictions,
    sortLiveFixtures,
    getLeagueBadge,
    allRegions,
  };
}
