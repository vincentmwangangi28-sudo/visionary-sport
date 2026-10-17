import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function JLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Japan J1 League Predictions Today: Early Kickoff xG & Corners Tips"
        description="Free Japanese J1 League AI football predictions today. Early-morning Over 2.5 goals, Corners Over 9.5, and BTTS picks for Vissel Kobe, Yokohama F. Marinos & Sanfrecce."
        keywords="j league predictions today, j1 league betting tips, japanese football predictions, vissel kobe prediction, yokohama f marinos tips"
        canonicalPath="/j-league-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Japan J1 League Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-rose-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Japan J1 League AI Predictions Today (Early Morning Goals &amp; Corners Hub)
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Kicking off between 05:00 and 10:00 UTC, Japan&apos;s Meiji Yasuda J1 League is the #1 early-morning football market for European and African bettors, featuring high-tempo wing play, 10.2+ average corners, and strong BTTS rates.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="J1 League" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
