import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StandingRow { position: number; team: string; logo?: string; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; gd: number; points: number; form?: string; }

const LEAGUES = [
  { id: 39, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: 140, name: 'La Liga', flag: '🇪🇸' },
  { id: 135, name: 'Serie A', flag: '🇮🇹' },
  { id: 78, name: 'Bundesliga', flag: '🇩🇪' },
  { id: 61, name: 'Ligue 1', flag: '🇫🇷' },
  { id: 2, name: 'Champions League', flag: '🏆' },
  { id: 1, name: 'World Cup', flag: '🌍' },
];

const FormBit = ({ r }: { r: string }) => (
  <span className={`inline-flex w-5 h-5 rounded-full text-[10px] font-bold items-center justify-center text-white ${r==='W'?'bg-green-500':r==='L'?'bg-red-500':'bg-amber-500'}`}>{r}</span>
);

export default function Standings() {
  const [league, setLeague] = useState(LEAGUES[0]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = async (lg = league) => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('fetch-standings', { body: { leagueId: lg.id } });
      setStandings(data?.standings ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const selectLeague = (lg: typeof LEAGUES[0]) => { setLeague(lg); fetch_(lg); };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="League Standings | PredictPro" description="Live football league standings for Premier League, La Liga, Bundesliga, Serie A and more." />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3"><Trophy className="h-8 w-8 text-primary" />Standings</h1>
          <Button variant="outline" size="sm" onClick={() => fetch_()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading?'animate-spin':''}`} /></Button>
        </div>
        <div className="flex gap-2 flex-wrap mb-6">
          {LEAGUES.map(lg => (
            <Button key={lg.id} size="sm" variant={league.id===lg.id?'default':'outline'} onClick={() => selectLeague(lg)}>
              {lg.flag} {lg.name}
            </Button>
          ))}
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{league.flag} {league.name} — {new Date().getFullYear()} Season</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{Array.from({length:8}).map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : standings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground"><Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>Standings not available yet for this league.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-2 px-3 w-8">#</th>
                      <th className="text-left py-2 px-3">Team</th>
                      <th className="text-center py-2 px-2 hidden sm:table-cell">P</th>
                      <th className="text-center py-2 px-2 hidden sm:table-cell">W</th>
                      <th className="text-center py-2 px-2 hidden sm:table-cell">D</th>
                      <th className="text-center py-2 px-2 hidden sm:table-cell">L</th>
                      <th className="text-center py-2 px-2 hidden md:table-cell">GD</th>
                      <th className="text-center py-2 px-3 font-bold">Pts</th>
                      <th className="text-center py-2 px-2 hidden lg:table-cell">Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, i) => (
                      <tr key={row.team} className={`border-b hover:bg-muted/20 transition-colors ${i < 4 ? 'border-l-2 border-l-blue-500' : i === 4 || i === 5 ? 'border-l-2 border-l-amber-500' : i >= standings.length - 3 ? 'border-l-2 border-l-red-500' : ''}`}>
                        <td className="py-2.5 px-3 text-muted-foreground font-medium">{row.position}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {row.logo && <img src={row.logo} alt="" className="w-5 h-5 object-contain" onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />}
                            <span className="font-medium truncate max-w-[120px] sm:max-w-none">{row.team}</span>
                          </div>
                        </td>
                        <td className="text-center py-2.5 px-2 hidden sm:table-cell text-muted-foreground">{row.played}</td>
                        <td className="text-center py-2.5 px-2 hidden sm:table-cell text-green-600 font-medium">{row.won}</td>
                        <td className="text-center py-2.5 px-2 hidden sm:table-cell text-muted-foreground">{row.drawn}</td>
                        <td className="text-center py-2.5 px-2 hidden sm:table-cell text-red-500">{row.lost}</td>
                        <td className={`text-center py-2.5 px-2 hidden md:table-cell font-medium ${row.gd > 0 ? 'text-green-600' : row.gd < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {row.gd > 0 ? '+' : ''}{row.gd}
                        </td>
                        <td className="text-center py-2.5 px-3 font-black text-primary">{row.points}</td>
                        <td className="py-2.5 px-2 hidden lg:table-cell">
                          <div className="flex gap-0.5 justify-center">{(row.form ?? '').split('').map((r,i) => <FormBit key={i} r={r} />)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex gap-4 px-4 py-3 text-xs text-muted-foreground border-t">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-4 bg-blue-500 rounded-sm inline-block" />Champions League</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-4 bg-amber-500 rounded-sm inline-block" />Europa League</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-4 bg-red-500 rounded-sm inline-block" />Relegation</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
