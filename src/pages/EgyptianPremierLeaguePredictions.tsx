import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function EgyptianPremierLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Egyptian Premier League Predictions Today: Al Ahly & Zamalek Tips"
        description="Free Egyptian Premier League (Nile League) AI football predictions today. Win-to-Nil, 1X2, and Under 2.5 tips for Al Ahly, Zamalek, Pyramids FC & Al Masry."
        keywords="egyptian premier league predictions, al ahly prediction today, zamalek betting tips, egypt football predictions today, pyramids fc tips"
        canonicalPath="/egyptian-premier-league-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Egyptian Premier League Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-amber-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Egyptian Premier League (Al Ahly, Zamalek &amp; Pyramids FC) AI Predictions
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            North Africa&apos;s flagship Nile League is dominated by Al Ahly, Pyramids FC, and Zamalek, offering elite Win-to-Nil and Asian Handicap (-1.5) value alongside low-scoring mid-table Under 2.5 stalemates.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="Egyptian Premier League" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
