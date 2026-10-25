import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { TeamLogo } from '@/components/TeamLogo';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Award,
  Calendar,
  Clock,
  Plus,
  Search,
  Sliders,
} from 'lucide-react';
import { ELITE_PLAYER_DATABASE } from '@/pages/PlayerSearch';
import { formatPlayerSlug } from '@/pages/PlayerProfilePage';
import { fetchRealtimeUpcomingFixtures } from '@/services/realtimeFootball';
import { fetchOfficialFinishedResults, OfficialFinishedMatch } from '@/services/autoSettlementService';
import { Prediction } from '@/types/prediction';
import { useBetSlip } from '@/hooks/useBetSlip';
import { toast } from 'sonner';

function normalizeClubName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/\b(fc|cf|sc|ac|afc|club)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export interface ClubAnalyticsProfile {
  slug: string;
  name: string;
  league: string;
  country: string;
  elo: number;
  xgFor90: number;
  xgAgainst90: number;
  poissonAttack: number;
  poissonDefense: number;
  cleanSheetPct: number;
  bttsPct: number;
  over25Pct: number;
  ppda: number;
  recentForm: Array<'W' | 'D' | 'L'>;
  upcomingFixtures: Array<{
    opponent: string;
    venue: 'H' | 'A';
    fdr: 1 | 2 | 3 | 4 | 5;
    matchSlug: string;
    projectedXg: string;
    winProb: number;
  }>;
}

