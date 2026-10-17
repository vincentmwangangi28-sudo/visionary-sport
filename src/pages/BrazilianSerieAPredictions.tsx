import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { Badge } from '@/components/ui/badge';
import { Trophy, ShieldCheck } from 'lucide-react';

export default function BrazilianSerieAPredictions() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Brazilian Serie A (Brasileirão) AI Football Predictions: Flamengo, Palmeiras & Botafogo',
    description:
      'Daily Brasileirão Serie A AI football predictions, 1X2 home advantage probabilities, Under/Over 2.5 goals, and BTTS tips across Brazil’s top flight.',
    url: 'https://predictpro.guru/brazilian-serie-a-predictions',
    creator: {
      '@type': 'Organization',
      name: 'PredictPro',
      url: 'https://predictpro.guru',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Brazilian Serie A Predictions Today: Brasileirão AI Tips & Odds"
        description="Free Brazilian Serie A (Brasileirão) AI football predictions today. Get home-advantage 1X2 picks, BTTS, and xG forecasts for Palmeiras, Flamengo & Botafogo."
        canonical="/brazilian-serie-a-predictions"
        keywords="brazilian serie a predictions, brasileirao predictions today, brazil serie a betting tips, flamengo prediction, palmeiras betting tips"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Brazilian Serie A Predictions' },
          ]}
        />

        <LeagueNavigationStrip currentPath="/brazilian-serie-a-predictions" />

        <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-amber-500 text-amber-950 font-black">
                <Trophy className="h-3.5 w-3.5 mr-1.5" /> Brasileirão Série A
              </Badge>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> 51% Home Win Advantage
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Brazilian Serie A (Brasileirão) AI Football Predictions
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Long domestic flight distances and Copa Libertadores squad rotation make the <strong>Brasileirão Série A</strong> one of the strongest home-advantage leagues in world football. Our AI engine tracks travel fatigue and xG differentials for <strong>Flamengo, Palmeiras, Botafogo, São Paulo, and Corinthians</strong>.
            </p>
          </div>
        </section>

        <PredictionsDashboard defaultLeague="Brasileirão" />
      </main>

      <Footer />
    </div>
  );
}
