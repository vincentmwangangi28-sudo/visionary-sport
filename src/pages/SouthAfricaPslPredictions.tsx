import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function SouthAfricaPslPredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="South Africa PSL Predictions Today: Betway Premiership AI Tips"
        description="Free South Africa PSL (Betway Premiership) AI football predictions today. Mamelodi Sundowns, Orlando Pirates & Kaizer Chiefs 1X2, Under 2.5, and Nedbank Cup tips."
        keywords="psl predictions today, betway premiership predictions, dstv premiership tips today, mamelodi sundowns prediction, orlando pirates vs kaizer chiefs tips"
        canonicalPath="/south-africa-psl-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'South Africa PSL (Betway Premiership) Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-yellow-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            South Africa PSL (Betway Premiership) AI Predictions Today
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            The South African Premier Soccer League (Betway Premiership) combines Mamelodi Sundowns&apos; possession dominance and Orlando Pirates&apos; cup pedigree with tight, low-scoring Under 2.5 mid-table battles.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="PSL" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
