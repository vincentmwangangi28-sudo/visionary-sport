import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LeagueNavigationStrip } from '@/components/LeagueNavigationStrip';
import { MarketQuickStrip } from '@/components/MarketQuickStrip';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';

export default function CafChampionsLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="CAF Champions League Predictions Today: Al Ahly, Sundowns & Esperance"
        description="Free CAF Champions League & Confederation Cup AI football predictions today. Group stage & knockout xG models for Al Ahly, Mamelodi Sundowns, Esperance, Simba SC, and Orlando Pirates."
        keywords="caf champions league predictions today, al ahly prediction, mamelodi sundowns prediction, caf confederation cup tips, african champions league odds"
        canonical="/caf-champions-league-predictions"
      />
      <Navbar />
      <LeagueNavigationStrip />
      <MarketQuickStrip />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'CAF Champions League Predictions' },
          ]}
        />
        <section className="rounded-2xl border border-emerald-500/25 bg-card/70 p-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            CAF Champions League &amp; Confederation Cup AI Predictions
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Continental club football across Africa demands specialized travel-fatigue, altitude, and home-fortress xG calibration. Track daily predictions for Al Ahly SC, Mamelodi Sundowns, Espérance de Tunis, TP Mazembe, Young Africans, Simba SC, and Orlando Pirates.
          </p>
        </section>
        <PredictionsDashboard defaultLeague="CAF Champions League" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
