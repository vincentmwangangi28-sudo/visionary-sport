import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame } from 'lucide-react';

export default function TurkishSuperLigPredictions() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Turkish Süper Lig AI Football Predictions: Galatasaray, Fenerbahçe & Beşiktaş',
    description:
      'Daily Turkish Süper Lig AI football predictions, Over 2.5 goals, cards, and Asian Handicap tips for Galatasaray, Fenerbahçe, Beşiktaş, and Trabzonspor.',
    url: 'https://predictpro.guru/turkish-super-lig-predictions',
    creator: {
      '@type': 'Organization',
      name: 'PredictPro',
      url: 'https://predictpro.guru',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Turkish Süper Lig Predictions Today: Galatasaray & Fenerbahçe Tips"
        description="Free Turkish Süper Lig AI football predictions today. High-confidence 1X2, Over 2.5 goals, and card booking picks for Galatasaray, Fenerbahçe & Beşiktaş."
        canonical="/turkish-super-lig-predictions"
        keywords="turkish super lig predictions, super lig tips today, galatasaray prediction today, fenerbahce betting tips, turkey football predictions"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Turkish Süper Lig Predictions' },
          ]}
        />

        <LeagueNavigationStrip currentPath="/turkish-super-lig-predictions" />

        <section className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-red-600 text-white font-bold">
                <Trophy className="h-3.5 w-3.5 mr-1.5" /> Trendyol Süper Lig
              </Badge>
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 font-semibold">
                <Flame className="h-3.5 w-3.5 mr-1" /> Intense Home Atmosphere &amp; Cards
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Turkish Süper Lig AI Football Predictions &amp; xG Tips
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
               Dominated by Istanbul powerhouses <strong>Galatasaray, Fenerbahçe, and Beşiktaş</strong> alongside <strong>Trabzonspor</strong>, the Turkish Süper Lig combines elite European attacking firepower with high-passion stadium environments that drive consistent Over 2.5 Goals and Over 4.5 Yellow Card trends.
            </p>
          </div>
        </section>

        <PredictionsDashboard defaultLeague="Super Lig" />
      </main>

      <Footer />
    </div>
  );
}
