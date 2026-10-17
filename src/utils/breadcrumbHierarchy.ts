/**
 * Breadcrumb hierarchy generator and JSON-LD schema builder.
 * Derives accurate, search-engine-optimized breadcrumb chains based on route location.
 */

export interface BreadcrumbCrumb {
  name?: string;
  item?: string;
  label?: string;
  href?: string;
  current?: boolean;
}

export interface NormalizedBreadcrumbCrumb {
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
): NormalizedBreadcrumbCrumb[] {
  const cleanPath = (pathname || '/').trim().replace(/\/+$/, '') || '/';

  // If custom items are provided, return them normalized (supporting both {name, item} and {label, href})
  if (options.items && options.items.length > 0) {
    return options.items.map((crumb, idx) => {
      const isLast = idx === options.items!.length - 1;
      const name =
        crumb?.name ||
        crumb?.label ||
        (isLast && options.customTitle ? options.customTitle : formatSlugToTitle(cleanPath.replace(/^\/+/, ''))) ||
        'Predictions';
      const rawItem = crumb?.item || crumb?.href || (isLast ? cleanPath : '/');
      const item =
        typeof rawItem === 'string' && rawItem.trim().length > 0
          ? rawItem.trim()
          : isLast
          ? cleanPath
          : '/';

      return {
        name,
        item,
        current: isLast,
      };
    });
  }

  // Home route
  if (cleanPath === '/') {
    return [{ name: 'Home', item: '/', current: true }];
  }

  const crumbs: NormalizedBreadcrumbCrumb[] = [{ name: 'Home', item: '/' }];

  // 1. League Hubs (explicit hierarchy: Home > Predictions > [League])
  const leagueMappings: Record<string, string> = {
    '/premier-league-predictions': 'Premier League',
    '/champions-league-predictions': 'Champions League',
    '/europa-league-predictions': 'Europa League',
    '/conference-league-predictions': 'Conference League',
    '/la-liga-predictions': 'La Liga',
    '/bundesliga-predictions': 'Bundesliga',
    '/serie-a-predictions': 'Serie A',
    '/ligue-1-predictions': 'Ligue 1',
    '/championship-predictions': 'EFL Championship',
    '/eredivisie-predictions': 'Dutch Eredivisie',
    '/primeira-liga-predictions': 'Primeira Liga',
    '/copa-libertadores-predictions': 'Copa Libertadores',
    '/brazilian-serie-a-predictions': 'Brasileirão Série A',
    '/argentina-primera-predictions': 'Argentina Primera',
    '/saudi-pro-league-predictions': 'Saudi Pro League',
    '/turkish-super-lig-predictions': 'Turkish Süper Lig',
    '/belgian-pro-league-predictions': 'Belgian Pro League',
    '/scottish-premiership-predictions': 'Scottish Premiership',
    '/greek-super-league-predictions': 'Greek Super League',
    '/liga-mx-predictions': 'Mexican Liga MX',
    '/mls-predictions': 'Major League Soccer',
    '/south-africa-psl-predictions': 'South Africa PSL',
    '/nigerian-npfl-predictions': 'Nigeria NPFL',
    '/egyptian-premier-league-predictions': 'Egypt Premier League',
    '/j-league-predictions': 'Japan J1 League',
    '/australian-a-league-predictions': 'Australia A-League',
    '/fa-cup-predictions': 'FA Cup & EFL Cup',
    '/kpl-predictions': 'Kenya Premier League',
    '/jackpot-predictions': 'Mega Jackpot',
    '/midweek-jackpot-predictions': 'Midweek Jackpot',
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
    '/sure-win-predictions': 'Sure Win Predictions',
    '/today-predictions': "Today's Football Predictions",
    '/tomorrow-predictions': 'Tomorrow Predictions',
    '/weekend-predictions': 'Weekend Predictions',
    '/over-1-5-goals-predictions': 'Over 1.5 Goals',
    '/over-2-5-goals-predictions': 'Over 2.5 Goals',
    '/over-3-5-goals-predictions': 'Over 3.5 Goals',
    '/under-2-5-goals-predictions': 'Under 2.5 Goals',
    '/first-half-goals-predictions': 'First Half (1H) Goals',
    '/second-half-goals-predictions': 'Second Half (2H) Goals',
    '/both-halves-predictions': 'Both Halves Predictions',
    '/btts-and-win-predictions': 'BTTS & Win Combos',
    '/both-teams-to-score-and-win-predictions': 'BTTS & Win Combos',
    '/bet-builder-predictions': 'Bet Builder & SGP',
    '/rollover-bets-predictions': 'Rollover Challenge',
    '/daily-2-odds-predictions': 'Daily 2, 3 & 5 Odds',
    '/2-odds-predictions': 'Sure 2 Odds Banker Tips',
    '/5-odds-predictions': 'Sure 5 & 10 Odds Accumulators',
    '/anytime-goalscorer-predictions': 'Goalscorer Predictions',
    '/double-chance-predictions': 'Double Chance (1X/X2)',
    '/ht-ft-predictions': 'HT/FT Predictions',
    '/draw-predictions': 'Draw Predictions',
    '/asian-handicap-predictions': 'Asian Handicap',
    '/handicap-1x2-predictions': 'European Handicap (-1)',
    '/corners-cards-predictions': 'Corners & Cards',
    '/draw-no-bet-predictions': 'Draw No Bet (DNB)',
    '/win-to-nil-predictions': 'Win to Nil & Clean Sheet',
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
    '/kelly-calculator': 'Kelly Criterion Calculator',
    '/parlay-calculator': 'Parlay Odds Calculator',
    '/system-bet-calculator': 'System Bet Calculator',
    '/hedge-bet-calculator': 'Hedge & Cash-Out Calculator',
    '/dutching-calculator': 'Dutching Calculator',
    '/roi-yield-calculator': 'ROI & Yield Calculator',
    '/margin-calculator': 'Bookmaker Margin Calculator',
    '/arbitrage-calculator': 'Arbitrage Calculator',
    '/odds-converter': 'Odds Converter',
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
  const cleanBase = (baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: (crumbs || []).map((crumb, index) => {
      const rawItem = crumb?.item || crumb?.href || '/';
      const safeItem = typeof rawItem === 'string' && rawItem.trim().length > 0 ? rawItem.trim() : '/';
      const safeName = crumb?.name || crumb?.label || 'PredictPro';
      const fullUrl = safeItem.startsWith('http')
        ? safeItem
        : `${cleanBase}${safeItem.startsWith('/') ? safeItem : `/${safeItem}`}`;

      return {
        '@type': 'ListItem',
        position: index + 1,
        name: safeName,
        item: fullUrl,
      };
    }),
  };
}
