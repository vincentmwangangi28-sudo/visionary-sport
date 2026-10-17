import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function LigaMxPredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Liga MX Predictions Today: Club América, Monterrey & Mexican Tips"
        description="Free Mexican Liga MX (Apertura & Clausura) AI football predictions today. High-altitude home xG picks, BTTS, and Liguilla tips for Club América, Tigres & Monterrey."
        keywords="liga mx predictions today, mexican football predictions, club america prediction today, monterrey vs tigres betting tips, liga mx btts predictions"
        canonicalPath="/liga-mx-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Liga MX Predictions (Mexico)' },
          ]}
        />
        <section className="rounded-2xl border border-emerald-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Mexican Liga MX AI Predictions Today (Apertura, Clausura &amp; Liguilla)
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Liga MX combines severe elevation factors (Mexico City &amp; Toluca at 2,200m+ altitude) with high-scoring transition play. Our Bivariate Poisson model adjusts away xG decay for elevation and tracks Club América, Cruz Azul, Monterrey, Tigres UANL, and Guadalajara.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="Liga MX" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
