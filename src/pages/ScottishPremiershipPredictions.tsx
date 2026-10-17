import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame } from 'lucide-react';

export default function ScottishPremiershipPredictions() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Scottish Premiership (SPFL) AI Football Predictions: Celtic, Rangers, Aberdeen & Hearts',
    description:
      'Daily Scottish Premiership (SPFL) AI football predictions, Over 2.5 goals, corners, and Asian Handicap forecasts for Celtic, Rangers, Aberdeen, and Hearts.',
    url: 'https://predictpro.guru/scottish-premiership-predictions',
    creator: {
      '@type': 'Organization',
      name: 'PredictPro',
      url: 'https://predictpro.guru',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Scottish Premiership Predictions Today: Celtic, Rangers & SPFL Tips"
        description="Free Scottish Premiership (SPFL) AI football predictions today. High-confidence Celtic & Rangers Asian Handicap picks, Over 2.5 goals, and corners tips."
        canonical="/scottish-premiership-predictions"
        keywords="scottish premiership predictions, spfl predictions today, celtic prediction today, rangers betting tips, scottish football accumulator tips"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Scottish Premiership Predictions' },
          ]}
        />

        <LeagueNavigationStrip currentPath="/scottish-premiership-predictions" />

        <section className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-600 text-white font-bold">
                <Trophy className="h-3.5 w-3.5 mr-1.5" /> Scottish Premiership (SPFL)
              </Badge>
              <Badge variant="outline" className="border-primary/40 text-primary font-semibold">
                <Flame className="h-3.5 w-3.5 mr-1" /> High Corner &amp; Goal Tempo
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Scottish Premiership (SPFL) AI Predictions &amp; Betting Tips
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              From Old Firm clashes between <strong>Celtic and Rangers</strong> to competitive European qualification battles featuring <strong>Aberdeen, Hearts, and Hibernian</strong>, the Scottish Premiership delivers Europe&apos;s highest corner-kick averages (10.8+ per game) and reliable Over 2.5 Goal banker legs.
            </p>
          </div>
        </section>

        <PredictionsDashboard defaultLeague="Scottish Premiership" />
      </main>

      <Footer />
    </div>
  );
}
