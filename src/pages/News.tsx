import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Clock, Newspaper, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface NewsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category: string;
  imageUrl?: string;
}

const sourceColors: Record<string, string> = {
  'BBC Sport': 'bg-red-500',
  'Goal.com': 'bg-blue-600',
  'ESPN FC': 'bg-orange-500',
  'Sky Sports': 'bg-sky-500',
};

export default function News() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('fetch-sports-news', { body: { category: filter } });
      if (data?.articles) { setArticles(data.articles); setLastUpdated(new Date()); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNews(); }, [filter]);

  const sources = ['all', ...Array.from(new Set(articles.map(a => a.source)))];

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Football News Today | Transfer News & Match Previews | PredictPro" description="Latest football news from BBC Sport, Sky Sports, ESPN, Goal.com and more. Transfer news, match previews, injury updates and analysis." keywords="football news today, transfer news, Premier League news, Champions League news, football match previews, injury news football" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Newspaper className="h-8 w-8 text-primary" />Football News</h1>
            {lastUpdated && <p className="text-sm text-muted-foreground mt-1">Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={fetchNews} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>

        {/* Source filters */}
        <div className="flex gap-2 flex-wrap mb-6">
          {sources.map(s => (
            <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)} className="capitalize">
              {s === 'all' ? 'All Sources' : s}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4 space-y-2">
                <Skeleton className="h-40 w-full rounded-md" />
                <Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-1/2" />
              </CardContent></Card>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No news articles available. Try refreshing.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, i) => (
              <a key={i} href={article.link} target="_blank" rel="noopener noreferrer" className="group">
                <Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg">
                  {article.imageUrl && (
                    <div className="relative overflow-hidden rounded-t-lg h-40 bg-muted">
                      <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${sourceColors[article.source] ?? 'bg-primary'} text-white text-xs`}>{article.source}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-3">{article.title}</h3>
                    {article.description && <p className="text-xs text-muted-foreground line-clamp-2">{article.description}</p>}
                    <div className="flex items-center gap-1 mt-3 text-xs text-primary">Read more <ExternalLink className="h-3 w-3" /></div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}

        {/* Trending topics */}
        {!loading && articles.length > 0 && (
          <div className="mt-10 p-6 rounded-xl bg-muted/50 border">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Trending Topics</h2>
            <div className="flex flex-wrap gap-2">
              {['Transfer News', 'Champions League', 'Premier League', 'La Liga', 'KPL', 'AFCON', 'Injuries', 'Match Preview', 'Bundesliga', 'Serie A'].map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
