import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const EMPTY_FAV_LEAGUES: string[] = [];

export function useGeoRegion() {
  const { preferences } = useUserPreferences();
  const [geoState, setGeoState] = useState(() => detectUserGeographicRegion());
  const favoriteLeagues = preferences?.favoriteLeagues ?? EMPTY_FAV_LEAGUES;

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
    return getPrioritizedLeaguesForRegion(geoState.regionId, favoriteLeagues);
  }, [geoState.regionId, favoriteLeagues]);

  const sortPredictions = useCallback(
    <T extends { league: string; match_date?: string | Date; confidence?: number; confidence_score?: number }>(items: T[]): T[] => {
      return sortPredictionsByRegion(items, geoState.regionId, favoriteLeagues);
    },
    [geoState.regionId, favoriteLeagues]
  );

  const sortLiveFixtures = useCallback(
    <T extends { league: string; status: string; minute?: number | string | null; match_date?: string | Date }>(items: T[]): T[] => {
      return sortLiveFixturesByRegion(items, geoState.regionId, favoriteLeagues);
    },
    [geoState.regionId, favoriteLeagues]
  );

  const getLeagueBadge = useCallback(
    (leagueName: string) => {
      const info = getLeagueRelevanceScore(leagueName, geoState.regionId, favoriteLeagues);
      return {
        badgeLabel: info.badgeLabel,
        isDomestic: info.isDomestic,
        score: info.score,
        flag: info.flag,
      };
    },
    [geoState.regionId, favoriteLeagues]
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

export const GeoRegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};
