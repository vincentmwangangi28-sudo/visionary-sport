import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Clock, Newspaper, RefreshCw } from 'lucide-react';
import { AdBannerHorizontal } from '@/components/AdBanner';

interface Article { title: string; description: string; link: string; pubDate: string; source: string; region: string; imageUrl?: string; }

const SOURCE_COLORS: Record<string, string> = {
  'BBC Sport': 'bg-red-600', 'Sky Sports': 'bg-sky-600', 'ESPN FC': 'bg-orange-500',
  'Goal.com': 'bg-blue-600', 'PredictPro': 'bg-purple-600', 'LiveScore': 'bg-green-600',
  'Kick Off SA': 'bg-yellow-600', 'NewsNow': 'bg-indigo-600',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function News() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const fetchNews = async () => {
    setLoading(true); setError('');
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('fetch-sports-news');
      if (fnErr) throw fnErr;
      if (data?.articles?.length > 0) {
        setArticles(data.articles);
      } else {
        setError('No articles returned');
      }
    } catch (e: unknown) {
      console.error('News error:', e);
      setError(e instanceof Error ? e.message : 'Failed to load news');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNews(); }, []);

  const sources = ['all', ...Array.from(new Set(articles.map(a => a.source)))].slice(0, 8);
  const filtered = filter === 'all' ? articles : articles.filter(a => a.source === filter);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Football News Today | Transfer News & Match Previews | PredictPro"
           description="Latest football news from BBC Sport, Sky Sports, ESPN, Goal.com and more. Transfer news, match previews, injury updates."
           canonical="/news" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-3"><Newspaper className="h-8 w-8 text-primary"/>Football News</h1>
          <Button variant="outline" size="sm" onClick={fetchNews} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>
          </Button>
        </div>

        {/* Source filter */}
        <div className="flex gap-2 flex-wrap mb-5">
          {sources.map(s => (
            <Button key={s} size="sm" variant={filter === s ? 'default' : 'outline'}
              onClick={() => setFilter(s)} className="capitalize text-xs h-7">
              {s === 'all' ? 'All Sources' : s}
            </Button>
          ))}
        </div>

        <AdBannerHorizontal className="mb-6" />

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({length: 9}).map((_,i) => (
              <Card key={i}><CardContent className="p-4 space-y-2">
                <Skeleton className="h-36 w-full rounded" />
                <Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-full" />
              </CardContent></Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchNews} className="mt-4">Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
            <p className="text-muted-foreground">No articles for this source.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a, i) => (
              <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="group">
                <Card className="h-full hover:border-primary/40 transition-all hover:shadow-md">
                  {a.imageUrl && (
                    <div className="h-36 overflow-hidden rounded-t-lg bg-muted">
                      <img src={a.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).parentElement!.style.display='none'; }} />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${SOURCE_COLORS[a.source] ?? 'bg-primary'} text-white text-xs`}>{a.source}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3"/>{timeAgo(a.pubDate)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug line-clamp-3 group-hover:text-primary transition-colors mb-1">{a.title}</h3>
                    {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary">Read more <ExternalLink className="h-3 w-3"/></div>
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