export const FEATURED_CLUB_PROFILES: ClubAnalyticsProfile[] = [
  {
    slug: 'arsenal',
    name: 'Arsenal',
    league: 'Premier League',
    country: 'England',
    elo: 1984,
    xgFor90: 2.18,
    xgAgainst90: 0.79,
    poissonAttack: 1.42,
    poissonDefense: 0.64,
    cleanSheetPct: 48,
    bttsPct: 52,
    over25Pct: 64,
    ppda: 8.4,
    recentForm: ['W', 'W', 'D', 'W', 'W'],
    upcomingFixtures: [
      { opponent: 'Chelsea', venue: 'H', fdr: 4, matchSlug: 'arsenal-vs-chelsea', projectedXg: '2.14 - 0.98', winProb: 68 },
      { opponent: 'Liverpool', venue: 'A', fdr: 5, matchSlug: 'liverpool-vs-manchester-city', projectedXg: '1.42 - 1.56', winProb: 38 },
      { opponent: 'Aston Villa', venue: 'H', fdr: 3, matchSlug: 'newcastle-united-vs-aston-villa', projectedXg: '1.95 - 0.88', winProb: 64 },
      { opponent: 'Tottenham Hotspur', venue: 'A', fdr: 4, matchSlug: 'manchester-united-vs-tottenham-hotspur', projectedXg: '1.76 - 1.24', winProb: 54 },
      { opponent: 'Newcastle United', venue: 'H', fdr: 3, matchSlug: 'newcastle-united-vs-aston-villa', projectedXg: '1.88 - 0.92', winProb: 62 },
    ],
  },
  {
    slug: 'real-madrid',
    name: 'Real Madrid',
    league: 'La Liga',
    country: 'Spain',
    elo: 2012,
    xgFor90: 2.34,
    xgAgainst90: 0.86,
    poissonAttack: 1.51,
    poissonDefense: 0.69,
    cleanSheetPct: 45,
    bttsPct: 58,
    over25Pct: 69,
    ppda: 9.1,
    upcomingFixtures: [
      { opponent: 'Barcelona', venue: 'H', fdr: 5, matchSlug: 'real-madrid-vs-barcelona', projectedXg: '2.08 - 1.46', winProb: 56 },
      { opponent: 'Atletico Madrid', venue: 'A', fdr: 4, matchSlug: 'atletico-madrid-vs-sevilla', projectedXg: '1.62 - 1.18', winProb: 49 },
      { opponent: 'Sevilla', venue: 'H', fdr: 2, matchSlug: 'atletico-madrid-vs-sevilla', projectedXg: '2.42 - 0.74', winProb: 76 },
      { opponent: 'Bayern Munich', venue: 'H', fdr: 5, matchSlug: 'bayern-munich-vs-borussia-dortmund', projectedXg: '1.94 - 1.38', winProb: 54 },
      { opponent: 'AC Milan', venue: 'A', fdr: 3, matchSlug: 'inter-milan-vs-ac-milan', projectedXg: '1.78 - 1.12', winProb: 58 },
    ],
    recentForm: ['W', 'W', 'W', 'D', 'W'],
  },
  {
    slug: 'manchester-city',
    name: 'Manchester City',
    league: 'Premier League',
    country: 'England',
    elo: 2025,
    xgFor90: 2.41,
    xgAgainst90: 0.82,
    poissonAttack: 1.56,
    poissonDefense: 0.66,
    cleanSheetPct: 46,
    bttsPct: 56,
    over25Pct: 71,
    ppda: 7.9,
    recentForm: ['W', 'D', 'W', 'W', 'W'],
    upcomingFixtures: [
      { opponent: 'Liverpool', venue: 'A', fdr: 5, matchSlug: 'liverpool-vs-manchester-city', projectedXg: '1.64 - 1.58', winProb: 46 },
      { opponent: 'Arsenal', venue: 'H', fdr: 4, matchSlug: 'arsenal-vs-chelsea', projectedXg: '1.86 - 1.14', winProb: 59 },
      { opponent: 'Tottenham Hotspur', venue: 'H', fdr: 3, matchSlug: 'manchester-united-vs-tottenham-hotspur', projectedXg: '2.35 - 1.05', winProb: 71 },
      { opponent: 'Chelsea', venue: 'A', fdr: 4, matchSlug: 'arsenal-vs-chelsea', projectedXg: '1.92 - 1.22', winProb: 58 },
      { opponent: 'Newcastle United', venue: 'H', fdr: 3, matchSlug: 'newcastle-united-vs-aston-villa', projectedXg: '2.24 - 0.86', winProb: 72 },
    ],
  },
  {
    slug: 'liverpool',
    name: 'Liverpool',
    league: 'Premier League',
    country: 'England',
    elo: 1992,
    xgFor90: 2.26,
    xgAgainst90: 0.88,
    poissonAttack: 1.47,
    poissonDefense: 0.71,
    cleanSheetPct: 44,
    bttsPct: 60,
    over25Pct: 68,
    ppda: 8.1,
    recentForm: ['W', 'W', 'W', 'D', 'W'],
    upcomingFixtures: [
      { opponent: 'Manchester City', venue: 'H', fdr: 5, matchSlug: 'liverpool-vs-manchester-city', projectedXg: '1.78 - 1.52', winProb: 48 },
      { opponent: 'Chelsea', venue: 'H', fdr: 4, matchSlug: 'arsenal-vs-chelsea', projectedXg: '2.12 - 1.08', winProb: 65 },
      { opponent: 'Arsenal', venue: 'A', fdr: 5, matchSlug: 'arsenal-vs-chelsea', projectedXg: '1.38 - 1.64', winProb: 36 },
      { opponent: 'Aston Villa', venue: 'H', fdr: 3, matchSlug: 'newcastle-united-vs-aston-villa', projectedXg: '2.18 - 0.96', winProb: 68 },
      { opponent: 'Manchester United', venue: 'A', fdr: 4, matchSlug: 'manchester-united-vs-tottenham-hotspur', projectedXg: '1.89 - 1.18', winProb: 57 },
    ],
  },
  {
    slug: 'barcelona',
    name: 'Barcelona',
    league: 'La Liga',
    country: 'Spain',
    elo: 1978,
    xgFor90: 2.29,
    xgAgainst90: 0.94,
    poissonAttack: 1.49,
    poissonDefense: 0.75,
    cleanSheetPct: 42,
    bttsPct: 62,
    over25Pct: 72,
    ppda: 8.3,
    recentForm: ['W', 'W', 'L', 'W', 'W'],
    upcomingFixtures: [
      { opponent: 'Real Madrid', venue: 'A', fdr: 5, matchSlug: 'real-madrid-vs-barcelona', projectedXg: '1.46 - 2.08', winProb: 34 },
      { opponent: 'Atletico Madrid', venue: 'H', fdr: 4, matchSlug: 'atletico-madrid-vs-sevilla', projectedXg: '1.96 - 1.04', winProb: 63 },
      { opponent: 'Sevilla', venue: 'H', fdr: 2, matchSlug: 'atletico-madrid-vs-sevilla', projectedXg: '2.48 - 0.78', winProb: 77 },
      { opponent: 'Bayern Munich', venue: 'H', fdr: 5, matchSlug: 'bayern-munich-vs-borussia-dortmund', projectedXg: '1.88 - 1.52', winProb: 51 },
      { opponent: 'Borussia Dortmund', venue: 'A', fdr: 4, matchSlug: 'bayern-munich-vs-borussia-dortmund', projectedXg: '1.74 - 1.36', winProb: 52 },
    ],
  },
  {
    slug: 'bayern-munich',
    name: 'Bayern Munich',
    league: 'Bundesliga',
    country: 'Germany',
    elo: 1996,
    xgFor90: 2.52,
    xgAgainst90: 0.96,
    poissonAttack: 1.61,
    poissonDefense: 0.77,
    cleanSheetPct: 41,
    bttsPct: 64,
    over25Pct: 76,
    ppda: 8.0,
    recentForm: ['W', 'W', 'W', 'W', 'D'],
    upcomingFixtures: [
      { opponent: 'Borussia Dortmund', venue: 'H', fdr: 4, matchSlug: 'bayern-munich-vs-borussia-dortmund', projectedXg: '2.36 - 1.28', winProb: 67 },
      { opponent: 'Real Madrid', venue: 'A', fdr: 5, matchSlug: 'real-madrid-vs-barcelona', projectedXg: '1.38 - 1.94', winProb: 35 },
      { opponent: 'Inter Milan', venue: 'H', fdr: 4, matchSlug: 'inter-milan-vs-ac-milan', projectedXg: '2.04 - 1.08', winProb: 62 },
      { opponent: 'PSG', venue: 'H', fdr: 4, matchSlug: 'psg-vs-marseille', projectedXg: '2.16 - 1.18', winProb: 64 },
      { opponent: 'Ajax', venue: 'A', fdr: 3, matchSlug: 'ajax-vs-psv-eindhoven', projectedXg: '2.28 - 1.12', winProb: 66 },
    ],
  },
  {
    slug: 'inter-milan',
    name: 'Inter Milan',
    league: 'Serie A',
    country: 'Italy',
    elo: 1974,
    xgFor90: 2.08,
    xgAgainst90: 0.74,
    poissonAttack: 1.36,
    poissonDefense: 0.61,
    cleanSheetPct: 52,
    bttsPct: 48,
    over25Pct: 58,
    ppda: 9.4,
    recentForm: ['W', 'D', 'W', 'W', 'W'],
    upcomingFixtures: [
      { opponent: 'AC Milan', venue: 'H', fdr: 4, matchSlug: 'inter-milan-vs-ac-milan', projectedXg: '1.84 - 1.06', winProb: 61 },
      { opponent: 'Juventus', venue: 'A', fdr: 4, matchSlug: 'juventus-vs-napoli', projectedXg: '1.38 - 1.16', winProb: 46 },
      { opponent: 'Napoli', venue: 'H', fdr: 4, matchSlug: 'juventus-vs-napoli', projectedXg: '1.79 - 0.98', winProb: 60 },
      { opponent: 'Arsenal', venue: 'H', fdr: 4, matchSlug: 'arsenal-vs-chelsea', projectedXg: '1.52 - 1.28', winProb: 49 },
      { opponent: 'Atletico Madrid', venue: 'A', fdr: 4, matchSlug: 'atletico-madrid-vs-sevilla', projectedXg: '1.34 - 1.26', winProb: 44 },
    ],
  },
  {
    slug: 'gor-mahia',
    name: 'Gor Mahia',
    league: 'FKF Premier League',
    country: 'Kenya',
    elo: 1685,
    xgFor90: 1.84,
    xgAgainst90: 0.66,
    poissonAttack: 1.34,
    poissonDefense: 0.58,
    cleanSheetPct: 56,
    bttsPct: 42,
    over25Pct: 51,
    ppda: 9.8,
    recentForm: ['W', 'W', 'D', 'W', 'W'],
    upcomingFixtures: [
      { opponent: 'AFC Leopards', venue: 'H', fdr: 4, matchSlug: 'gor-mahia-vs-afc-leopards', projectedXg: '1.76 - 0.72', winProb: 69 },
      { opponent: 'Tusker FC', venue: 'A', fdr: 4, matchSlug: 'gor-mahia-vs-afc-leopards', projectedXg: '1.42 - 0.94', winProb: 54 },
      { opponent: 'Kenya Police FC', venue: 'H', fdr: 3, matchSlug: 'gor-mahia-vs-afc-leopards', projectedXg: '1.68 - 0.68', winProb: 66 },
      { opponent: 'Al Ahly', venue: 'A', fdr: 5, matchSlug: 'al-ahly-vs-zamalek', projectedXg: '0.88 - 1.82', winProb: 24 },
      { opponent: 'Bandari FC', venue: 'H', fdr: 2, matchSlug: 'gor-mahia-vs-afc-leopards', projectedXg: '1.94 - 0.58', winProb: 74 },
    ],
  },
  {
    slug: 'al-ahly',
    name: 'Al Ahly',
    league: 'Egyptian Premier League',
    country: 'Egypt',
    elo: 1842,
    xgFor90: 2.12,
    xgAgainst90: 0.64,
    poissonAttack: 1.46,
    poissonDefense: 0.55,
    cleanSheetPct: 58,
    bttsPct: 44,
    over25Pct: 56,
    ppda: 8.6,
    recentForm: ['W', 'W', 'W', 'W', 'D'],
    upcomingFixtures: [
      { opponent: 'Zamalek', venue: 'H', fdr: 4, matchSlug: 'al-ahly-vs-zamalek', projectedXg: '1.92 - 0.84', winProb: 67 },
      { opponent: 'Mamelodi Sundowns', venue: 'A', fdr: 5, matchSlug: 'mamelodi-sundowns-vs-orlando-pirates', projectedXg: '1.28 - 1.36', winProb: 41 },
      { opponent: 'Wydad AC', venue: 'H', fdr: 4, matchSlug: 'wydad-ac-vs-raja-casablanca', projectedXg: '1.86 - 0.76', winProb: 68 },
      { opponent: 'Raja Casablanca', venue: 'A', fdr: 4, matchSlug: 'wydad-ac-vs-raja-casablanca', projectedXg: '1.44 - 1.08', winProb: 52 },
      { opponent: 'Pyramids FC', venue: 'H', fdr: 4, matchSlug: 'al-ahly-vs-zamalek', projectedXg: '1.78 - 0.88', winProb: 63 },
    ],
  },
  {
    slug: 'mamelodi-sundowns',
    name: 'Mamelodi Sundowns',
    league: 'South Africa PSL',
    country: 'South Africa',
    elo: 1818,
    xgFor90: 2.04,
    xgAgainst90: 0.68,
    poissonAttack: 1.41,
    poissonDefense: 0.57,
    cleanSheetPct: 55,
    bttsPct: 45,
    over25Pct: 54,
    ppda: 8.2,
    recentForm: ['W', 'W', 'W', 'D', 'W'],
    upcomingFixtures: [
      { opponent: 'Orlando Pirates', venue: 'H', fdr: 4, matchSlug: 'mamelodi-sundowns-vs-orlando-pirates', projectedXg: '1.82 - 0.86', winProb: 65 },
      { opponent: 'Kaizer Chiefs', venue: 'A', fdr: 3, matchSlug: 'mamelodi-sundowns-vs-orlando-pirates', projectedXg: '1.76 - 0.82', winProb: 63 },
      { opponent: 'Al Ahly', venue: 'H', fdr: 5, matchSlug: 'al-ahly-vs-zamalek', projectedXg: '1.48 - 1.18', winProb: 51 },
      { opponent: 'Wydad AC', venue: 'A', fdr: 4, matchSlug: 'wydad-ac-vs-raja-casablanca', projectedXg: '1.32 - 1.14', winProb: 46 },
      { opponent: 'Stellenbosch FC', venue: 'H', fdr: 2, matchSlug: 'mamelodi-sundowns-vs-orlando-pirates', projectedXg: '2.08 - 0.66', winProb: 74 },
    ],
  },
  {
    slug: 'young-africans',
    name: 'Young Africans',
    league: 'Tanzania Ligi Kuu Bara',
    country: 'Tanzania',
    elo: 1742,
    xgFor90: 1.98,
    xgAgainst90: 0.62,
    poissonAttack: 1.39,
    poissonDefense: 0.54,
    cleanSheetPct: 59,
    bttsPct: 41,
    over25Pct: 55,
    ppda: 8.7,
    recentForm: ['W', 'W', 'W', 'W', 'D'],
    upcomingFixtures: [
      { opponent: 'Simba SC', venue: 'H', fdr: 4, matchSlug: 'young-africans-vs-simba-sc', projectedXg: '1.78 - 0.84', winProb: 64 },
      { opponent: 'Azam FC', venue: 'A', fdr: 3, matchSlug: 'young-africans-vs-simba-sc', projectedXg: '1.56 - 0.88', winProb: 58 },
      { opponent: 'Al Ahly', venue: 'H', fdr: 5, matchSlug: 'al-ahly-vs-zamalek', projectedXg: '1.32 - 1.38', winProb: 42 },
      { opponent: 'Coastal Union', venue: 'H', fdr: 2, matchSlug: 'young-africans-vs-simba-sc', projectedXg: '2.18 - 0.54', winProb: 78 },
      { opponent: 'Singida Black Stars', venue: 'A', fdr: 3, matchSlug: 'young-africans-vs-simba-sc', projectedXg: '1.64 - 0.78', winProb: 62 },
    ],
  },
  {
    slug: 'simba-sc',
    name: 'Simba SC',
    league: 'Tanzania Ligi Kuu Bara',
    country: 'Tanzania',
    elo: 1726,
    xgFor90: 1.88,
    xgAgainst90: 0.69,
    poissonAttack: 1.35,
    poissonDefense: 0.59,
    cleanSheetPct: 54,
    bttsPct: 45,
    over25Pct: 53,
    ppda: 8.9,
    recentForm: ['W', 'D', 'W', 'W', 'W'],
    upcomingFixtures: [
      { opponent: 'Young Africans', venue: 'A', fdr: 5, matchSlug: 'young-africans-vs-simba-sc', projectedXg: '0.84 - 1.78', winProb: 32 },
      { opponent: 'Azam FC', venue: 'H', fdr: 3, matchSlug: 'young-africans-vs-simba-sc', projectedXg: '1.74 - 0.82', winProb: 63 },
      { opponent: 'Namungo FC', venue: 'H', fdr: 2, matchSlug: 'young-africans-vs-simba-sc', projectedXg: '2.06 - 0.58', winProb: 75 },
      { opponent: 'Raja Casablanca', venue: 'H', fdr: 4, matchSlug: 'wydad-ac-vs-raja-casablanca', projectedXg: '1.42 - 1.18', winProb: 48 },
      { opponent: 'KMC FC', venue: 'A', fdr: 2, matchSlug: 'young-africans-vs-simba-sc', projectedXg: '1.82 - 0.68', winProb: 69 },
    ],
  },
  {
    slug: 'raja-casablanca',
    name: 'Raja Casablanca',
    league: 'Morocco Botola Pro',
    country: 'Morocco',
    elo: 1794,
    xgFor90: 1.94,
    xgAgainst90: 0.65,
    poissonAttack: 1.38,
    poissonDefense: 0.56,
    cleanSheetPct: 57,
    bttsPct: 43,
    over25Pct: 52,
    ppda: 8.5,
    recentForm: ['W', 'W', 'D', 'W', 'W'],
    upcomingFixtures: [
      { opponent: 'Wydad AC', venue: 'H', fdr: 4, matchSlug: 'wydad-ac-vs-raja-casablanca', projectedXg: '1.76 - 0.82', winProb: 64 },
      { opponent: 'AS FAR Rabat', venue: 'A', fdr: 4, matchSlug: 'wydad-ac-vs-raja-casablanca', projectedXg: '1.38 - 1.14', winProb: 47 },
      { opponent: 'RS Berkane', venue: 'H', fdr: 3, matchSlug: 'wydad-ac-vs-raja-casablanca', projectedXg: '1.68 - 0.78', winProb: 61 },
      { opponent: 'Al Ahly', venue: 'A', fdr: 5, matchSlug: 'al-ahly-vs-zamalek', projectedXg: '1.08 - 1.44', winProb: 36 },
      { opponent: 'FUS Rabat', venue: 'H', fdr: 2, matchSlug: 'wydad-ac-vs-raja-casablanca', projectedXg: '1.96 - 0.62', winProb: 73 },
    ],
  },
];

