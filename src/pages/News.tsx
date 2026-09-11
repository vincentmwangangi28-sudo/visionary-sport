import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NewsGridSkeleton } from '@/components/PredictionCardSkeleton';
import { AdBannerHorizontal } from '@/components/AdBanner';
import {
  sportsNewsService,
  SportsArticle,
} from '@/services/sportsNewsService';
import {
  ExternalLink,
  Clock,
  Newspaper,
  RefreshCw,
  Sparkles,
  Search,
  Zap,
  TrendingUp,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

const SOURCE_COLORS: Record<string, string> = {
  'Gemini AI Tactical Wire': 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
  'BBC Sport': 'bg-red-600 text-white',
  'Sky Sports': 'bg-sky-600 text-white',
  'ESPN FC': 'bg-orange-500 text-white',
  'Goal.com': 'bg-blue-600 text-white',
  'Marca': 'bg-amber-600 text-white',
  'L\'Équipe': 'bg-emerald-600 text-white',
  'Kick Off SA': 'bg-yellow-600 text-white',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function News() {
  // 1. FAST SPEED: Load synchronously from local backend cache immediately (0ms wait)
  const [articles, setArticles] = useState<SportsArticle[]>(() =>
    sportsNewsService.getCachedArticles()
  );
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(() =>
    sportsNewsService.getLastSyncTime()
  );

  // Background automated revalidation
  useEffect(() => {
    // Subscribe to background service updates
    const unsubscribe = sportsNewsService.subscribe((fresh) => {
      setArticles(fresh);
      setLastSync(sportsNewsService.getLastSyncTime());
    });

    // Silently revalidate news in the background on initial load
    sportsNewsService
      .fetchAndCacheNews(false)
      .then((res) => {
        if (res && res.length > 0) {
          setArticles(res);
          setLastSync(sportsNewsService.getLastSyncTime());
        }
      })
      .catch(() => {});

    return () => unsubscribe();
  }, []);

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const fresh = await sportsNewsService.fetchAndCacheNews(true);
      setArticles(fresh);
      setLastSync(sportsNewsService.getLastSyncTime());
      toast.success('News synchronized from backend!');
    } catch {
      toast.error('Could not refresh news. Using cached feed.');
    } finally {
      setLoading(false);
    }
  };

  // Extract sources and categories
  const sources = useMemo(() => {
    const list = Array.from(new Set(articles.map((a) => a.source))).filter(Boolean);
    return ['all', ...list];
  }, [articles]);

  const categories = ['all', 'Gemini AI Wire', 'Tactical Wire', 'Matchday', 'Transfers', 'Injury Alert'];

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      // Category filter
      if (selectedCategory === 'Gemini AI Wire' && !a.isGeminiCurated) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'Gemini AI Wire') {
        if (a.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      // Source filter
      if (selectedSource !== 'all' && a.source !== selectedSource) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchDesc = (a.description || '').toLowerCase().includes(q);
        const matchImpact = (a.bettingImpact || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchImpact) return false;
      }

      return true;
    });
  }, [articles, selectedCategory, selectedSource, searchQuery]);

  // Top spotlight article (Gemini curated or latest)
  const spotlightArticle = useMemo(() => {
    return articles.find((a) => a.isGeminiCurated) || articles[0];
  }, [articles]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Football News & Gemini AI Tactical Wire | Transfer News & Match Previews | PredictPro"
        description="Latest football news and Gemini AI tactical intelligence. Breaking transfer updates, injury alerts, and betting impact breakdowns."
        canonical="/news"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-24 pb-20 md:pb-12 max-w-6xl">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ⚡ Backend Cached (Fast Load)
              </span>
              {lastSync && (
                <span className="text-[11px] text-muted-foreground">
                  Synced {timeAgo(lastSync)}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-2.5">
              <Newspaper className="h-7 w-7 text-primary" />
              Football News & Tactical Wire
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Automated multi-source global football news downloaded and synthesized with Gemini AI tactical betting angles.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading}
              className="text-xs font-semibold gap-1.5 h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Backend
            </Button>
          </div>
        </div>

        {/* Gemini AI Tactical Spotlight Banner */}
        {spotlightArticle && (
          <div className="mb-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.07] via-card to-card p-5 sm:p-6 overflow-hidden relative shadow-sm">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              {spotlightArticle.imageUrl && (
                <div className="w-full md:w-72 h-44 rounded-xl overflow-hidden shrink-0 bg-muted">
                  <img
                    src={spotlightArticle.imageUrl}
                    alt={spotlightArticle.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary text-primary-foreground text-[11px] font-black gap-1 px-2.5 py-0.5">
                    <Sparkles className="h-3.5 w-3.5" /> Gemini AI Spotlight
                  </Badge>
                  <Badge variant="outline" className="text-[11px] font-semibold">
                    {spotlightArticle.category || 'Tactical Wire'}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {timeAgo(spotlightArticle.pubDate)}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-foreground leading-snug">
                  {spotlightArticle.title}
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {spotlightArticle.description}
                </p>

                {spotlightArticle.bettingImpact && (
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 flex items-start gap-2.5">
                    <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-foreground font-bold block mb-0.5">
                        Tactical Betting Impact:
                      </strong>
                      <span className="text-muted-foreground">
                        {spotlightArticle.bettingImpact}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <a
                    href={spotlightArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    Read Full Coverage <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs font-semibold h-8 rounded-lg shrink-0 gap-1"
                >
                  {cat === 'Gemini AI Wire' && <Sparkles className="h-3 w-3 text-primary-foreground" />}
                  {cat === 'all' ? 'All Topics' : cat}
                </Button>
              ))}
            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search teams or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 rounded-lg"
              />
            </div>
          </div>

          {/* Sources Filter */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
            <span className="text-muted-foreground flex items-center gap-1 mr-1">
              <SlidersHorizontal className="h-3 w-3" /> Source:
            </span>
            {sources.map((src) => (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  selectedSource === src
                    ? 'bg-foreground text-background font-bold'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {src === 'all' ? 'All Feeds' : src}
              </button>
            ))}
          </div>
        </div>

        <AdBannerHorizontal className="mb-6" />

        {/* Article Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-2xl p-6">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-60" />
            <h3 className="font-bold text-base text-foreground mb-1">No articles found</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Try adjusting your filter or search query.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSource('all');
                setSearchQuery('');
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((a, i) => (
              <a
                key={i}
                href={a.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col"
              >
                <Card className="h-full border-border/60 hover:border-primary/40 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden bg-card/80">
                  {a.imageUrl && (
                    <div className="h-40 overflow-hidden bg-muted relative">
                      <img
                        src={a.imageUrl}
                        alt={a.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                        }}
                      />
                      {a.isGeminiCurated && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-primary/95 text-primary-foreground text-[10px] font-black gap-1 shadow-sm">
                            <Sparkles className="h-3 w-3" /> Gemini AI
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Badge
                          className={`${
                            SOURCE_COLORS[a.source] || 'bg-primary text-primary-foreground'
                          } text-[10px] font-bold`}
                        >
                          {a.source}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" />
                          {timeAgo(a.pubDate)}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {a.title}
                      </h3>

                      {a.description && (
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {a.description}
                        </p>
                      )}
                    </div>

                    {/* Betting Angle Impact Badge if available */}
                    {a.bettingImpact ? (
                      <div className="p-2 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground flex items-start gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2 font-medium">
                          <strong className="text-foreground font-semibold">Impact: </strong>
                          {a.bettingImpact}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary pt-1">
                        <span>Read coverage</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

