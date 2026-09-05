import { DEFAULT_PREDICTIONS } from '@/data/mockPredictions';
import { LEAGUES, CURRENT_SEASON_STANDINGS, StandingRow, LeagueConfig } from '@/data/standingsData';
import { STRATEGY_POSTS, BlogPostItem } from '@/data/blogData';
import { Prediction } from '@/types/prediction';

export type SearchItemType = 'match' | 'league' | 'team' | 'blog';

export interface BaseSearchResult {
  id: string;
  type: SearchItemType;
  title: string;
  subtitle: string;
  url: string;
  score: number;
  tags?: string[];
}

export interface MatchSearchResult extends BaseSearchResult {
  type: 'match';
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  prediction: string;
  confidence: number;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  slug: string;
  rawPrediction: Prediction;
}

export interface LeagueSearchResult extends BaseSearchResult {
  type: 'league';
  leagueId: number;
  flag: string;
  season: string;
  matchdayLabel: string;
  totalMatchdays: number;
  currentMatchday: number;
  predictionsUrl?: string;
}

export interface TeamSearchResult extends BaseSearchResult {
  type: 'team';
  team: string;
  league: string;
  leagueId: number;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form?: string;
  logo?: string;
  winRate: number;
}

export interface BlogSearchResult extends BaseSearchResult {
  type: 'blog';
  slug: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
}

export type UnifiedSearchResult = 
  | MatchSearchResult 
  | LeagueSearchResult 
  | TeamSearchResult 
  | BlogSearchResult;

// Popular search suggestions for fast zero-state discovery
export const POPULAR_SEARCH_SUGGESTIONS = [
  { label: '⭐ Recommendations', type: 'match' as const, query: 'recommendations' },
  { label: '🛡️ Banker Tips', type: 'match' as const, query: 'Banker' },
  { label: 'Arsenal', type: 'team' as const, query: 'Arsenal' },
  { label: 'Premier League', type: 'league' as const, query: 'Premier League' },
  { label: 'Real Madrid', type: 'team' as const, query: 'Real Madrid' },
  { label: 'Champions League', type: 'league' as const, query: 'Champions League' },
  { label: 'Over 2.5 Goals', type: 'match' as const, query: 'Over 2.5' },
  { label: 'Gor Mahia', type: 'team' as const, query: 'Gor Mahia' },
];

/**
 * Generate a standard URL-safe match slug
 */
export function getMatchSlug(homeTeam: string, awayTeam: string, dateStr?: string): string {
  const cleanHome = (homeTeam || 'home').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const cleanAway = (awayTeam || 'away').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const d = dateStr ? dateStr.slice(0, 10) : new Date().toISOString().slice(0, 10);
  return `${cleanHome}-vs-${cleanAway}-${d}`;
}

/**
 * Map tournament / league custom predictions page if available
 */
function getLeaguePredictionsUrl(leagueName: string): string {
  const lower = leagueName.toLowerCase();
  if (lower.includes('premier league')) return '/premier-league-predictions';
  if (lower.includes('la liga')) return '/la-liga-predictions';
  if (lower.includes('serie a')) return '/serie-a-predictions';
  if (lower.includes('bundesliga')) return '/bundesliga-predictions';
  if (lower.includes('champions league')) return '/champions-league-predictions';
  if (lower.includes('kenya') || lower.includes('kpl')) return '/kpl-predictions';
  if (lower.includes('world cup')) return '/world-cup-predictions';
  if (lower.includes('afcon')) return '/afcon-predictions';
  return '/tournaments';
}

/**
 * Pre-build search corpus
 */
function buildMatchesCorpus(predictions: Prediction[]): MatchSearchResult[] {
  return predictions.map((p) => {
    const slug = getMatchSlug(p.home_team, p.away_team, p.match_date);
    const confidence = p.confidence_score ?? p.confidence ?? 75;
    const title = `${p.home_team} vs ${p.away_team}`;
    return {
      id: `match-${p.id || slug}`,
      type: 'match' as const,
      title,
      subtitle: `${p.league} • ${p.prediction} (${confidence}%)`,
      url: `/predict/${slug}`,
      score: 0,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      prediction: p.prediction || p.predicted_outcome || 'Pick',
      confidence,
      odds: {
        home: p.home_odds ?? 1.95,
        draw: p.draw_odds ?? 3.40,
        away: p.away_odds ?? 3.20,
      },
      slug,
      rawPrediction: p,
      tags: [p.home_team, p.away_team, p.league, p.prediction, p.reasoning, p.analysis].filter(Boolean) as string[],
    };
  });
}

