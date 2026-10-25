import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function MoroccoBotolaPredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Morocco Botola Pro Predictions Today: Raja, Wydad & AS FAR Tips"
        description="Free Morocco Botola Pro Inwi AI football predictions today. Expected Goals (xG), 1X2, BTTS, and Under 2.5 tips for Raja Casablanca, Wydad AC, AS FAR Rabat, and RS Berkane."
        keywords="morocco botola pro predictions, raja casablanca prediction today, wydad ac prediction, as far rabat tips, north africa football predictions"
        canonical="/morocco-botola-pro-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Morocco Botola Pro Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-emerald-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Morocco Botola Pro Inwi AI Football Predictions Today
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            North Africa&apos;s premier tactical league features CAF heavyweights Raja Club Athletic, Wydad AC, AS FAR Rabat, and RS Berkane. Explore daily Expected Goals (xG), clean-sheet suppression metrics, and exact scoreline probabilities.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="Morocco" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
