import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function AustralianALeaguePredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Australian A-League Predictions Today: Over 2.5 Goals & Corners Tips"
        description="Free Australian A-League Men AI football predictions today. High-scoring Over 2.5 goals, BTTS, and Over 10.5 Corners picks for Melbourne Victory & Sydney FC."
        keywords="a league predictions today, australian a league betting tips, sydney fc prediction, melbourne victory tips, a league over 2.5 goals"
        canonicalPath="/australian-a-league-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Australian A-League Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-amber-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Australian A-League AI Predictions Today (Over 2.5 Goals &amp; Corners)
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Australia&apos;s Isuzu UTE A-League Men averages over 3.12 goals and 10.6 corners per match, making it one of the highest-yielding morning leagues globally for Over 2.5 Goals, Over 3.5 Goals, and Both Teams to Score.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="A-League" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
