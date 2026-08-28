export const queryKeys = {
  predictions: {
    all: ['predictions'] as const,
    list: (page = 0) => ['predictions', 'list', page] as const,
    detail: (id: string) => ['predictions', 'detail', id] as const,
  },
  liveMatches:       { all: ['liveMatches'] as const },
  upcomingMatches:   { all: ['upcomingMatches'] as const },
  userPerformance: {
    all: ['userPerformance'] as const,
    byUser: (userId: string) => ['userPerformance', userId] as const,
  },
  accuracyStats:     { all: ['accuracyStats'] as const },
  coinPackages:      { all: ['coinPackages'] as const },
  predictionBundles: { all: ['predictionBundles'] as const },
  referrals: {
    all: ['referrals'] as const,
    byUser: (userId: string) => ['referrals', userId] as const,
  },
  streak: {
    all: ['streak'] as const,
    byUser: (userId: string) => ['streak', userId] as const,
  },
  subscription: {
    all: ['subscription'] as const,
    byUser: (userId: string) => ['subscription', userId] as const,
  },
  leaderboard: { all: ['leaderboard'] as const },
  football: {
    all: ['football'] as const,
    leagues: (country?: string) => ['football', 'leagues', country || 'all'] as const,
    liveFixtures: (leagueId?: number | string) => ['football', 'fixtures', 'live', leagueId || 'all'] as const,
    upcomingFixtures: (league?: string, daysAhead?: number) => ['football', 'fixtures', 'upcoming', league || 'all', daysAhead || 7] as const,
  },
} as const;
