import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function KoreanKLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="South Korea K League 1 Predictions Today: Ulsan HD, Jeonbuk & FC Seoul"
        description="Free South Korea K League 1 AI football predictions today. Early morning kickoff xG forecasts, Over 2.5 Goals, BTTS, and Corner tips for Ulsan HD, Jeonbuk Motors, Pohang Steelers, and FC Seoul."
        keywords="k league 1 predictions today, south korea football predictions, ulsan hd prediction, fc seoul betting tips, asian football predictions"
        canonical="/k-league-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'South Korea K League 1 Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-emerald-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            South Korea K League 1 AI Football Predictions &amp; xG Odds
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            East Asia&apos;s premier early-kickoff competition features AFC Champions League contenders Ulsan HD, Pohang Steelers, Jeonbuk Hyundai Motors, Gangwon FC, and FC Seoul. Access daily Expected Goals (xG), BTTS, and corner kick projections.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="K League" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
