import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  region: string;
  imageUrl?: string;
  category?: string;
  bettingImpact?: string;
  isGeminiCurated?: boolean;
}

interface BackendCache {
  articles: ArticleItem[];
  cachedAt: number;
}

// Global In-Memory Edge Cache for instant response (<10ms)
let memoryCache: BackendCache | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const RSS_SOURCES = [
  { name: 'BBC Sport',      url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',      region: 'global',   category: 'Matchday' },
  { name: 'Sky Sports',     url: 'https://www.skysports.com/rss/12040',                   region: 'global',   category: 'Transfers' },
  { name: 'ESPN FC',        url: 'https://www.espn.com/espn/rss/soccer/news',             region: 'americas', category: 'Matchday' },
  { name: 'AS USA',         url: 'https://en.as.com/rss/latest_news.xml',                 region: 'global',   category: 'Tactical Wire' },
  { name: 'L\'Équipe',      url: 'https://www.lequipe.fr/rss/actu_rss_Football.xml',      region: 'europe',   category: 'Transfers' },
  { name: 'Marca',          url: 'https://www.marca.com/rss/futbol.xml',                  region: 'europe',   category: 'Tactical Wire' },
  { name: 'Kick Off SA',    url: 'https://www.kickoff.com/rss',                           region: 'africa',   category: 'Matchday' },
];

const ESPN_JSON_ENDPOINTS = [
  'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news',
  'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/news',
  'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/news',
];

function parseRSS(xml: string, sourceName: string, region: string, category: string): ArticleItem[] {
  const items: ArticleItem[] = [];
  const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const m of matches) {
    const i = m[1];
    const title = (i.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] || i.match(/<title>(.*?)<\/title>/)?.[1] || '').replace(/<[^>]+>/g,'').trim();
    const link  = (i.match(/<link>(.*?)<\/link>/)?.[1] || i.match(/<guid>(https?:\/\/[^<]+)<\/guid>/)?.[1] || '').trim();
    const pubDate = i.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
    const imageUrl = i.match(/url="(https?:\/\/[^"]*\.(?:jpg|jpeg|png|webp))/)?.[1] ||
                     i.match(/<media:thumbnail[^>]+url="(https?:\/\/[^"]+)"/)?.[1] ||
                     i.match(/<enclosure[^>]+url="(https?:\/\/[^"]+)"/)?.[1];
    const desc = (i.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] || i.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '').replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,' ').trim().slice(0, 180);
    if (title && link) {
      items.push({
        title,
        description: desc,
        link,
        pubDate,
        source: sourceName,
        region,
        imageUrl,
        category,
        isGeminiCurated: false,
      });
    }
    if (items.length >= 6) break;
  }
  return items;
}

/**
 * Downloads and unifies news from ESPN JSON and RSS feeds
 */
async function downloadNewsFromSources(): Promise<ArticleItem[]> {
  const articles: ArticleItem[] = [];

  // 1. Download ESPN structured API
  const espnFetches = ESPN_JSON_ENDPOINTS.map(async (url) => {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'PredictPro/2.0 Bot (+https://predictpro.guru)' },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const list: ArticleItem[] = [];
      if (Array.isArray(data?.articles)) {
        for (const item of data.articles.slice(0, 6)) {
          if (!item.headline) continue;
          list.push({
            title: item.headline,
            description: item.description || '',
            link: item.links?.web?.href || 'https://www.espn.com/soccer',
            pubDate: item.published || new Date().toISOString(),
            source: 'ESPN FC',
            region: 'Global',
            imageUrl: item.images?.[0]?.url,
            category: item.headline.toLowerCase().includes('transfer') ? 'Transfers' : 'Matchday',
            isGeminiCurated: false,
          });
        }
      }
      return list;
    } catch {
      return [];
    }
  });

  // 2. Download RSS feeds
  const rssFetches = RSS_SOURCES.map(async (s) => {
    try {
      const res = await fetch(s.url, {
        headers: { 'User-Agent': 'PredictPro/2.0 Bot (+https://predictpro.guru)' },
        signal: AbortSignal.timeout(4500),
      });
      if (!res.ok) return [];
      return parseRSS(await res.text(), s.name, s.region, s.category);
    } catch {
      return [];
    }
  });

  const allResults = await Promise.allSettled([...espnFetches, ...rssFetches]);
  for (const r of allResults) {
    if (r.status === 'fulfilled') {
      articles.push(...r.value);
    }
  }

  // Deduplicate by headline normalized key
  const seen = new Set<string>();
  const deduped: ArticleItem[] = [];
  for (const a of articles) {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 32);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(a);
    }
  }

  deduped.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  return deduped;
}

