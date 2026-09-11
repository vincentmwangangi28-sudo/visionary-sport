import { callEdgeFn } from '@/lib/callEdgeFunction';

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
    const feeds = [
      { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news', league: 'Premier League' },
      { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/news', league: 'Champions League' },
      { url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/news', league: 'La Liga' },
    ];

    const articles: SportsArticle[] = [];

    const tasks = feeds.map(async ({ url, league }) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        const items = json.articles || [];
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
            pubDate: published,
            imageUrl: image,
            category,
            bettingImpact,
            isGeminiCurated: false,
          });
        }
      } catch {
        // Ignore network hiccups on individual feed
      }
    });

    await Promise.allSettled(tasks);
    return articles;
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
   * Automated download and fetch from backend edge function with fast caching and direct live fallback
   */
  public async fetchAndCacheNews(forceRefresh = false): Promise<SportsArticle[]> {
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    this.inFlightPromise = (async () => {
      // 1. Try backend edge function if not in cooldown
      if (Date.now() > this.edgeUnavailableUntil) {
        try {
          const urlParam = forceRefresh ? { refresh: 'true' } : undefined;
          const res: NewsResponseData = await callEdgeFn('fetch-sports-news', urlParam, undefined, 3500);

          if (res?.success && Array.isArray(res.articles) && res.articles.length > 0) {
            this.saveToCache(res.articles);
            this.notifyListeners(res.articles);
            return res.articles;
          }
        } catch {
          // Set 15-minute cooldown to prevent repetitive aborted calls
          this.edgeUnavailableUntil = Date.now() + 15 * 60 * 1000;
        }
      }

      // 2. Direct high-speed download fallback via open ESPN endpoints
      try {
        const liveArticles = await this.fetchDirectESPNNews();
        if (liveArticles.length > 0) {
          const existing = this.getCachedArticles();
          // Keep Gemini curated analysis articles at the front
          const geminiPicks = existing.filter((a) => a.isGeminiCurated);
          const combined = [...geminiPicks, ...liveArticles];

          // Deduplicate by title
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

    // Initial background revalidation
    this.fetchAndCacheNews(false).catch(() => {});

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
