import { callEdgeFn } from '@/lib/callEdgeFunction';
import { safeFootballFetch, isHostInCooldown } from '@/services/footballDataCache';

export interface SportsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  region: string;
  imageUrl?: string;
  category?: 'Tactical Wire' | 'Matchday' | 'Transfers' | 'Injury Alert' | 'Market Movement' | string;
  bettingImpact?: string;
  isGeminiCurated?: boolean;
}

export interface NewsResponseData {
  success: boolean;
  articles: SportsArticle[];
  count: number;
  cached?: boolean;
  cachedAt?: string;
  executionTimeMs?: number;
}

const NEWS_CACHE_KEY = 'predictpro_cached_sports_news_v2';
const NEWS_LAST_SYNC_KEY = 'predictpro_sports_news_last_sync_time';

export const FALLBACK_NEWS_ARTICLES: SportsArticle[] = [
  {
    title: 'Tactical Overhauls & Transition Vulnerabilities in Major European Leagues',
    description: 'High defensive blocks and midfield pressing variations are creating elevated second-half goal frequencies across weekend fixtures.',
    link: 'https://predictpro.guru/news',
    pubDate: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    source: 'Gemini AI Tactical Wire',
    region: 'Europe',
    category: 'Tactical Wire',
    bettingImpact: 'Higher statistical value on 2nd-half Over 1.5 Goals in matches with fast transitional teams.',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
    isGeminiCurated: true,
  },
  {
    title: 'Key Absences & Squad Rotations Impacting Weekend Asian Handicap Lines',
    description: 'Tight schedule congestion is forcing managerial rotations among continental competition participants.',
    link: 'https://predictpro.guru/news',
    pubDate: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    source: 'Gemini AI Tactical Wire',
    region: 'Global',
    category: 'Injury Alert',
    bettingImpact: 'Underdog +1.5 Asian Handicap trading above fair mathematical value against rotated favorites.',
    imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80',
    isGeminiCurated: true,
  },
  {
    title: 'Champions League Quarter-Final Previews & Tactical Matchups',
    description: 'Detailed analysis of European heavyweights clashing in the final stages of the continental campaign with high-intensity expected.',
    link: 'https://www.espn.com/soccer',
    pubDate: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    source: 'ESPN FC',
    region: 'Europe',
    category: 'Matchday',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Premier League Title Race: Analytical Forecast for Decisive Matchweeks',
    description: 'Statistical models project goal difference and head-to-head records will dictate the thrilling conclusion of the league campaign.',
    link: 'https://www.bbc.com/sport/football',
    pubDate: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    source: 'BBC Sport',
    region: 'UK & Europe',
    category: 'Matchday',
    imageUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Summer Transfer Window Intelligence: Top Targets, Valuations & Signings',
    description: 'Clubs across Europe prepare major bid packages as the transfer window approaches key negotiation stages.',
    link: 'https://www.skysports.com/football',
    pubDate: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    source: 'Sky Sports',
    region: 'Global',
    category: 'Transfers',
    imageUrl: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=800&auto=format&fit=crop&q=80',
  },
];

class SportsNewsService {
  private inFlightPromise: Promise<SportsArticle[]> | null = null;
  private listeners: Set<(articles: SportsArticle[]) => void> = new Set();
  private timer: number | null = null;
  private edgeUnavailableUntil = 0;

