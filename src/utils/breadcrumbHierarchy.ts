/**
 * Breadcrumb hierarchy generator and JSON-LD schema builder.
 * Derives accurate, search-engine-optimized breadcrumb chains based on route location.
 */

export interface BreadcrumbCrumb {
  name: string;
  item: string;
  current?: boolean;
}

export interface BreadcrumbOptions {
  customTitle?: string;
  category?: string;
  items?: BreadcrumbCrumb[];
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://predictpro.guru';

// Well-known blog titles and categories for rich crumbs
const KNOWN_BLOG_POSTS: Record<string, { title: string; category: string }> = {
  'how-to-read-football-predictions': {
    title: 'How to Read AI Football Predictions Like a Pro',
    category: 'Strategy',
  },
  'value-betting-explained': {
    title: 'Value Betting in Football: A Complete Guide',
    category: 'Strategy',
  },
  'bankroll-management-football': {
    title: 'Bankroll Management for Football Bettors',
    category: 'Finance',
  },
  'premier-league-prediction-guide-2026': {
    title: 'Premier League 2025/26 Prediction Guide',
    category: 'Premier League',
  },
  'champions-league-group-stage-tips': {
    title: 'Champions League Group Stage: How to Bet Smart',
    category: 'Champions League',
  },
  'btts-over-under-strategy': {
    title: 'BTTS and Over/Under: The Stats Behind Goal Markets',
    category: 'Markets',
  },
  'kpl-betting-guide-kenya': {
    title: 'Kenya Premier League Betting Guide 2026',
    category: 'KPL',
  },
  'accumulator-building-strategy': {
    title: 'How to Build a Winning Football Accumulator',
    category: 'Strategy',
  },
  'correct-score-prediction-tips': {
    title: 'Correct Score Betting: Can AI Really Predict the Scoreline?',
    category: 'Markets',
  },
  'sportpesa-mega-jackpot-prediction-17-games': {
    title: 'SportPesa Mega Jackpot Prediction: How to Win 17 Games Using AI',
    category: 'Jackpots',
  },
  'us-soccer-betting-guide-mls-odds': {
    title: 'US Soccer & MLS Betting Guide: Moneyline, Spreads & AI Picks',
    category: 'US Soccer',
  },
};

/**
 * Formats a slug into title-cased words (e.g. "arsenal-vs-chelsea" -> "Arsenal vs Chelsea")
 */
export function formatSlugToTitle(slug: string): string {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => {
      const lower = word.toLowerCase();
      if (lower === 'vs' || lower === 'v') return 'vs';
      if (lower === 'and' || lower === 'or' || lower === 'in' || lower === 'of') return lower;
      if (lower === 'epl') return 'EPL';
      if (lower === 'kpl') return 'KPL';
      if (lower === 'ucl') return 'UCL';
      if (lower === 'mls') return 'MLS';
      if (lower === 'btts') return 'BTTS';
      if (lower === 'h2h') return 'H2H';
      if (lower === 'xg') return 'xG';
      if (lower === 'ai') return 'AI';
      if (lower === 'afcon') return 'AFCON';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Builds the breadcrumb hierarchy for a given pathname.
 * Ensures the explicit requirement: Home > Predictions > [League/Market/Match]
 */
export function getBreadcrumbsForPath(
  pathname: string,
  options: BreadcrumbOptions = {}
): BreadcrumbCrumb[] {
  // If custom items are provided, return them normalized
  if (options.items && options.items.length > 0) {
    return options.items.map((crumb, idx) => ({
      ...crumb,
      current: idx === options.items!.length - 1,
    }));
  }

  const cleanPath = (pathname || '/').trim().replace(/\/+$/, '') || '/';

  // Home route
  if (cleanPath === '/') {
    return [{ name: 'Home', item: '/', current: true }];
  }

  const crumbs: BreadcrumbCrumb[] = [{ name: 'Home', item: '/' }];

  // 1. League Hubs (explicit hierarchy: Home > Predictions > [League])
  const leagueMappings: Record<string, string> = {
    '/premier-league-predictions': 'Premier League',
    '/champions-league-predictions': 'Champions League',
    '/la-liga-predictions': 'La Liga',
    '/bundesliga-predictions': 'Bundesliga',
    '/serie-a-predictions': 'Serie A',
    '/kpl-predictions': 'Kenya Premier League',
    '/jackpot-predictions': 'Mega Jackpot',
    '/us-soccer-predictions': 'US Soccer & MLS',
    '/world-cup-predictions': 'World Cup',
    '/afcon-predictions': 'AFCON',
  };

  if (leagueMappings[cleanPath]) {
    crumbs.push({ name: 'Predictions', item: '/predict' });
    crumbs.push({ name: leagueMappings[cleanPath], item: cleanPath, current: true });
    return crumbs;
  }

  // 2. Prediction Tools & Betting Markets (Home > Predictions > [Feature])
  const predictionFeatureMappings: Record<string, string> = {
    '/value-bets': 'Value Bets',
    '/best-bets': 'Best Banker Bets',
    '/correct-score': 'Correct Score',
    '/btts': 'BTTS (Both Teams Score)',
    '/accumulator': 'Acca Builder',
    '/tournaments': 'Global Tournaments',
    '/global-tournaments': 'Global Tournaments',
    '/dropping-odds': 'Dropping Odds',
    '/screener': 'Match Screener',
    '/streaks': 'Streaks Radar',
    '/trends': 'Streaks & Trends',
    '/track-record': 'Audited Track Record',
    '/standings': 'League Standings',
    '/upcoming': 'Upcoming Fixtures',
    '/upcoming-fixtures': 'Upcoming Fixtures',
    '/recommendations': 'AI Recommendations',
    '/h2h': 'H2H Comparison',
    '/compare': 'H2H Comparison',
  };

  if (predictionFeatureMappings[cleanPath]) {
    crumbs.push({ name: 'Predictions', item: '/predict' });
    crumbs.push({ name: predictionFeatureMappings[cleanPath], item: cleanPath, current: true });
    return crumbs;
  }

  // 3. Match Predictor & Dynamic Match Details (/predict, /predict/:matchSlug)
  if (cleanPath === '/predict') {
    crumbs.push({ name: 'Predictions', item: '/predict', current: true });
    return crumbs;
  }

  if (cleanPath.startsWith('/predict/')) {
    const slug = cleanPath.replace('/predict/', '');
    crumbs.push({ name: 'Predictions', item: '/predict' });
    const matchTitle = options.customTitle || formatSlugToTitle(slug) || 'Match Prediction';
    crumbs.push({ name: matchTitle, item: cleanPath, current: true });
    return crumbs;
  }

  // 4. Blog & Articles (/blog, /blog/:slug)
  if (cleanPath === '/blog') {
    crumbs.push({ name: 'Blog', item: '/blog', current: true });
    return crumbs;
  }

  if (cleanPath.startsWith('/blog/')) {
    const slug = cleanPath.replace('/blog/', '');
    crumbs.push({ name: 'Blog', item: '/blog' });

    const known = KNOWN_BLOG_POSTS[slug];
    const category = options.category || known?.category;
    if (category) {
      crumbs.push({ name: category, item: `/blog` });
    }

    const articleTitle = options.customTitle || known?.title || formatSlugToTitle(slug) || 'Article';
    crumbs.push({ name: articleTitle, item: cleanPath, current: true });
    return crumbs;
  }

  // 5. Standalone Top-level Pages
  const generalMappings: Record<string, string> = {
    '/live': 'Live Scores',
    '/news': 'Football News',
    '/insights': 'Market Insights',
    '/archive': 'Results Archive',
    '/results': 'Results Archive',
    '/statistics': 'Statistics',
    '/highlights': 'Match Highlights',
    '/players': 'Player Search',
    '/sports': 'Multi-Sports',
    '/tipsters': 'Tipsters Community',
    '/leaderboard': 'Tipsters Leaderboard',
    '/bankroll': 'Bankroll Manager',
    '/about': 'About PredictPro',
    '/methodology': 'Mathematical Methodology',
    '/sitemap': 'HTML Sitemap',
    '/seo-indexing': 'Google Indexing Console',
    '/shop': 'VIP Pro Shop',
    '/rewards': 'Rewards & Coins',
    '/dashboard': 'My Dashboard',
    '/my-dashboard': 'My Dashboard',
    '/preferences': 'User Preferences',
    '/auth': 'Sign In',
    '/admin': 'Admin Operations',
    '/performance': 'Performance Analytics',
  };

  if (generalMappings[cleanPath]) {
    crumbs.push({ name: generalMappings[cleanPath], item: cleanPath, current: true });
    return crumbs;
  }

  // 6. Generic path fallback for arbitrary nested paths (/section/sub-section)
  const segments = cleanPath.replace(/^\/+/, '').split('/');
  let accumulated = '';
  segments.forEach((seg, idx) => {
    accumulated += `/${seg}`;
    const isLast = idx === segments.length - 1;
    const name = isLast && options.customTitle ? options.customTitle : formatSlugToTitle(seg);
    crumbs.push({ name, item: accumulated, current: isLast });
  });

  return crumbs;
}

/**
 * Builds Schema.org BreadcrumbList structured data for search engine crawlers.
 */
export function generateBreadcrumbJsonLd(
  crumbs: BreadcrumbCrumb[],
  baseUrl: string = DEFAULT_BASE_URL
) {
  const cleanBase = baseUrl.replace(/\/+$/, '');

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => {
      const fullUrl = crumb.item.startsWith('http')
        ? crumb.item
        : `${cleanBase}${crumb.item.startsWith('/') ? crumb.item : `/${crumb.item}`}`;

      return {
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: fullUrl,
      };
    }),
  };
}
