import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function TanzaniaLigaPredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Tanzania NBC Premier League Predictions: Simba SC, Yanga & Azam Tips"
        description="Free Tanzania NBC Premier League AI football predictions today. Expected Goals (xG), 1X2 banker picks, and SportPesa/Betway tips for Young Africans (Yanga), Simba SC, and Azam FC."
        keywords="tanzania premier league predictions, ligi kuu bara predictions today, simba sc prediction today, young africans yanga prediction, azam fc betting tips"
        canonical="/tanzania-premier-league-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Tanzania NBC Premier League Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-emerald-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Tanzania NBC Premier League (Ligi Kuu Bara) AI Predictions Today
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            East Africa&apos;s fastest-growing top-flight competition features high-scoring Kariakoo Derby contenders Young Africans (Yanga SC), Simba SC, and Azam FC. Our Bivariate Poisson model calibrates Dar es Salaam home dominance, artificial turf transitions, and clean-sheet probabilities across all 16 NBC Premier League clubs.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="Tanzania" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