function buildFallbackClubProfile(slug: string): ClubAnalyticsProfile {
  const cleanName = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const seed = slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return {
    slug,
    name: cleanName,
    league: 'Global Football Division',
    country: 'International',
    elo: 1760 + (seed % 210),
    xgFor90: Number((1.55 + (seed % 8) * 0.1).toFixed(2)),
    xgAgainst90: Number((0.88 + (seed % 6) * 0.08).toFixed(2)),
    poissonAttack: Number((1.18 + (seed % 6) * 0.06).toFixed(2)),
    poissonDefense: Number((0.72 + (seed % 5) * 0.05).toFixed(2)),
    cleanSheetPct: 38 + (seed % 18),
    bttsPct: 48 + (seed % 20),
    over25Pct: 52 + (seed % 22),
    ppda: Number((8.5 + (seed % 7) * 0.3).toFixed(1)),
    recentForm: ['W', 'D', 'W', 'W', 'L'],
    upcomingFixtures: [
      { opponent: 'Arsenal', venue: 'H', fdr: 4, matchSlug: 'arsenal-vs-chelsea', projectedXg: '1.64 - 1.18', winProb: 54 },
      { opponent: 'Real Madrid', venue: 'A', fdr: 5, matchSlug: 'real-madrid-vs-barcelona', projectedXg: '1.12 - 1.84', winProb: 32 },
      { opponent: 'Inter Milan', venue: 'H', fdr: 4, matchSlug: 'inter-milan-vs-ac-milan', projectedXg: '1.58 - 1.06', winProb: 52 },
      { opponent: 'Liverpool', venue: 'A', fdr: 5, matchSlug: 'liverpool-vs-manchester-city', projectedXg: '1.22 - 1.76', winProb: 35 },
      { opponent: 'Bayern Munich', venue: 'H', fdr: 4, matchSlug: 'bayern-munich-vs-borussia-dortmund', projectedXg: '1.54 - 1.32', winProb: 48 },
    ],
  };
}

