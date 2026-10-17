import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { Badge } from '@/components/ui/badge';
import { Trophy, Sparkles } from 'lucide-react';

export default function FaCupPredictions() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'English FA Cup & Carabao EFL Cup AI Football Predictions Today',
    description:
      'Daily English FA Cup and Carabao EFL Cup AI football predictions, squad rotation adjustments, giant-killing upset probabilities, and Over 2.5 goals tips.',
    url: 'https://predictpro.guru/fa-cup-predictions',
    creator: {
      '@type': 'Organization',
      name: 'PredictPro',
      url: 'https://predictpro.guru',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="FA Cup & Carabao Cup Predictions Today: English Knockout AI Tips"
        description="Free English FA Cup and Carabao EFL Cup AI football predictions today. Squad rotation xG models, cup upset alerts, BTTS, and Asian Handicap picks."
        canonical="/fa-cup-predictions"
        keywords="fa cup predictions today, carabao cup predictions, efl cup betting tips, english fa cup accumulator tips, fa cup upset predictions"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'FA Cup & Carabao Cup Predictions' },
          ]}
        />

        <LeagueNavigationStrip currentPath="/fa-cup-predictions" />

        <section className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-rose-600 text-white font-bold">
                <Trophy className="h-3.5 w-3.5 mr-1.5" /> English Knockout Football
              </Badge>
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 font-semibold">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Squad Rotation Adjusted
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              English FA Cup &amp; Carabao EFL Cup AI Predictions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Domestic cup ties between Premier League giants and EFL Championship or League One challengers require specialized lineup modeling. Our AI engine adjusts Expected Goals (xG) for projected starting XI rotation, single-leg elimination urgency, and +1.5 underdog Asian Handicap value.
            </p>
          </div>
        </section>

        <PredictionsDashboard defaultLeague="Premier League" />
      </main>

      <Footer />
    </div>
  );
}
