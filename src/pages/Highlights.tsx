import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Film, Play, ExternalLink, RefreshCw, Youtube } from 'lucide-react';

interface Highlight {
  id: string; title: string; url: string; thumbnail?: string | null;
  date: string; competition: string; homeTeam: string; awayTeam: string;
}

export default function Highlights() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('fetch-highlights');
      if (data?.highlights?.length > 0) setHighlights(data.highlights);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const LEAGUE_COLORS: Record<string, string> = {
    'Premier League': 'bg-purple-600', 'Champions League': 'bg-blue-700',
    'La Liga': 'bg-red-600', 'Bundesliga': 'bg-red-500',
    'Serie A': 'bg-green-700', 'Ligue 1': 'bg-blue-500',
    'KPL': 'bg-green-600', 'AFCON Qualifier': 'bg-amber-600', 'MLS': 'bg-red-700',
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Football Match Highlights | Watch Goals & Clips | PredictPro"
           description="Latest football match highlights and video clips from Premier League, Champions League, La Liga, KPL and more."
           canonical="/highlights"/>
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Film className="h-8 w-8 text-primary"/>Match Highlights</h1>
            <p className="text-muted-foreground text-sm mt-1">Latest goals and match highlights from top leagues.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`}/>
          </Button>
        </div>

        {/* YouTube search shortcut */}
        <div className="mb-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-3">
          <Youtube className="h-6 w-6 text-red-500 flex-shrink-0"/>
          <div className="flex-1">
            <p className="font-semibold text-sm">Watch Full Match Highlights on YouTube</p>
            <p className="text-xs text-muted-foreground">Click any card below or search directly on YouTube for full match replays.</p>
          </div>
          <a href="https://www.youtube.com/results?search_query=football+highlights+2025" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1.5 border-red-500/30 text-red-600 hover:bg-red-50">
              <ExternalLink className="h-3.5 w-3.5"/>Watch
            </Button>
          </a>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({length:6}).map((_,i) => (
              <Card key={i}><CardContent className="p-0">
                <Skeleton className="h-44 w-full rounded-t-lg"/>
                <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4"/><Skeleton className="h-3 w-1/2"/></div>
              </CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map(h => (
              <a key={h.id} href={h.url} target="_blank" rel="noopener noreferrer" className="group block">
                <Card className="overflow-hidden hover:border-primary/40 transition-all hover:shadow-lg h-full">
                  <div className="relative bg-gradient-to-br from-primary/10 to-accent/20 h-44 flex items-center justify-center overflow-hidden rounded-t-lg">
                    {h.thumbnail ? (
                      <img src={h.thumbnail} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }}/>
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                      <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
                        <Play className="h-6 w-6 text-white ml-1"/>
                      </div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge className={`${LEAGUE_COLORS[h.competition]||'bg-primary'} text-white text-xs`}>{h.competition}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">{h.title}</h3>
                    {h.homeTeam && h.awayTeam && (
                      <p className="text-xs text-muted-foreground">{h.homeTeam} vs {h.awayTeam}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString('en-KE',{day:'numeric',month:'short'})}</span>
                      <span className="text-xs text-primary flex items-center gap-1 font-medium">Watch <ExternalLink className="h-3 w-3"/></span>
                    </div>
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