function buildLeaguesCorpus(): LeagueSearchResult[] {
  return LEAGUES.map((l) => ({
    id: `league-${l.id}`,
    type: 'league' as const,
    title: `${l.flag} ${l.name}`,
    subtitle: `${l.season} • ${l.matchdayLabel}`,
    url: `/standings?league=${l.id}`,
    score: 0,
    leagueId: l.id,
    flag: l.flag,
    season: l.season,
    matchdayLabel: l.matchdayLabel,
    totalMatchdays: l.totalMatchdays,
    currentMatchday: l.currentMatchday,
    predictionsUrl: getLeaguePredictionsUrl(l.name),
    tags: [l.name, l.season, 'Standings', 'League Table', 'Tournament'],
  }));
}

function buildTeamsCorpus(): TeamSearchResult[] {
  const results: TeamSearchResult[] = [];

  Object.entries(CURRENT_SEASON_STANDINGS).forEach(([leagueIdStr, teams]) => {
    const leagueId = parseInt(leagueIdStr, 10);
    const leagueConfig = LEAGUES.find((l) => l.id === leagueId);
    const leagueName = leagueConfig?.name ?? 'Football League';

    teams.forEach((team) => {
      const winRate = team.played > 0 ? Math.round((team.won / team.played) * 100) : 0;
      results.push({
        id: `team-${leagueId}-${team.team.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        type: 'team' as const,
        title: team.team,
        subtitle: `#${team.position} in ${leagueName} • ${team.points} pts (Form: ${team.form || '—'})`,
        url: `/standings?league=${leagueId}`,
        score: 0,
        team: team.team,
        league: leagueName,
        leagueId,
        position: team.position,
        played: team.played,
        won: team.won,
        drawn: team.drawn,
        lost: team.lost,
        gf: team.gf,
        ga: team.ga,
        gd: team.gd,
        points: team.points,
        form: team.form,
        logo: team.logo,
        winRate,
        tags: [team.team, leagueName, `Pos #${team.position}`, `${team.points} points`],
      });
    });
  });

  return results;
}

function buildBlogCorpus(customPosts?: BlogPostItem[]): BlogSearchResult[] {
  const posts = customPosts && customPosts.length > 0 ? customPosts : STRATEGY_POSTS;
  return posts.map((post) => ({
    id: `blog-${post.slug}`,
    type: 'blog' as const,
    title: post.title,
    subtitle: `${post.category} • ${post.readTime} read • ${post.date}`,
    url: `/blog/${post.slug}`,
    score: 0,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    readTime: post.readTime,
    date: post.date,
    tags: [post.title, post.category, post.excerpt, post.keywords || ''].filter(Boolean),
  }));
}

/**
 * Score a text field against query terms
 */
function calculateTextScore(text: string, query: string, terms: string[]): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  let score = 0;

  // Exact phrase match
  if (lower === query) {
    score += 100;
  } else if (lower.startsWith(query)) {
    score += 60;
  } else if (lower.includes(query)) {
    score += 40;
  }

  // Individual terms match
  for (const term of terms) {
    if (term.length < 2) continue;
    if (lower.startsWith(term)) {
      score += 20;
    } else if (lower.includes(` ${term}`)) {
      score += 15;
    } else if (lower.includes(term)) {
      score += 8;
    }
  }

  return score;
}

/**
 * Search across matches, leagues, teams, and blog posts with relevance ranking
 */
