import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame } from 'lucide-react';

export default function BelgianProLeaguePredictions() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Belgian Pro League (Jupiler Pro League) AI Football Predictions: Club Brugge, Anderlecht & Genk',
    description:
      'Daily Belgian Jupiler Pro League AI football predictions, BTTS, Over 2.5 goals, and Championship Playoff xG forecasts for Club Brugge, Anderlecht, Genk, and Union SG.',
    url: 'https://predictpro.guru/belgian-pro-league-predictions',
    creator: {
      '@type': 'Organization',
      name: 'PredictPro',
      url: 'https://predictpro.guru',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Belgian Pro League Predictions Today: Jupiler League AI Tips"
        description="Free Belgian Jupiler Pro League AI football predictions today. High-strike-rate BTTS, Over 2.5 goals, and 1X2 tips for Club Brugge, Anderlecht, Genk & Union SG."
        canonical="/belgian-pro-league-predictions"
        keywords="belgian pro league predictions, jupiler pro league tips today, club brugge prediction, anderlecht betting tips, belgium football predictions"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Belgian Pro League Predictions' },
          ]}
        />

        <LeagueNavigationStrip currentPath="/belgian-pro-league-predictions" />

        <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500 text-amber-950 font-black">
                <Trophy className="h-3.5 w-3.5 mr-1.5" /> Jupiler Pro League
              </Badge>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 font-semibold">
                <Flame className="h-3.5 w-3.5 mr-1" /> 61% BTTS (Yes) League Rate
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Belgian Jupiler Pro League AI Football Predictions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Belgium&apos;s top division is renowned across Europe for vertical transition play and high-scoring Championship Playoff groups. Track daily Expected Goals (xG) and Both Teams to Score (BTTS) edges for <strong>Club Brugge, Union Saint-Gilloise, Anderlecht, KRC Genk, and Royal Antwerp</strong>.
            </p>
          </div>
        </section>

        <PredictionsDashboard defaultLeague="Pro League" />
      </main>

      <Footer />
    </div>
  );
}
