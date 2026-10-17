import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { Badge } from '@/components/ui/badge';
import { Trophy, ShieldCheck } from 'lucide-react';

export default function ArgentinaPrimeraPredictions() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Argentina Liga Profesional (Primera División) AI Predictions: River Plate & Boca Juniors',
    description:
      'Daily Argentine Primera División (Liga Profesional) AI football predictions, Under/Over 2.5 goals, Draw No Bet, and 1X2 odds for River Plate, Boca Juniors, and Racing Club.',
    url: 'https://predictpro.guru/argentina-primera-predictions',
    creator: {
      '@type': 'Organization',
      name: 'PredictPro',
      url: 'https://predictpro.guru',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Argentina Primera División Predictions: Liga Profesional AI Tips"
        description="Free Argentina Liga Profesional (Primera División) AI football predictions today. Get home-banker 1X2, Under 2.5, and Draw No Bet tips for River Plate & Boca Juniors."
        canonical="/argentina-primera-predictions"
        keywords="argentina primera division predictions, liga profesional argentina tips, river plate prediction today, boca juniors betting tips, argentine football predictions"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Argentina Primera División Predictions' },
          ]}
        />

        <LeagueNavigationStrip currentPath="/argentina-primera-predictions" />

        <section className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-sky-600 text-white font-bold">
                <Trophy className="h-3.5 w-3.5 mr-1.5" /> Liga Profesional Argentina
              </Badge>
              <Badge variant="outline" className="border-sky-500/40 text-sky-400 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Tactical Low-xGA Profile
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Argentina Primera División (Liga Profesional) AI Predictions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Featuring iconic Buenos Aires giants <strong>River Plate, Boca Juniors, Racing Club, Independiente, and San Lorenzo</strong>, the Argentine Primera División rewards disciplined tactical analysis, First-Half Under 1.5 structures, and home Draw No Bet (DNB) value.
            </p>
          </div>
        </section>

        <PredictionsDashboard defaultLeague="Liga Profesional" />
      </main>

      <Footer />
    </div>
  );
}
