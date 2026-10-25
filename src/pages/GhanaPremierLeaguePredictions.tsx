import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function GhanaPremierLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Ghana Premier League Predictions Today: Asante Kotoko & Hearts of Oak"
        description="Free Ghana Premier League (GPL) AI football predictions today. Home win 1X2, Under 2.5 Goals, and SportyBet Ghana booking tips for Asante Kotoko, Hearts of Oak, and Medeama."
        keywords="ghana premier league predictions today, asante kotoko prediction, hearts of oak betting tips, sportybet ghana predictions, gpl football tips"
        canonical="/ghana-premier-league-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'Ghana Premier League Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-emerald-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Ghana Premier League (GPL) AI Predictions &amp; xG Tips Today
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Quantitative match forecasts for the Ghana Premier League, covering Kumasi Asante Kotoko, Accra Hearts of Oak, FC Samartex, Medeama SC, and Berekum Chelsea with low-scoring Under 2.5 Goals and Home 1X2 statistical models.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="Ghana" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