/**
 * Tasks Gemini to synthesize breaking tactical sports news & betting impacts
 */
async function generateGeminiTacticalNews(headlines: string[]): Promise<ArticleItem[]> {
  const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_KEY) {
    return [
      {
        title: 'Tactical Overhauls & Transition Vulnerabilities in Major European Leagues',
        description: 'High defensive blocks and midfield pressing variations are creating elevated second-half goal frequencies across weekend fixtures.',
        category: 'Tactical Wire',
        bettingImpact: 'Higher statistical value on 2nd-half Over 1.5 Goals in matches with fast transitional teams.',
        source: 'Gemini AI Tactical Wire',
        region: 'Europe',
        link: 'https://predictpro.guru/news',
        pubDate: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
        isGeminiCurated: true,
      },
      {
        title: 'Key Absences & Squad Rotations Impacting Weekend Asian Handicap Lines',
        description: 'Tight schedule congestion is forcing managerial rotations among Champions League participants.',
        category: 'Injury Alert',
        bettingImpact: 'Underdog +1.5 Asian Handicap trading above fair mathematical value against rotated favorites.',
        source: 'Gemini AI Tactical Wire',
        region: 'Global',
        link: 'https://predictpro.guru/news',
        pubDate: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&auto=format&fit=crop&q=80',
        isGeminiCurated: true,
      }
    ];
  }

  try {
    const prompt = `Synthesize 3 breaking tactical football news items and betting impacts for today.
Top recent headlines: ${JSON.stringify(headlines.slice(0, 6))}

Respond ONLY with valid JSON array:
[
  {
    "title": "Clear tactical headline",
    "description": "2 sentences describing tactical or squad context",
    "category": "Tactical Wire",
    "bettingImpact": "Specific odds or market impact analysis",
    "source": "Gemini AI Tactical Wire",
    "region": "Europe",
    "link": "https://predictpro.guru/news",
    "pubDate": "${new Date().toISOString()}",
    "imageUrl": "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
    "isGeminiCurated": true
  }
]`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            ...item,
            isGeminiCurated: true,
            pubDate: item.pubDate || new Date().toISOString(),
            link: item.link || 'https://predictpro.guru/news',
          }));
        }
      }
    }
  } catch (err) {
    console.warn('Gemini news synthesis warning:', err);
  }

  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get('refresh') === 'true';
  const region = url.searchParams.get('region') || 'all';

  // 1. FAST SPEED PATH: Serve from In-Memory Edge Cache if valid
  if (!forceRefresh && memoryCache && (Date.now() - memoryCache.cachedAt < CACHE_TTL_MS)) {
    let filtered = memoryCache.articles;
    if (region !== 'all') {
      filtered = filtered.filter(a => a.region.toLowerCase() === region.toLowerCase() || a.region.toLowerCase() === 'global');
    }

    return new Response(
      JSON.stringify({
        success: true,
        articles: filtered,
        count: filtered.length,
        cached: true,
        cachedAt: new Date(memoryCache.cachedAt).toISOString(),
        executionTimeMs: Date.now() - startTime,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=1800',
        },
      }
    );
  }

  // 2. AUTOMATION PATH: Download fresh news in backend & synthesize with Gemini
  try {
    const downloadedArticles = await downloadNewsFromSources();
    const headlines = downloadedArticles.slice(0, 8).map(a => a.title);

    // Call Gemini for high-value tactical wire items
    const geminiItems = await generateGeminiTacticalNews(headlines);

    // Combine: Gemini AI Wire items first, followed by top live downloaded news
    const unifiedArticles = [...geminiItems, ...downloadedArticles];

    // Save to memory cache
    memoryCache = {
      articles: unifiedArticles,
      cachedAt: Date.now(),
    };

    let responseArticles = unifiedArticles;
    if (region !== 'all') {
      responseArticles = responseArticles.filter(
        a => a.region.toLowerCase() === region.toLowerCase() || a.region.toLowerCase() === 'global'
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        articles: responseArticles,
        count: responseArticles.length,
        cached: false,
        cachedAt: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=900, stale-while-revalidate=1800',
        },
      }
    );
  } catch (err) {
    console.error('Error downloading and caching news:', err);

    // If cache exists even if expired, fallback to it
    if (memoryCache?.articles?.length) {
      return new Response(
        JSON.stringify({
          success: true,
          articles: memoryCache.articles,
          count: memoryCache.articles.length,
          cached: true,
          stale: true,
          executionTimeMs: Date.now() - startTime,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: String(err),
        articles: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
