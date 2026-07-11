import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionCard } from '@/components/PredictionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Zap, RefreshCw, TrendingUp, Trophy } from 'lucide-react';
import { AdBannerHorizontal } from '@/components/AdBanner';
import { WhatsAppShare } from '@/components/WhatsAppShare';
import type { Prediction } from '@/types/prediction';
import { getPrediction, getConfidence } from '@/types/prediction';

export default function BestBets() {
  const [bets, setBets] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [minConf, setMinConf] = useState(60);

  const fetch_ = async () => {
    setLoading(true);
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
    const { data } = await supabase.from('predictions')
      .select('*')
      .gte('match_date', new Date().toISOString())
      .lte('match_date', nextWeek)
      .gte('confidence', minConf)
      .order('confidence', { ascending: false })
      .limit(18);
    setBets((data ?? []) as Prediction[]);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, [minConf]);

  const shareText = bets.slice(0, 5).map(b =>
    `✅ ${b.home_team} vs ${b.away_team} — ${getPrediction(b)} (${getConfidence(b)}% conf)`
  ).join('\n') + '\n\n🔮 predictpro.guru';

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Today's Best Football Bets | Free AI Tips | PredictPro"
        description="Today's highest-confidence AI football predictions. Free daily tips with 60%+ accuracy scores, odds comparison and expert analysis."
        canonical="/best-bets"
        keywords="best football bets today, free football tips today, sure bets today, high confidence football predictions" />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />Best Bets Today
            </h1>
            <p className="text-muted-foreground mt-1">AI predictions with {minConf}%+ confidence · Next 7 days</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <WhatsAppShare text={shareText} />
            <Button variant="outline" size="sm" onClick={fetch_} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Confidence filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[50, 60, 70, 75, 80].map(c => (
            <Button key={c} size="sm" variant={minConf === c ? 'default' : 'outline'}
              onClick={() => setMinConf(c)} className="gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />{c}%+
            </Button>
          ))}
          <Badge variant="outline" className="ml-auto self-center px-3 py-1.5">
            {bets.length} picks found
          </Badge>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : bets.length === 0 ? (
          <div className="text-center py-20">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-semibold text-lg">No predictions at {minConf}%+ confidence</p>
            <p className="text-muted-foreground mt-1 mb-4">Try a lower threshold to see more picks</p>
            <Button onClick={() => setMinConf(50)} variant="outline">Show All (50%+)</Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bets.map((p, i) => (
                <div key={p.id}>
                  <PredictionCard prediction={p} />
                  {i === 5 && <AdBannerHorizontal className="sm:col-span-2 lg:col-span-3 mt-2" />}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
