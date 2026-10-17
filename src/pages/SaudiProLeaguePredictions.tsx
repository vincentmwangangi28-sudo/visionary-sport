import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, ShieldCheck } from 'lucide-react';

export default function SaudiProLeaguePredictions() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Saudi Pro League (Roshn SPL) AI Football Predictions: Al-Hilal, Al-Nassr & Al-Ittihad',
    description:
      'Daily Saudi Pro League (SPL) AI football predictions, Over 2.5 goals probabilities, BTTS tips, and xG forecasts for Al-Hilal, Al-Nassr, Al-Ittihad, and Al-Ahli.',
    url: 'https://predictpro.guru/saudi-pro-league-predictions',
    creator: {
      '@type': 'Organization',
      name: 'PredictPro',
      url: 'https://predictpro.guru',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Saudi Pro League Predictions Today: Al-Hilal, Al-Nassr & SPL Tips"
        description="Free Saudi Pro League (Roshn SPL) AI football predictions today. Over 2.5 goals, BTTS, and Asian Handicap picks for Al-Hilal, Al-Nassr & Al-Ittihad."
        canonical="/saudi-pro-league-predictions"
        keywords="saudi pro league predictions, spl predictions today, al nassr prediction today, al hilal betting tips, saudi league over 2.5 goals"
        structuredData={jsonLd}
      />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Saudi Pro League Predictions' },
          ]}
        />

        <LeagueNavigationStrip currentPath="/saudi-pro-league-predictions" />

        <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-background p-6 md:p-8 shadow-sm">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-600 text-white font-bold">
                <Trophy className="h-3.5 w-3.5 mr-1.5" /> Roshn Saudi Pro League
              </Badge>
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 font-semibold">
                <Flame className="h-3.5 w-3.5 mr-1" /> 3.18 Avg Goals / Match
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Saudi Pro League (SPL) AI Predictions &amp; Goal Market Tips
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              The Roshn Saudi Pro League features one of the largest attacking xG disparities in world football between the PIF Big Four (<strong>Al-Hilal, Al-Nassr, Al-Ittihad, Al-Ahli</strong>) and mid-table clubs—making Over 2.5 Goals and -1.5 Asian Handicap markets exceptionally profitable.
            </p>
          </div>
        </section>

        <PredictionsDashboard defaultLeague="Saudi Pro League" />
      </main>

      <Footer />
    </div>
  );
}
