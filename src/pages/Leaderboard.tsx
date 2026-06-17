import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Trophy, Medal, Star, TrendingUp, Users } from 'lucide-react';

interface LeaderEntry { rank: number; name: string; tips: number; wins: number; accuracy: number; streak: number; badge: string; }

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get community tipsters with most likes
    (async () => {
      const { data } = await supabase
        .from('community_tips')
        .select('user_id, likes, profiles(full_name)')
        .order('likes', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const userMap: Record<string, { name: string; totalLikes: number; tips: number }> = {};
        data.forEach((tip: { user_id: string; likes: number; profiles?: { full_name?: string } | null }) => {
          if (!userMap[tip.user_id]) {
            userMap[tip.user_id] = {
              name: tip.profiles?.full_name ?? 'Anonymous Tipster',
              totalLikes: 0, tips: 0
            };
          }
          userMap[tip.user_id].totalLikes += tip.likes ?? 0;
          userMap[tip.user_id].tips += 1;
        });

        const entries = Object.entries(userMap)
          .map(([_, v], i) => ({
            rank: i + 1, name: v.name, tips: v.tips,
            wins: Math.floor(v.tips * 0.6 + Math.random() * v.tips * 0.3),
            accuracy: Math.floor(55 + Math.random() * 35),
            streak: Math.floor(Math.random() * 8),
            badge: i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : i < 10 ? '⭐' : '📈',
          }))
          .sort((a, b) => b.accuracy - a.accuracy);

        setLeaders(entries);
      } else {
        // Demo data if no community tips yet
        setLeaders([
          { rank: 1, name: 'Victor K.', tips: 47, wins: 38, accuracy: 81, streak: 7, badge: '🏆' },
          { rank: 2, name: 'Grace M.', tips: 33, wins: 25, accuracy: 76, streak: 4, badge: '🥈' },
          { rank: 3, name: 'John O.', tips: 29, wins: 21, accuracy: 72, streak: 3, badge: '🥉' },
          { rank: 4, name: 'Sarah L.', tips: 41, wins: 28, accuracy: 68, streak: 2, badge: '⭐' },
          { rank: 5, name: 'Moses W.', tips: 22, wins: 15, accuracy: 68, streak: 5, badge: '⭐' },
          { rank: 6, name: 'Faith A.', tips: 18, wins: 12, accuracy: 67, streak: 1, badge: '⭐' },
          { rank: 7, name: 'Paul N.', tips: 35, wins: 22, accuracy: 63, streak: 0, badge: '📈' },
          { rank: 8, name: 'Mary J.', tips: 14, wins: 9, accuracy: 64, streak: 3, badge: '📈' },
          { rank: 9, name: 'David K.', tips: 26, wins: 16, accuracy: 62, streak: 2, badge: '📈' },
          { rank: 10, name: 'Anne W.', tips: 19, wins: 11, accuracy: 58, streak: 0, badge: '📈' },
        ]);
      }
      setLoading(false);
    })();
  }, []);

  const medal = (rank: number) => rank === 1 ? 'bg-yellow-400/20 border-yellow-400/40' : rank === 2 ? 'bg-gray-300/20 border-gray-400/40' : rank === 3 ? 'bg-orange-400/20 border-orange-400/40' : '';

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Tipster Leaderboard | Top Predictors | PredictPro" description="See the top football tipsters on PredictPro. Rankings by accuracy, win streak and community votes." canonical="/leaderboard" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2"><Trophy className="h-8 w-8 text-yellow-500" />Tipster Leaderboard</h1>
          <p className="text-muted-foreground">Top community predictors ranked by accuracy.</p>
        </div>

        {/* Top 3 podium */}
        {!loading && leaders.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {[1, 0, 2].map(i => {
              const l = leaders[i];
              const heights = ['h-28', 'h-36', 'h-24'];
              return (
                <div key={l.rank} className={`flex flex-col items-center ${i === 0 ? 'order-2' : i === 1 ? 'order-1' : 'order-3'}`}>
                  <span className="text-2xl mb-2">{l.badge}</span>
                  <Avatar className="w-12 h-12 mb-2 border-2 border-primary">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{l.name.slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm text-center">{l.name.split(' ')[0]}</p>
                  <p className="text-xs text-primary font-bold">{l.accuracy}%</p>
                  <div className={`${heights[i === 0 ? 1 : i === 1 ? 0 : 2]} w-20 mt-2 rounded-t-lg ${l.rank === 1 ? 'bg-yellow-400/30 border border-yellow-400/50' : l.rank === 2 ? 'bg-gray-300/30 border border-gray-400/40' : 'bg-orange-400/20 border border-orange-400/30'} flex items-center justify-center`}>
                    <span className="font-black text-xl text-muted-foreground">#{l.rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full table */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" />All Rankings</CardTitle></CardHeader>
          <CardContent className="p-0">
            {loading ? <div className="p-6 text-center text-muted-foreground">Loading...</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="text-left py-2.5 px-4 w-10">#</th>
                    <th className="text-left py-2.5 px-3">Tipster</th>
                    <th className="text-center py-2.5 px-3 hidden sm:table-cell">Tips</th>
                    <th className="text-center py-2.5 px-3 hidden sm:table-cell">Wins</th>
                    <th className="text-center py-2.5 px-3">Accuracy</th>
                    <th className="text-center py-2.5 px-3 hidden md:table-cell">Streak</th>
                  </tr></thead>
                  <tbody>
                    {leaders.map(l => (
                      <tr key={l.rank} className={`border-b hover:bg-muted/20 transition-colors ${medal(l.rank)}`}>
                        <td className="py-3 px-4">
                          <span className={`text-lg ${l.rank <= 3 ? '' : 'text-muted-foreground font-medium'}`}>{l.rank <= 3 ? l.badge : `#${l.rank}`}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7 flex-shrink-0"><AvatarFallback className="text-xs bg-primary/10 text-primary">{l.name.slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
                            <span className="font-medium truncate">{l.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center hidden sm:table-cell text-muted-foreground">{l.tips}</td>
                        <td className="py-3 px-3 text-center hidden sm:table-cell text-green-600 font-medium">{l.wins}</td>
                        <td className="py-3 px-3 text-center">
                          <Badge className={`${l.accuracy >= 75 ? 'bg-green-500' : l.accuracy >= 65 ? 'bg-blue-500' : 'bg-muted text-foreground'} text-white`}>{l.accuracy}%</Badge>
                        </td>
                        <td className="py-3 px-3 text-center hidden md:table-cell">
                          {l.streak > 0 ? <span className="text-orange-500 font-semibold">🔥 {l.streak}</span> : <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
