import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Play, ExternalLink, RefreshCw, Film, Tv } from 'lucide-react';

interface Highlight {
  id: string; title: string; url: string; thumbnail?: string;
  date: string; competition: string; homeTeam: string; awayTeam: string;
}

export default function Highlights() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('fetch-highlights');
      if (data?.highlights) setHighlights(data.highlights);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Match Highlights | PredictPro" description="Latest football match highlights and video clips from top leagues worldwide." />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Film className="h-8 w-8 text-primary" />Match Highlights</h1>
            <p className="text-muted-foreground mt-1">Latest goals and match highlights from top leagues.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetch_} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({length: 6}).map((_, i) => (
              <Card key={i}><CardContent className="p-0">
                <Skeleton className="h-44 rounded-t-lg w-full" />
                <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
              </CardContent></Card>
            ))}
          </div>
        ) : highlights.length === 0 ? (
          <div className="text-center py-20">
            <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No highlights available right now. Check back after matches finish.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map(h => (
              <a key={h.id} href={h.url} target="_blank" rel="noopener noreferrer" className="group block">
                <Card className="overflow-hidden hover:border-primary/40 transition-all hover:shadow-lg">
                  <div className="relative bg-muted h-44 overflow-hidden rounded-t-lg">
                    {h.thumbnail ? (
                      <img src={h.thumbnail} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-accent/10">
                        <Film className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="h-6 w-6 text-primary ml-1" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-black/70 text-white text-xs">{h.competition}</Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{h.title}</p>
                    {(h.homeTeam || h.awayTeam) && (
                      <p className="text-xs text-muted-foreground mt-1">{h.homeTeam} vs {h.awayTeam}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString('en-KE', {day:'numeric',month:'short'})}</span>
                      <span className="text-xs text-primary flex items-center gap-1">Watch <ExternalLink className="h-3 w-3" /></span>
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
