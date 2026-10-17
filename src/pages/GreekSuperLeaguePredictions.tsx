import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function GreekSuperLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Greek Super League Predictions: Olympiacos, PAOK, AEK & Panathinaikos"
        description="Free Greek Super League (Stoiximan Super League) AI football predictions today. Home banker 1X2, Under 2.5, and Championship Playoff tips for Olympiacos & PAOK."
        keywords="greek super league predictions, super league greece tips today, olympiacos prediction today, paok vs aek athens betting tips, greek football predictions"
        canonicalPath="/greek-super-league-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Greek Super League Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-sky-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Greek Super League AI Predictions Today (Olympiacos, PAOK, AEK &amp; Panathinaikos)
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Greece&apos;s Stoiximan Super League features a sharp split between dominant Big-4 Win-to-Nil home bankers in the regular season and intense, card-heavy derbies during the Championship Round playoffs.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="Super League" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