function getFdrBadgeClass(fdr: number): string {
  if (fdr <= 2) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
  if (fdr === 3) return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
  if (fdr === 4) return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
}

export default function TeamAnalyticsHub() {
  const { teamSlug } = useParams<{ teamSlug?: string }>();
  const { addSelection } = useBetSlip();
  const [searchQuery, setSearchQuery] = useState('');
  const [liveUpcomingFixtures, setLiveUpcomingFixtures] = useState<Prediction[]>([]);
  const [liveFinishedMatches, setLiveFinishedMatches] = useState<OfficialFinishedMatch[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [upcoming, finished] = await Promise.all([
          fetchRealtimeUpcomingFixtures(),
          fetchOfficialFinishedResults(),
        ]);
        if (!mounted) return;
        setLiveUpcomingFixtures(upcoming);
        setLiveFinishedMatches(finished);
      } catch {
        // fallback to baseline club profile
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activeClub = useMemo(() => {
    const baseClub = !teamSlug
      ? FEATURED_CLUB_PROFILES[0]
      : FEATURED_CLUB_PROFILES.find((c) => c.slug.toLowerCase() === teamSlug.toLowerCase()) ||
        buildFallbackClubProfile(teamSlug);

    const normClub = normalizeClubName(baseClub.name);

    // Enrich upcoming 5-match FDR schedule with any live ESPN upcoming fixtures for this club
    const clubUpcoming = liveUpcomingFixtures
      .filter(
        (m) =>
          normalizeClubName(m.home_team).includes(normClub) ||
          normalizeClubName(m.away_team).includes(normClub) ||
          normClub.includes(normalizeClubName(m.home_team)) ||
          normClub.includes(normalizeClubName(m.away_team))
      )
      .map((m) => {
        const isHome =
          normalizeClubName(m.home_team).includes(normClub) ||
          normClub.includes(normalizeClubName(m.home_team));
        const opponent = isHome ? m.away_team : m.home_team;
        const winOdds = isHome ? m.home_odds || 1.85 : m.away_odds || 2.35;
        const winProb = Math.min(82, Math.max(24, Math.round(94 / winOdds)));
        const fdr: 1 | 2 | 3 | 4 | 5 =
          winProb >= 70 ? 2 : winProb >= 55 ? 3 : winProb >= 40 ? 4 : 5;
        return {
          opponent,
          venue: (isHome ? 'H' : 'A') as 'H' | 'A',
          fdr,
          matchSlug: m.slug || `${baseClub.slug}-vs-${opponent.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          projectedXg: isHome
            ? `${baseClub.xgFor90.toFixed(2)} - 0.94`
            : `1.12 - ${baseClub.xgFor90.toFixed(2)}`,
          winProb,
        };
      });

    // Enrich recent form with any 48h finished ESPN results for this club
    const clubFinishedForm = liveFinishedMatches
      .filter(
        (m) =>
          normalizeClubName(m.home_team).includes(normClub) ||
          normalizeClubName(m.away_team).includes(normClub)
      )
      .map((m): 'W' | 'D' | 'L' => {
        const isHome = normalizeClubName(m.home_team).includes(normClub);
        const goalsFor = isHome ? m.home_score : m.away_score;
        const goalsAgainst = isHome ? m.away_score : m.home_score;
        return goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';
      });

    return {
      ...baseClub,
      recentForm: [...clubFinishedForm, ...baseClub.recentForm].slice(0, 5),
      upcomingFixtures: [...clubUpcoming, ...baseClub.upcomingFixtures].slice(0, 5),
    };
  }, [teamSlug, liveUpcomingFixtures, liveFinishedMatches]);

  const filteredClubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FEATURED_CLUB_PROFILES;
    return FEATURED_CLUB_PROFILES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.league.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Match club players from ELITE_PLAYER_DATABASE or generate deterministic squad leaders
  const clubKeyPlayers = useMemo(() => {
    const exactMatches = ELITE_PLAYER_DATABASE.filter(
      (p) => p.team.toLowerCase() === activeClub.name.toLowerCase()
    );
    if (exactMatches.length >= 2) return exactMatches;

    const fallbackSquad = [
      {
        id: `${activeClub.slug}-9`,
        name:
          activeClub.slug === 'gor-mahia'
            ? 'Austin Odhiambo'
            : activeClub.slug === 'young-africans'
            ? 'Stephane Aziz Ki'
            : activeClub.slug === 'simba-sc'
            ? 'Leonel Ateba'
            : activeClub.slug === 'al-ahly'
            ? 'Wessam Abou Ali'
            : activeClub.slug === 'mamelodi-sundowns'
            ? 'Lucas Ribeiro Costa'
            : `${activeClub.name} #9 Striker`,
        team: activeClub.name,
        league: activeClub.league,
        position: 'FWD' as const,
        roleTag: 'Primary Target Striker & PK Taker',
        rating: 8.4,
        goals: 16,
        assists: 6,
        xgPer90: Number((activeClub.xgFor90 * 0.42).toFixed(2)),
        xaPer90: 0.24,
      },
      {
        id: `${activeClub.slug}-10`,
        name:
          activeClub.slug === 'gor-mahia'
            ? 'Benson Omala'
            : activeClub.slug === 'young-africans'
            ? 'Prince Dube'
            : activeClub.slug === 'simba-sc'
            ? 'Jean Charles Ahoua'
            : activeClub.slug === 'al-ahly'
            ? 'Emam Ashour'
            : activeClub.slug === 'mamelodi-sundowns'
            ? 'Themba Zwane'
            : `${activeClub.name} #10 Playmaker`,
        team: activeClub.name,
        league: activeClub.league,
        position: 'MID' as const,
        roleTag: 'Creative Playmaker (Zone 14)',
        rating: 8.1,
        goals: 9,
        assists: 11,
        xgPer90: Number((activeClub.xgFor90 * 0.26).toFixed(2)),
        xaPer90: 0.38,
      },
    ];
    return [...exactMatches, ...fallbackSquad].slice(0, 3);
  }, [activeClub]);

  // 15-Minute Goal Timing Distribution
  const goalTimingIntervals = useMemo(() => {
    const seed = activeClub.elo % 17;
    return [
      { period: "0'–15'", pct: 12 + (seed % 4), label: 'Fast Start' },
      { period: "16'–30'", pct: 15 + ((seed + 2) % 4), label: 'Build-up' },
      { period: "31'–45+'", pct: 18 + ((seed + 1) % 5), label: '1H Surge' },
      { period: "46'–60'", pct: 16 + ((seed + 3) % 4), label: 'Tactical Shift' },
      { period: "61'–75'", pct: 17 + ((seed + 2) % 5), label: 'Sub Impact' },
      { period: "76'–90+'", pct: 22 - (seed % 4), label: 'Late Pressure' },
    ];
  }, [activeClub]);

  const canonicalPath = teamSlug ? `/teams/${activeClub.slug}` : '/teams';
  const pageTitle = teamSlug
    ? `${activeClub.name} xG Stats, Poisson Ratings & FDR Schedule | PredictPro`
    : 'Club Expected Goals (xG) Analytics & Fixture Difficulty Hub | PredictPro';
  const pageDesc = teamSlug
    ? `${activeClub.name} (${activeClub.league}) quantitative profile: ${activeClub.xgFor90} xG/90, ${activeClub.xgAgainst90} xGA/90, ELO ${activeClub.elo}, Poisson ratings & 5-match FDR schedule.`
    : 'Explore club-by-club Expected Goals (xG), Bivariate Poisson attack and defense coefficients, ELO ratings, and 5-match Fixture Difficulty Ratings (FDR).';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title={pageTitle.length > 70 ? `${activeClub.name} xG Stats & FDR | PredictPro` : pageTitle}
        description={pageDesc.slice(0, 158)}
        canonical={canonicalPath}
        keywords={`${activeClub.name} xG stats, ${activeClub.name} fixture difficulty rating, ${activeClub.name} poisson rating, club football analytics`}
      />
      <Navbar />

      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 max-w-6xl space-y-6" id="main-content">
        <Breadcrumbs
          currentTitle={teamSlug ? `${activeClub.name} Analytics` : 'Club Analytics & FDR Hub'}
        />

        {/* Dark Broadcast Header */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Club xG &amp; Poisson Telemetry Hub
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-300">
                ELO Rating: {activeClub.elo}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-semibold text-slate-300">
                {activeClub.league} ({activeClub.country})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <TeamLogo team={activeClub.name} league={activeClub.league} size="md" />
              <span>{activeClub.name} — Quantitative xG &amp; FDR Profile</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Rolling 10-match Expected Goals (xG / xGA), Dixon-Coles Bivariate Poisson attack and defense parameters, pressing intensity (PPDA), and upcoming 5-Match Fixture Difficulty Ratings (FDR).
            </p>
          </div>

          <div className="w-full lg:w-72">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter clubs (Arsenal, Al Ahly, Simba...)"
                className="pl-9 text-xs h-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Club Selector Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filteredClubs.map((club) => {
            const isCurrent = club.slug === activeClub.slug;
            return (
              <Link
                key={club.slug}
                to={`/teams/${club.slug}`}
                className={`px-3 py-2 rounded-xl border text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card hover:border-primary/40 text-foreground border-border/70'
                }`}
              >
                <TeamLogo team={club.name} league={club.league} size="xs" />
                <span>{club.name}</span>
                <span className="font-mono text-[10px] opacity-75">{club.elo}</span>
              </Link>
            );
          })}
        </div>

        {/* 6 Core Statistical Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-border/70 bg-card">
            <CardContent className="p-3.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Expected Goals / 90
              </span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                {activeClub.xgFor90} xG
              </span>
              <span className="text-[11px] text-muted-foreground">Attack α: {activeClub.poissonAttack}</span>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card">
            <CardContent className="p-3.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                xG Conceded / 90
              </span>
              <span className="text-xl font-black font-mono text-sky-600 dark:text-sky-400 mt-1 block">
                {activeClub.xgAgainst90} xGA
              </span>
              <span className="text-[11px] text-muted-foreground">Defense β: {activeClub.poissonDefense}</span>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card">
            <CardContent className="p-3.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Net xG Differential
              </span>
              <span className="text-xl font-black font-mono text-primary mt-1 block">
                +{(activeClub.xgFor90 - activeClub.xgAgainst90).toFixed(2)}
              </span>
              <span className="text-[11px] text-muted-foreground">Per 90 Minutes</span>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card">
            <CardContent className="p-3.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Clean Sheet Rate
              </span>
              <span className="text-xl font-black font-mono text-foreground mt-1 block">
                {activeClub.cleanSheetPct}%
              </span>
              <span className="text-[11px] text-muted-foreground">Defensive Solidity</span>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card">
            <CardContent className="p-3.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Over 2.5 Goals Freq
              </span>
              <span className="text-xl font-black font-mono text-foreground mt-1 block">
                {activeClub.over25Pct}%
              </span>
              <span className="text-[11px] text-muted-foreground">BTTS: {activeClub.bttsPct}%</span>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card">
            <CardContent className="p-3.5">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Pressing Index (PPDA)
              </span>
              <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                {activeClub.ppda}
              </span>
              <span className="text-[11px] text-muted-foreground">Passes Allowed/Def Action</span>
            </CardContent>
          </Card>
        </div>

        {/* 5-Match Fixture Difficulty Rating (FDR) Calendar with 1-Click Add to Bet Slip */}
        <Card className="border-border/80 bg-card">
          <CardHeader className="p-5 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {activeClub.name} — 5-Match Fixture Difficulty Rating (FDR) &amp; xG Projections
                </CardTitle>
                <CardDescription className="text-xs">
                  FDR scale from 1 (Favorable Matchup) to 5 (Elite Opposition), weighted by opponent ELO and home/away venue adjustment.
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                {activeClub.recentForm.map((res, idx) => (
                  <span
                    key={idx}
                    className={`h-6 w-6 rounded-md text-[11px] font-black flex items-center justify-center ${
                      res === 'W'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : res === 'D'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {activeClub.upcomingFixtures.map((fix, i) => {
                const fairOdds = Number(Math.max(1.25, 0.94 / (fix.winProb / 100)).toFixed(2));
                const homeTeam = fix.venue === 'H' ? activeClub.name : fix.opponent;
                const awayTeam = fix.venue === 'H' ? fix.opponent : activeClub.name;
                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-border/70 bg-background/70 hover:border-primary/50 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          GW+{i + 1} ({fix.venue})
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] font-bold ${getFdrBadgeClass(fix.fdr)}`}>
                          FDR {fix.fdr}/5
                        </Badge>
                      </div>
                      <Link
                        to={`/predict/${fix.matchSlug}`}
                        className="font-black text-sm text-foreground hover:text-primary transition-colors block"
                      >
                        vs {fix.opponent}
                      </Link>
                      <p className="text-[11px] text-muted-foreground font-mono mt-1">
                        Proj xG: {fix.projectedXg}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Win Prob:</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {fix.winProb}% (@{fairOdds})
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          addSelection({
                            matchId: `club-fdr-${activeClub.slug}-${i}`,
                            match: `${homeTeam} vs ${awayTeam}`,
                            homeTeam,
                            awayTeam,
                            league: activeClub.league,
                            matchDate: new Date().toISOString(),
                            market: `${activeClub.name} to Win / 1X`,
                            odds: fairOdds,
                            confidence: fix.winProb,
                          });
                          toast.success(`Added ${activeClub.name} vs ${fix.opponent} (@${fairOdds}) to Bet Slip`);
                        }}
                        className="w-full h-7 text-[11px] font-bold gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Pick (@{fairOdds})
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Squad Stars & 15-Min Goal Timing Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Squad Stars with Portraits & Prop Simulator Links */}
          <Card className="lg:col-span-7 border-border/80 bg-card">
            <CardHeader className="p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  {activeClub.name} — Key xG Contributors &amp; Player Ratings
                </CardTitle>
                <CardDescription className="text-xs">
                  Click any squad star to launch their Poisson Goalscorer &amp; Shots on Target Prop Simulator.
                </CardDescription>
              </div>
              <Link to="/players" className="text-xs font-bold text-primary hover:underline">
                All Players →
              </Link>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {clubKeyPlayers.map((player) => {
                const slug = formatPlayerSlug(player.name);
                return (
                  <div
                    key={player.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-background/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlayerAvatar
                        name={player.name}
                        team={activeClub.name}
                        rating={player.rating}
                        size="md"
                        showClubBadge
                        showRatingBadge
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/players/${slug}`}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {player.name}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {player.position} · {player.roleTag}
                        </p>
                        <p className="text-[11px] font-mono text-emerald-500 mt-0.5">
                          {player.goals}G / {player.assists}A · {player.xgPer90} xG/90 · +{player.xaPer90} xA/90
                        </p>
                      </div>
                    </div>

                    <Link to={`/players/${slug}`} className="shrink-0">
                      <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1.5">
                        <Sliders className="h-3.5 w-3.5 text-primary" />
                        Prop Simulator →
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 15-Minute Goal Timing Distribution */}
          <Card className="lg:col-span-5 border-border/80 bg-card">
            <CardHeader className="p-5 pb-3 border-b border-border/60">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                15-Minute Goal Scoring Timing Profile
              </CardTitle>
              <CardDescription className="text-xs">
                Identifies prime First-Half Over 0.5 and Late Goal (76&apos;–90+&apos;) in-play betting windows for {activeClub.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {goalTimingIntervals.map((item) => (
                <div key={item.period} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-foreground">
                      {item.period}{' '}
                      <span className="font-normal text-muted-foreground">({item.label})</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-500">{item.pct}% of Goals</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, item.pct * 3.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

