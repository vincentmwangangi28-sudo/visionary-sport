import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdBannerHorizontal } from '@/components/AdBanner';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper, Clock, ExternalLink, RefreshCw, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Article {
  title: string; description: string; link: string;
  pubDate: string; source: string; region: string; imageUrl?: string | null;
}

const REGIONS = [
  { id: 'all', label: '🌍 All' },
  { id: 'global', label: '⚽ Global' },
  { id: 'europe', label: '🇪🇺 Europe' },
  { id: 'africa', label: '🌍 Africa' },
  { id: 'americas', label: '🌎 Americas' },
];

const SOURCE_COLORS: Record<string, string> = {
  'BBC Sport': 'bg-red-600', 'Sky Sports': 'bg-sky-600',
  'ESPN FC': 'bg-orange-600', 'Goal.com': 'bg-blue-600',
  'PredictPro': 'bg-purple-600', 'Kick Off SA': 'bg-green-700',
  'Marca': 'bg-yellow-600', "L'Équipe": 'bg-blue-800',
};

export default function News() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('fetch-sports-news', {
        body: { region },
      });
      if (data?.articles?.length > 0) {
        setArticles(data.articles);
        setLastUpdated(new Date());
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNews(); }, [region]);

  const filtered = region === 'all' ? articles : articles.filter(a => a.region === region || a.region === 'global');

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Football News Today | Transfer News & Match Previews | PredictPro"
           description="Latest football news from BBC Sport, Sky Sports, ESPN and more. Transfer news, match previews, injury updates and analysis."
           canonical="/news"
           keywords="football news today, transfer news, Premier League news, Champions League news, KPL news, AFCON news, football match previews" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Newspaper className="h-8 w-8 text-primary"/>Football News</h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3"/>Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchNews} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>Refresh
          </Button>
        </div>

        {/* Region filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {REGIONS.map(r => (
            <Button key={r.id} size="sm" variant={region===r.id?'default':'outline'}
              onClick={() => setRegion(r.id)}>
              {r.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({length:9}).map((_,i) => (
              <Card key={i}><CardContent className="p-4 space-y-2">
                <Skeleton className="h-40 w-full rounded-md"/>
                <Skeleton className="h-4 w-3/4"/>
                <Skeleton className="h-3 w-full"/>
              </CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
            <p className="text-muted-foreground font-medium">Loading latest news...</p>
            <Button className="mt-4" onClick={fetchNews}>Try Again</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a, i) => (
              <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="group block">
                <Card className="h-full hover:border-primary/40 transition-all hover:shadow-lg">
                  {a.imageUrl ? (
                    <div className="h-40 bg-muted rounded-t-lg overflow-hidden">
                      <img src={a.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"
                        onError={e => { (e.currentTarget as HTMLImageElement).parentElement!.style.display='none'; }}/>
                    </div>
                  ) : (
                    <div className="h-40 rounded-t-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <Newspaper className="h-10 w-10 text-primary/30"/>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${SOURCE_COLORS[a.source]||'bg-primary'} text-white text-xs`}>{a.source}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(a.pubDate), { addSuffix: true })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug line-clamp-3 group-hover:text-primary transition-colors mb-2">{a.title}</h3>
                    {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                    <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                      Read more <ExternalLink className="h-3 w-3"/>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </main>
      <AdBannerHorizontal className="mb-4" />
      <Footer />
    </div>
  );
}
