import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function UgandaPremierLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Uganda Premier League Predictions Today: Vipers SC, KCCA & SC Villa"
        description="Free StarTimes Uganda Premier League (UPL) AI football predictions today. Home win 1X2, Under 2.5, and Correct Score tips for Vipers SC, KCCA FC, SC Villa, and Kitara FC."
        keywords="uganda premier league predictions today, vipers sc prediction, kcca fc prediction today, sc villa betting tips, upl football predictions"
        canonical="/uganda-premier-league-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Uganda Premier League Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-emerald-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            StarTimes Uganda Premier League (UPL) AI Predictions Today
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Data-driven East African football predictions for the Uganda Premier League, covering Vipers SC, KCCA FC, SC Villa, BUL FC, and Kitara FC with Bivariate Poisson goal expectancy and Double Chance (1X) stability models.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="Uganda" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