export function executeUnifiedSearch(
  query: string,
  categoryFilter: 'all' | SearchItemType = 'all',
  options?: {
    customPredictions?: Prediction[];
    customBlogPosts?: BlogPostItem[];
    limit?: number;
  }
): {
  results: UnifiedSearchResult[];
  counts: {
    all: number;
    matches: number;
    leagues: number;
    teams: number;
    blog: number;
  };
} {
  const cleanQuery = query.trim().toLowerCase();
  const terms = cleanQuery.split(/\s+/).filter(Boolean);

  const matches = buildMatchesCorpus(options?.customPredictions || DEFAULT_PREDICTIONS);
  const leagues = buildLeaguesCorpus();
  const teams = buildTeamsCorpus();
  const blogs = buildBlogCorpus(options?.customBlogPosts);

  // If query is empty, return empty results with zero counts
  if (!cleanQuery) {
    return {
      results: [],
      counts: {
        all: 0,
        matches: 0,
        leagues: 0,
        teams: 0,
        blog: 0,
      },
    };
  }

  const scoredMatches: MatchSearchResult[] = [];
  const scoredLeagues: LeagueSearchResult[] = [];
  const scoredTeams: TeamSearchResult[] = [];
  const scoredBlogs: BlogSearchResult[] = [];

  // 1. Matches scoring
  matches.forEach((m) => {
    let score = 0;
    score += calculateTextScore(m.homeTeam, cleanQuery, terms) * 1.5;
    score += calculateTextScore(m.awayTeam, cleanQuery, terms) * 1.5;
    score += calculateTextScore(m.league, cleanQuery, terms) * 1.2;
    score += calculateTextScore(m.title, cleanQuery, terms) * 1.3;
    score += calculateTextScore(m.prediction, cleanQuery, terms);
    if (m.tags) {
      m.tags.forEach((t) => {
        score += calculateTextScore(t, cleanQuery, terms) * 0.5;
      });
    }

    if (cleanQuery.includes('banker') && m.confidence >= 75) {
      score += 50 + (m.confidence - 75);
    }
    if (cleanQuery.includes('value') && (m.odds.home >= 1.85 || m.odds.away >= 1.85)) {
      score += 45;
    }
    if ((cleanQuery.includes('recommend') || cleanQuery.includes('best')) && m.confidence >= 72) {
      score += 40;
    }

    if (score > 0) {
      scoredMatches.push({ ...m, score });
    }
  });

  // 2. Leagues scoring
  leagues.forEach((l) => {
    let score = 0;
    score += calculateTextScore(l.title, cleanQuery, terms) * 2.0;
    score += calculateTextScore(l.matchdayLabel, cleanQuery, terms);
    score += calculateTextScore(l.season, cleanQuery, terms);
    if (l.tags) {
      l.tags.forEach((t) => {
        score += calculateTextScore(t, cleanQuery, terms) * 0.7;
      });
    }

    if (score > 0) {
      scoredLeagues.push({ ...l, score });
    }
  });

  // 3. Teams scoring
  teams.forEach((t) => {
    let score = 0;
    score += calculateTextScore(t.team, cleanQuery, terms) * 2.0;
    score += calculateTextScore(t.league, cleanQuery, terms) * 0.8;
    score += calculateTextScore(t.form || '', cleanQuery, terms) * 0.5;

    if (score > 0) {
      scoredTeams.push({ ...t, score });
    }
  });

  // 4. Blogs scoring
  blogs.forEach((b) => {
    let score = 0;
    score += calculateTextScore(b.title, cleanQuery, terms) * 1.8;
    score += calculateTextScore(b.category, cleanQuery, terms) * 1.2;
    score += calculateTextScore(b.excerpt, cleanQuery, terms) * 0.6;
    if (b.tags) {
      b.tags.forEach((t) => {
        score += calculateTextScore(t, cleanQuery, terms) * 0.5;
      });
    }

    if (score > 0) {
      scoredBlogs.push({ ...b, score });
    }
  });

  const sortFn = (a: BaseSearchResult, b: BaseSearchResult) => b.score - a.score;
  scoredMatches.sort(sortFn);
  scoredLeagues.sort(sortFn);
  scoredTeams.sort(sortFn);
  scoredBlogs.sort(sortFn);

  const counts = {
    all: scoredMatches.length + scoredLeagues.length + scoredTeams.length + scoredBlogs.length,
    matches: scoredMatches.length,
    leagues: scoredLeagues.length,
    teams: scoredTeams.length,
    blog: scoredBlogs.length,
  };

  let results: UnifiedSearchResult[] = [];

  if (categoryFilter === 'matches') {
    results = scoredMatches;
  } else if (categoryFilter === 'leagues') {
    results = scoredLeagues;
  } else if (categoryFilter === 'teams') {
    results = scoredTeams;
  } else if (categoryFilter === 'blog') {
    results = scoredBlogs;
  } else {
    // Interleave top results for balanced discovery
    results = [...scoredMatches, ...scoredTeams, ...scoredLeagues, ...scoredBlogs].sort(sortFn);
  }

  const limit = options?.limit ?? 40;
  return {
    results: results.slice(0, limit),
    counts,
  };
}

/**
 * Local storage helper for recent queries
 */
const RECENT_SEARCHES_KEY = 'predictpro_recent_searches';

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    return JSON.parse(raw).slice(0, 8);
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return getRecentSearches();

  try {
    const current = getRecentSearches().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...current].slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // ignore
  }
}
