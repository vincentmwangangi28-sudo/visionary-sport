import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Calendar, Star, Crown } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';
import { AccuracyDashboard } from '@/components/AccuracyDashboard';

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
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('monthly');

  useEffect(() => {
    loadLeaderboard();

    // Real-time updates for leaderboard
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contest_entries'
        },
        (payload) => {
          console.log('🏆 Leaderboard updated:', payload);
          loadLeaderboard();
          toast.success('Leaderboard updated! 📊');
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time leaderboard connected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeframe]);

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
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Award className="h-6 w-6 text-orange-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent border-2 border-yellow-500/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-400/20 via-gray-300/10 to-transparent border border-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-orange-500/20 via-orange-400/10 to-transparent border border-orange-500/30';
    return 'bg-muted/30 hover:bg-muted/50';
  };

  // GA4 Event Tracking
  const trackLeaderboardView = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'leaderboard_view', {
        'event_category': 'Engagement',
        'event_label': 'Leaderboard Page',
        'timeframe': timeframe,
      });
    }
  };

  // Enhanced structured data for leaderboard (ItemList)
  const leaderboardStructuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "PredictPro Guru Leaderboard",
    "description": "Top predictors ranked by accuracy and performance in AI sports predictions",
    "itemListOrder": "https://schema.org/ItemListOrderDescending",
    "numberOfItems": leaders.length,
    "itemListElement": leaders.slice(0, 10).map((entry, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Person",
        "name": entry.profiles?.full_name || "Anonymous User",
        "description": `Rank #${index + 1} • ${entry.score} points`,
        "additionalProperty": [
          {
            "@type": "PropertyValue",
            "name": "Score",
            "value": entry.score.toString()
          },
          {
            "@type": "PropertyValue",
            "name": "Rank",
            "value": (index + 1).toString()
          }
        ]
      }
    }))
  };

  useEffect(() => {
    trackLeaderboardView();
  }, [timeframe]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Helmet>
        <title>Prediction Leaderboard Kenya | PredictPro</title>
        <meta name="description" content="See top sports predictors in Kenya. Compete on our leaderboard, track prediction accuracy, and win prizes. Join PredictPro's prediction contests." />
        <meta property="og:title" content="Prediction Leaderboard Kenya | PredictPro" />
        <meta property="og:description" content="Compete with thousands of users. See who's making the best AI-powered sports predictions in Kenya." />
        <meta property="og:image" content="https://predictpro.guru/og-leaderboard.jpg" />
        <meta name="keywords" content="prediction leaderboard Kenya, sports prediction contest, betting competition Nairobi, prediction accuracy ranking" />
        <link rel="canonical" href="https://predictpro.guru/leaderboard" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(leaderboardStructuredData) }} />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Global Leaderboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Compete with the best predictors worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Leaderboard */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        Rankings
                      </CardTitle>
                      <CardDescription>Compete with thousands of users worldwide</CardDescription>
                    </div>
                    <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
                      <TabsList>
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="alltime">All Time</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
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
                          key={`${entry.user_id}-${index}`}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 hover-lift animate-fade-in ${getRankStyle(index)}`}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 flex justify-center">
                              {getRankIcon(index)}
                            </div>
                            <div>
                              <p className="font-semibold flex items-center gap-2">
                                {entry.profiles?.full_name || 'Anonymous User'}
                                {index < 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {index === 0 ? 'Champion' : index === 1 ? 'Runner-up' : 'Bronze'}
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {entry.profiles?.email?.replace(/(.{3}).*(@.*)/, '$1***$2')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold bg-gradient-victory bg-clip-text text-transparent animate-counter">
                              {entry.score.toLocaleString()}
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

            {/* Sidebar - Accuracy Dashboard */}
            <div className="space-y-6">
              <AccuracyDashboard />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
