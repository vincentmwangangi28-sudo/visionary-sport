import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function MlsPredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="MLS Predictions Today: Inter Miami, LAFC & Major League Soccer Tips"
        description="Free Major League Soccer (MLS) AI predictions today. Get Over 2.5 goals, BTTS, and Moneyline picks for Inter Miami, LA Galaxy, LAFC, and Columbus Crew."
        keywords="mls predictions today, major league soccer betting tips, inter miami prediction today, mls over 2.5 goals tips, mls parlay picks"
        canonicalPath="/mls-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'MLS Predictions (Major League Soccer)' },
          ]}
        />
        <section className="rounded-2xl border border-blue-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Major League Soccer (MLS) AI Predictions &amp; Over 2.5 Goals Hub
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Because MLS clubs allocate Designated Player (DP) salary budgets heavily toward attacking stars while starting domestic defenders, Major League Soccer consistently ranks top-3 globally for Both Teams to Score (61%+) and Over 2.5 Goals.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="MLS" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