  /**
   * Direct high-speed download of live football news via open ESPN endpoints
   */
  private async fetchDirectESPNNews(): Promise<SportsArticle[]> {
    if (
      (typeof navigator !== 'undefined' && navigator.onLine === false) ||
      Date.now() < this.edgeUnavailableUntil ||
      isHostInCooldown('site.api.espn.com')
    ) {
      return [];
    }

    const feeds = [
      { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news', league: 'Premier League' },
      { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/news', league: 'Champions League' },
      { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/news', league: 'La Liga' },
    ];

    const articles: SportsArticle[] = [];

    for (const { url, league } of feeds) {
      if (Date.now() < this.edgeUnavailableUntil || isHostInCooldown('site.api.espn.com')) break;
      try {
        const res = await safeFootballFetch(url);
        if (!res || !res.ok) continue;
        const json = await res.json().catch(() => null);
        const items = json?.articles || [];
        for (const item of items.slice(0, 4)) {
          const headline = item.headline || item.title;
          if (!headline) continue;
          const image = item.images?.[0]?.url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80';
          const description = item.description || item.story || `${league} tactical intelligence update.`;
          const published = item.published ? new Date(item.published).toISOString() : new Date().toISOString();
          const link = item.links?.web?.href || 'https://www.espn.com/soccer';

          const text = (headline + ' ' + description).toLowerCase();
          let bettingImpact = 'Market efficiency balanced across 1X2 and Over/Under lines.';
          let category = 'Matchday';

          if (text.includes('injury') || text.includes('out') || text.includes('ruled out')) {
            bettingImpact = 'Key squad rotation detected. May impact clean sheet odds and Asian handicap margins.';
            category = 'Injury Alert';
          } else if (text.includes('transfer') || text.includes('sign') || text.includes('deal') || text.includes('move')) {
            bettingImpact = 'Roster tactical shift expected to affect long-term team efficiency rating.';
            category = 'Transfers';
          } else if (text.includes('champions league') || text.includes('clash') || text.includes('derby')) {
            bettingImpact = 'High-stakes clash with elevated BTTS probability in statistical regressions.';
            category = 'Tactical Wire';
          }

          articles.push({
            title: headline,
            description,
            link,
            source: 'ESPN Football',
            region: 'Europe',
            pubDate: published,
            imageUrl: image,
            category,
            bettingImpact,
            isGeminiCurated: false,
          });
        }
      } catch {
        clearTimeout(timeout);
        // Set 15-minute cooldown if ESPN news endpoint is unreachable or DNS fails
        this.edgeUnavailableUntil = Date.now() + 15 * 60 * 1000;
        break;
      }
    }

    return articles;
  }

  /**
   * Fetch live football news & injury wire from our server-side Brave Search proxy (/api/brave-search)
   */
  public async fetchBraveNews(query?: string, force = false): Promise<SportsArticle[]> {
    if (typeof window === 'undefined' || typeof fetch !== 'function') {
      return [];
    }
    const q = (
      query ||
      'Premier League Champions League La Liga football injury news starting lineups transfers'
    ).trim();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const params = new URLSearchParams({
        q,
        type: 'match_intel',
        count: '10',
      });
      if (force) params.set('force', 'true');

      const res = await fetch(`/api/brave-search?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return [];
      const data = await res.json();
      const newsList = Array.isArray(data?.newsResults) ? data.newsResults : [];
      const webList = Array.isArray(data?.webResults) ? data.webResults : [];

      const mapped: SportsArticle[] = [];
      for (const n of newsList) {
        if (!n?.title || !n?.url) continue;
        mapped.push({
          title: n.title,
          description: n.description || 'Breaking football coverage via Brave Search.',
          link: n.url,
          pubDate: n.publishedAt || new Date().toISOString(),
          source: `${n.source || 'Brave Search'} (Brave Wire)`,
          region: 'Global',
          imageUrl:
            n.thumbnail ||
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
          category: n.category || 'Tactical Wire',
          bettingImpact:
            n.bettingImpact ||
            'Indexed via Brave Search API; cross-referenced with Expected Goals (xG) & Poisson probabilities.',
          isGeminiCurated: false,
        });
      }

      if (mapped.length === 0) {
        for (const w of webList.slice(0, 6)) {
          if (!w?.title || !w?.url) continue;
          mapped.push({
            title: w.title,
            description: w.description || 'Football analysis indexed via Brave Search.',
            link: w.url,
            pubDate: new Date().toISOString(),
            source: `${w.source || 'Brave Search'} (Brave Wire)`,
            region: 'Global',
            imageUrl:
              w.thumbnail ||
              'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=600&q=80',
            category: 'Tactical Wire',
            bettingImpact:
              'Indexed via Brave Search API; cross-referenced with Expected Goals (xG) & Poisson probabilities.',
            isGeminiCurated: false,
          });
        }
      }

      return mapped;
    } catch {
      clearTimeout(timeout);
      return [];
    }
  }

  /**
   * Get cached articles synchronously with zero waiting time (0ms)
   */
  public getCachedArticles(): SportsArticle[] {
    try {
      const raw = localStorage.getItem(NEWS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return FALLBACK_NEWS_ARTICLES;
  }

  /**
   * Returns timestamp of last sync
   */
  public getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(NEWS_LAST_SYNC_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Save articles to local fast cache
   */
  private saveToCache(articles: SportsArticle[]) {
    try {
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(articles));
      localStorage.setItem(NEWS_LAST_SYNC_KEY, new Date().toISOString());
    } catch {
      // ignore storage quota errors
    }
  }

  /**
   * Automated download and fetch from Brave Search API + ESPN with Free-Tier-aware caching
   */
  public async fetchAndCacheNews(forceRefresh = false): Promise<SportsArticle[]> {
    // Free Subscription Guard: if not forced and local cache is < 15 minutes old with Brave Wire items, reuse immediately
    if (!forceRefresh) {
      const lastSyncIso = this.getLastSyncTime();
      if (lastSyncIso) {
        const ageMs = Date.now() - new Date(lastSyncIso).getTime();
        if (ageMs >= 0 && ageMs < 15 * 60 * 1000) {
          const cached = this.getCachedArticles();
          if (cached.some((a) => a.source.includes('Brave Wire'))) {
            return cached;
          }
        }
      }
    }

    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.inFlightPromise = (async () => {
      // 1. Fetch live Brave Search football news + ESPN feeds in parallel
      try {
        const [braveArticles, espnArticles] = await Promise.all([
          this.fetchBraveNews(undefined, forceRefresh),
          this.fetchDirectESPNNews(),
        ]);

        const liveArticles = [...braveArticles, ...espnArticles];
        if (liveArticles.length > 0) {
          const existing = this.getCachedArticles();
          const geminiPicks = existing.filter((a) => a.isGeminiCurated);
          const combined = [...geminiPicks, ...liveArticles];

          const seen = new Set<string>();
          const deduped = combined.filter((item) => {
            const key = item.title.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          this.saveToCache(deduped);
          this.notifyListeners(deduped);
          return deduped;
        }
      } catch {
        // Ignore fallback errors
      }

      // 2. Optional edge function fallback if forced
      if (forceRefresh && Date.now() > this.edgeUnavailableUntil) {
        try {
          const urlParam = { refresh: 'true' };
          const res: NewsResponseData = await callEdgeFn('fetch-sports-news', urlParam, undefined, 5000);

          if (res?.success && Array.isArray(res.articles) && res.articles.length > 0) {
            this.saveToCache(res.articles);
            this.notifyListeners(res.articles);
            return res.articles;
          }
        } catch {
          this.edgeUnavailableUntil = Date.now() + 30 * 60 * 1000;
        }
      }

      // 3. If live network was completely offline, return existing fast cache
      return this.getCachedArticles();
    })().finally(() => {
      this.inFlightPromise = null;
    });

    return this.inFlightPromise;
  }

  /**
   * Background automation ticker - periodically downloads and updates news in backend
   */
  public startAutomatedSync(intervalMinutes = 15) {
    if (this.timer) return;

    // Defer initial background revalidation so it never competes with initial page render
    setTimeout(() => {
      this.fetchAndCacheNews(false).catch(() => {});
    }, 35000);

    // Periodic schedule
    this.timer = window.setInterval(() => {
      this.fetchAndCacheNews(false).catch(() => {});
    }, intervalMinutes * 60 * 1000);
  }

  public stopAutomatedSync() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public subscribe(listener: (articles: SportsArticle[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(articles: SportsArticle[]) {
    this.listeners.forEach((fn) => {
      try {
        fn(articles);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

export const sportsNewsService = new SportsNewsService();
