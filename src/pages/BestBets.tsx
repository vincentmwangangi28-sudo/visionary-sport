import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Share2, Clock, Flame, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AdBannerHorizontal } from '@/components/AdBanner';
import { WhatsAppShare } from '@/components/WhatsAppShare';

interface Prediction {
  id: string; home_team: string; away_team: string; match_date: string;
  league: string; prediction: string; confidence: number;
  home_odds: number; away_odds: number; draw_odds: number;
  is_premium: boolean; result: string;
}

const CONFIDENCE_LABEL = (c: number) => c >= 80 ? { label: 'Sure Bet', color: 'bg-green-500', icon: '🔥' } : c >= 65 ? { label: 'High Value', color: 'bg-blue-500', icon: '⭐' } : { label: 'Good Pick', color: 'bg-amber-500', icon: '✅' };

export default function BestBets() {
  const [bets, setBets] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBets = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const { data } = await supabase
        .from('predictions')
        .select('id,home_team,away_team,league,match_date,prediction,predicted_outcome,confidence,confidence_score,home_odds,draw_odds,away_odds,is_premium,result')
        .gte('match_date', today)
        .lte('match_date', nextWeek)
        .gte('confidence', 60)
        .order('confidence', { ascending: false })
        .limit(10);
      setBets(data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBets(); }, []);

  const shareAll = async () => {
    const text = `🔥 Today's Best Bets from PredictPro AI\n\n${bets.slice(0, 5).map(b => `✅ ${b.home_team} vs ${b.away_team}\n   ${b.prediction} (${b.confidence}% confidence)`).join('\n\n')}\n\npredictpro.guru`;
    if (navigator.share) await navigator.share({ title: "Today's Best Bets", text });
    else { navigator.clipboard.writeText(text); toast.success('Copied to clipboard!'); }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Today's Best Football Bets | Free AI Tips | PredictPro" description="Today's highest-confidence AI football predictions. Free daily tips with 60%+ accuracy scores, odds comparison and expert analysis. Premier League, La Liga, Champions League and more." keywords="best football bets today, free football tips today, sure bets today, high confidence football predictions, football accumulator tips" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3"><Flame className="h-8 w-8 text-orange-500" />Today's Best Bets</h1>
            <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />Updated daily at 6AM EAT • Only 60%+ confidence
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchBets} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <WhatsAppShare text={bets.slice(0,5).map(b => `✅ ${b.home_team} vs ${b.away_team} — ${b.predicted_outcome??b.prediction} (${b.confidence_score??b.confidence}%)`).join('\n') + '\n\npredictpro.guru'} />
            <Button size="sm" onClick={shareAll} disabled={!bets.length} className="gap-1.5">
              <Share2 className="h-4 w-4" />Share All
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && bets.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Predictions', value: bets.length, icon: Star },
              { label: 'Avg Confidence', value: `${Math.round(bets.reduce((s, b) => s + b.confidence, 0) / bets.length)}%`, icon: CheckCircle },
              { label: 'Top Pick', value: `${bets[0]?.confidence}%`, icon: Flame },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="p-3 text-center">
                  <Icon className="h-5 w-5 mx-auto text-primary mb-1" />
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : bets.length === 0 ? (
          <div className="text-center py-20">
            <Flame className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No high-confidence predictions yet today. Check back after 6AM EAT.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet, i) => {
              const conf = CONFIDENCE_LABEL(bet.confidence_score ?? bet.confidence);
              const outcomeOdds = (bet.predicted_outcome ?? bet.prediction) === 'Home Win' ? bet.home_odds : bet.prediction === 'Away Win' ? bet.away_odds : bet.draw_odds;
              return (
                <Card key={bet.id} className={`${i === 0 ? 'border-orange-500/40 bg-orange-500/5' : ''} transition-all hover:border-primary/30`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">{bet.league}</Badge>
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${conf.color}`}>{conf.icon} {conf.label}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{new Date(bet.match_date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="font-bold">{bet.home_team} vs {bet.away_team}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm font-semibold text-primary">{bet.predicted_outcome ?? bet.prediction}</span>
                          {outcomeOdds && <span className="text-sm text-muted-foreground">@ <span className="font-bold text-foreground">{outcomeOdds.toFixed(2)}</span></span>}
                          <div className="ml-auto flex items-center gap-1">
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${(bet.confidence_score ?? bet.confidence)}%` }} />
                            </div>
                            <span className="text-xs font-semibold">{(bet.confidence_score ?? bet.confidence)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-4 bg-muted/30 rounded-xl text-center text-sm text-muted-foreground">
          ⚠️ These are AI predictions for entertainment. Past accuracy doesn't guarantee future results. Gamble responsibly.
        </div>
      </main>
      <AdBannerHorizontal className="mb-4 mx-4" />
      <Footer />
    </div>
  );
}
