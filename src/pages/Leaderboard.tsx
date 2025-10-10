import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

interface LeaderboardEntry {
  user_id: string;
  score: number;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('contest_entries')
        .select(`
          user_id,
          score,
          profiles!inner (
            full_name,
            email
          )
        `)
        .order('score', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setLeaders((data as any) || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Award className="h-6 w-6 text-orange-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Global Leaderboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Top Predictors of the Month
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rankings</CardTitle>
              <CardDescription>Compete with thousands of users worldwide</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              ) : leaders.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No entries yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaders.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        index < 3 
                          ? 'bg-gradient-to-r from-primary/10 to-transparent border border-primary/20' 
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 flex justify-center">
                          {getRankIcon(index)}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {entry.profiles?.full_name || 'Anonymous User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.profiles?.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {entry.score}
                        </p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
