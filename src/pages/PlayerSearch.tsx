import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, TrendingUp, Star } from 'lucide-react';

interface Player { id: number; name: string; nationality?: string; position?: string; age?: number; team?: string; league?: string; photo?: string; rating?: number; }

const POPULAR = ['Erling Haaland','Kylian Mbappé','Vinicius Jr','Mohamed Salah','Bukayo Saka','Lamine Yamal','Jude Bellingham','Rodri'];

export default function PlayerSearch() {
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (q: string) => {
    if (!q.trim()) return;
    setQuery(q); setLoading(true); setSearched(true);
    try {
      const { data } = await supabase.functions.invoke('search-players', { body: { query: q } });
      setPlayers(data?.players ?? []);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Football Player Search | Stats & Info | PredictPro" description="Search 500,000+ football players worldwide. View position, nationality, team and stats for any player in any league." keywords="football player search, player stats, footballer database, player profile football" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2"><Search className="h-8 w-8 text-primary" />Player Search</h1>
          <p className="text-muted-foreground">Search 500,000+ players from all leagues worldwide.</p>
        </div>
        <div className="flex gap-2 mb-6">
          <Input placeholder="Search player name..." value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search(query)} className="text-base" />
          <Button onClick={() => search(query)} disabled={loading} className="px-6"><Search className="h-4 w-4" /></Button>
        </div>
        {!searched && (
          <div>
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" />Popular searches:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map(p => <button key={p} onClick={() => search(p)} className="px-3 py-1.5 bg-muted hover:bg-muted/70 rounded-full text-sm border transition-colors">{p}</button>)}
            </div>
          </div>
        )}
        {loading && <div className="grid gap-3 sm:grid-cols-2">{Array.from({length:6}).map((_,i) => <Card key={i}><CardContent className="p-4 flex gap-3"><Skeleton className="w-14 h-14 rounded-full flex-shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></CardContent></Card>)}</div>}
        {searched && !loading && players.length === 0 && <div className="text-center py-16"><User className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="font-semibold">No players found for "{query}"</p><p className="text-sm text-muted-foreground mt-1">Try a different spelling or full name.</p></div>}
        {players.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {players.map(p => (
              <Card key={p.id} className="hover:border-primary/30 transition-all">
                <CardContent className="p-4 flex gap-3 items-center">
                  {p.photo ? <img src={p.photo} alt={p.name} className="w-14 h-14 rounded-full object-cover bg-muted flex-shrink-0" onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} /> : <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><User className="h-7 w-7 text-primary" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{p.name}</p>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {p.position && <Badge variant="secondary" className="text-xs">{p.position}</Badge>}
                      {p.nationality && <Badge variant="outline" className="text-xs">{p.nationality}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                      {p.team && <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{p.team}</span>}
                      {p.age && <span>Age: {p.age}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
