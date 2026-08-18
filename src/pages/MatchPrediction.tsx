import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { PredictionDetailModal } from '@/components/PredictionDetailModal';
import { AdBannerHorizontal } from '@/components/AdBanner';
import type { Prediction } from '@/types/prediction';
import { Zap, ChevronLeft } from 'lucide-react';

// Slug format: home-team-vs-away-team-2026-08-22 (matches generate-daily-blog-posts' slugify)
function parseSlug(slug: string) {
  const dateMatch = slug.match(/-(\d{4}-\d{2}-\d{2})$/);
  const date = dateMatch?.[1];
  const teamsPart = date ? slug.slice(0, -(date.length + 1)) : slug;
  const [homePart, awayPart] = teamsPart.split('-vs-');
  return {
    date,
    home: homePart?.replace(/-/g, ' '),
    away: awayPart?.replace(/-/g, ' '),
  };
}

export default function MatchPrediction() {
  const { matchSlug } = useParams<{ matchSlug: string }>();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!matchSlug) { setLoading(false); return; }
    const { home, away } = parseSlug(matchSlug);
    if (!home || !away) { setLoading(false); return; }

    // Fast, indexed local query — no external API roundtrip on page load.
    (async () => {
      const { data } = await supabase
        .from('predictions')
        .select('*')
        .ilike('home_team', home)
        .ilike('away_team', away)
        .order('match_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      setPrediction(data as Prediction | null);
      setLoading(false);
    })();
  }, [matchSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-24 max-w-2xl">
          <Skeleton className="h-64 rounded-xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Prediction Not Found | PredictPro" noIndex canonical={`/predict/${matchSlug}`} />
        <Navbar />
        <main className="container mx-auto px-4 py-24 text-center max-w-lg">
          <h1 className="text-2xl font-bold mb-3">We don't have this match yet</h1>
          <p className="text-muted-foreground mb-6">It may not be scheduled, or the fixture already passed.</p>
          <Link to="/best-bets"><Button className="gap-2"><Zap className="h-4 w-4" />See Today's Predictions</Button></Link>
        </main>
        <Footer />
      </div>
    );
  }

  const outcome = prediction.predicted_outcome ?? prediction.prediction ?? 'Draw';
  const confidence = prediction.confidence_score ?? prediction.confidence ?? 65;
  const title = `${prediction.home_team} vs ${prediction.away_team} AI Prediction, H2H Stats, and Free Betting Tips - PredictPro`;
  const description = `${prediction.home_team} vs ${prediction.away_team} prediction: ${outcome} (${confidence}% AI confidence). ${prediction.league} match analysis, head-to-head stats, odds and free betting tips.`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={title}
        description={description}
        canonical={`/predict/${matchSlug}`}
        keywords={`${prediction.home_team} vs ${prediction.away_team} prediction, ${prediction.league} prediction, ${prediction.home_team} ${prediction.away_team} betting tips, ${prediction.home_team} vs ${prediction.away_team} H2H`}
        structuredData={{
          '@type': 'SportsEvent',
          name: `${prediction.home_team} vs ${prediction.away_team}`,
          startDate: prediction.match_date,
          sport: 'Football',
          homeTeam: { '@type': 'SportsTeam', name: prediction.home_team },
          awayTeam: { '@type': 'SportsTeam', name: prediction.away_team },
        }}
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-2xl">
        <Link to="/best-bets" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4" />All Predictions
        </Link>
        <Badge variant="outline" className="mb-3">{prediction.league}</Badge>
        <h1 className="text-3xl font-black mb-2">{prediction.home_team} vs {prediction.away_team}</h1>
        <p className="text-muted-foreground mb-6">
          {new Date(prediction.match_date).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        <Card className="border-primary/30 cursor-pointer hover:shadow-lg transition-all" onClick={() => setShowModal(true)}>
          <CardContent className="p-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">AI Prediction</p>
            <Badge className={`text-lg px-4 py-1.5 font-bold ${outcome === 'Home Win' ? 'bg-green-700' : outcome === 'Away Win' ? 'bg-red-700' : 'bg-amber-600'} text-white`}>
              {outcome}
            </Badge>
            <p className="text-4xl font-black text-primary mt-3">{confidence}%</p>
            <p className="text-sm text-muted-foreground mt-1">confidence</p>
            <Button variant="outline" size="sm" className="mt-4">View Full Analysis & H2H →</Button>
          </CardContent>
        </Card>

        <AdBannerHorizontal className="mt-8" />
      </main>
      <Footer />
      {showModal && <PredictionDetailModal prediction={prediction} open={showModal} onClose={() => setShowModal(false)} />}
    </div>
  );
}
