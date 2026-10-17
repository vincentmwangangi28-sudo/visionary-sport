import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function NigerianNpflPredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Nigeria NPFL Predictions Today: Enyimba, Remo Stars & Rangers Tips"
        description="Free Nigeria Premier Football League (NPFL) AI predictions today. Home-banker 1X2, Under 2.5 & Correct Score tips for Enyimba, Remo Stars & Rangers."
        keywords="npfl predictions today, nigeria premier league predictions, enyimba prediction today, remo stars betting tips, sportybet npfl tips"
        canonical="/nigerian-npfl-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Nigeria NPFL Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-emerald-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Nigeria Premier Football League (NPFL) AI Predictions Today
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            The Nigerian Premier Football League (NPFL) features the strongest home-field win percentage (66%+) in world football due to long road travel distances and passionate home support for Enyimba, Rangers International, Remo Stars, Shooting Stars, and Kano Pillars.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="NPFL" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
