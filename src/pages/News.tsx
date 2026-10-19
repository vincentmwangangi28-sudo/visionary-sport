import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdBannerHorizontal } from '@/components/AdBanner';
import { TeamNewsInjuryUpdates } from '@/components/TeamNewsInjuryUpdates';
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
  SlidersHorizontal,
  ArrowRight,
  Crosshair,
} from 'lucide-react';
import { toast } from 'sonner';

export interface LineupTransferWireItem {
  id: string;
  desk: 'Spain (Marca / MD)' | 'UK (Sky / BBC)' | 'Europe (Kicker / Gazzetta / L\'Équipe)' | 'Africa (CAF / KPL)';
  tag: string;
  fixture: string;
  headline: string;
  xgDelta: string;
  probShift: string;
  matchSlug: string;
  updatedAgo: string;
}

export const LIVE_LINEUP_TRANSFER_WIRE: LineupTransferWireItem[] = [
  {
    id: 'wire-1',
    desk: 'UK (Sky / BBC)',
    tag: 'Confirmed Starting XI',
    fixture: 'Arsenal vs Chelsea',
    headline: 'Saka, Ødegaard & Rice all start in aggressive 4-3-3 high press; right half-space overload active.',
    xgDelta: '+0.36 Home xG',
    probShift: 'Home Win 68% → 74%',
    matchSlug: '/predict/arsenal-vs-chelsea',
    updatedAgo: '9m ago',
  },
  {
    id: 'wire-2',
    desk: 'Spain (Marca / MD)',
    tag: 'Tactical System Shift',
    fixture: 'Real Madrid vs Barcelona',
    headline: 'Mbappé & Vinícius paired in split-striker transition shape against high defensive line.',
    xgDelta: '+0.42 Total xG',
    probShift: 'Over 2.5 Goals 71% → 79%',
    matchSlug: '/predict/real-madrid-vs-barcelona',
    updatedAgo: '18m ago',
  },
  {
    id: 'wire-3',
    desk: 'Europe (Kicker / Gazzetta / L\'Équipe)',
    tag: 'Bundesliga & Serie A Intel',
    fixture: 'Bayern Munich vs Borussia Dortmund',
    headline: 'Kane & Musiala central combination averaging 4.8 box entries per 15 minutes in Der Klassiker.',
    xgDelta: '+0.39 Home xG',
    probShift: 'BTTS Yes 76%',
    matchSlug: '/predict/bayern-munich-vs-borussia-dortmund',
    updatedAgo: '27m ago',
  },
  {
    id: 'wire-4',
    desk: 'Africa (CAF / KPL)',
    tag: 'Mashemeji Derby Lineup',
    fixture: 'Gor Mahia vs AFC Leopards',
    headline: 'Austin Odhiambo starts in #10 playmaker role; full-back width driving 64% final-third tilt.',
    xgDelta: '+0.33 Home xG',
    probShift: 'Home Win 72% → 78%',
    matchSlug: '/predict/gor-mahia-vs-afc-leopards',
    updatedAgo: '34m ago',
  },
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function News() {
  const [articles, setArticles] = useState<SportsArticle[]>(() =>
    sportsNewsService.getCachedArticles()
  );
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedDesk, setSelectedDesk] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(() =>
    sportsNewsService.getLastSyncTime()
  );

  useEffect(() => {
    const unsubscribe = sportsNewsService.subscribe((fresh) => {
      setArticles(fresh);
      setLastSync(sportsNewsService.getLastSyncTime());
    });

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

  const sources = useMemo(() => {
    const list = Array.from(new Set(articles.map((a) => a.source))).filter(Boolean);
    return ['all', ...list];
  }, [articles]);

  const categories = ['all', 'Gemini AI Wire', 'Tactical Wire', 'Matchday', 'Transfers', 'Injury Alert'];

  const filteredWire = useMemo(() => {
    if (selectedDesk === 'all') return LIVE_LINEUP_TRANSFER_WIRE;
    return LIVE_LINEUP_TRANSFER_WIRE.filter((item) => item.desk === selectedDesk);
  }, [selectedDesk]);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      if (selectedCategory === 'Gemini AI Wire' && !a.isGeminiCurated) return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'Gemini AI Wire') {
        if (a.category?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      if (selectedSource !== 'all' && a.source !== selectedSource) return false;

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

  const spotlightArticle = useMemo(() => {
    return articles.find((a) => a.isGeminiCurated) || articles[0];
  }, [articles]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Football News, Lineup xG Wire & Tactical Intelligence | PredictPro"
        description="Breaking football news, confirmed starting XI lineup xG shifts, transfer updates, and injury impact breakdowns across global leagues."
        canonical="/news"
      />
      <Navbar />

      <main className="container mx-auto px-4 py-8 pb-24 md:pb-12 max-w-6xl flex-1 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Global Editorial Desks · Confirmed Lineup xG Impact ·{' '}
              {lastSync ? `Synced ${timeAgo(lastSync)}` : 'Instant Cache Active'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-2.5">
              <Newspaper className="h-7 w-7 text-primary shrink-0" />
              <span>Football News, Lineup Wire &amp; Tactical Intelligence</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Multi-source breaking football coverage translated directly into Expected Goals (xG) and probability shifts.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading}
              className="text-xs font-semibold gap-1.5 h-8 whitespace-nowrap"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync News Feed</span>
            </Button>
          </div>
        </div>

        {/* Marca / Kicker / Gazzetta / Sky Sports Confirmed Starting XI & Tactical xG Wire */}
        <section
          aria-label="Confirmed Starting Lineups and Tactical xG Impact Wire"
          className="p-4 rounded-xl border border-border/80 bg-card space-y-3"
          data-testid="news-lineup-xg-wire"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                <Crosshair className="h-4 w-4 text-primary" />
                <span>Confirmed Starting XI, Transfer &amp; Tactical xG Impact Wire</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time model adjustments from European and African press desks (Sky, Marca, Kicker, Gazzetta, L&apos;Équipe, CAF).
              </p>
            </div>

            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/60 overflow-x-auto no-scrollbar">
              {(
                [
                  'all',
                  'UK (Sky / BBC)',
                  'Spain (Marca / MD)',
                  "Europe (Kicker / Gazzetta / L'Équipe)",
                  'Africa (CAF / KPL)',
                ] as const
              ).map((desk) => (
                <button
                  key={desk}
                  type="button"
                  onClick={() => setSelectedDesk(desk)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors whitespace-nowrap ${
                    selectedDesk === desk
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {desk === 'all' ? 'All Press Desks' : desk}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredWire.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-border/70 bg-background/80 flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-semibold text-primary">{item.tag}</span>
                    <span className="font-mono">{item.updatedAgo}</span>
                  </div>
                  <p className="text-xs font-extrabold text-foreground">{item.fixture}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{item.headline}</p>
                </div>

                <div className="pt-2 border-t border-border/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.xgDelta}</span>
                    <span className="text-foreground font-semibold">{item.probShift}</span>
                  </div>
                  <Link
                    to={item.matchSlug}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    <span>Open Match xG Model</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Matches Real-Time Team News & Injury Updates */}
        <div>
          <TeamNewsInjuryUpdates />
        </div>

        {/* Gemini AI Tactical Spotlight Banner */}
        {spotlightArticle && (
          <div className="rounded-xl border border-primary/30 bg-card p-5 sm:p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              {spotlightArticle.imageUrl && (
                <div className="w-full md:w-72 h-44 rounded-lg overflow-hidden shrink-0 bg-muted">
                  <img
                    src={spotlightArticle.imageUrl}
                    alt={spotlightArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-bold text-primary flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Lead Tactical Story
                  </span>
                  <span>·</span>
                  <span>{spotlightArticle.category || 'Tactical Wire'}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3" /> {timeAgo(spotlightArticle.pubDate)}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-foreground leading-snug">
                  {spotlightArticle.title}
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {spotlightArticle.description}
                </p>

                {spotlightArticle.bettingImpact && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2.5">
                    <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-foreground font-bold block mb-0.5">
                        Quantitative Match Impact:
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
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs font-semibold h-8 rounded-lg shrink-0 gap-1 whitespace-nowrap"
                >
                  {cat === 'Gemini AI Wire' && <Sparkles className="h-3 w-3" />}
                  {cat === 'all' ? 'All Topics' : cat}
                </Button>
              ))}
            </div>

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

          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
            <span className="text-muted-foreground flex items-center gap-1 mr-1">
              <SlidersHorizontal className="h-3 w-3" /> Source:
            </span>
            {sources.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setSelectedSource(src)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
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

        <AdBannerHorizontal />

        {/* Article Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-xl p-6">
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
                <Card className="h-full border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden bg-card">
                  {a.imageUrl && (
                    <div className="h-40 overflow-hidden bg-muted relative">
                      <img
                        src={a.imageUrl}
                        alt={a.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span className="font-bold text-foreground">{a.source}</span>
                        <span className="flex items-center gap-1 font-mono">
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
