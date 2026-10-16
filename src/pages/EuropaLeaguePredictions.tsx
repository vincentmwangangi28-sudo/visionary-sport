import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';

export default function EuropaLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="UEFA Europa League Predictions & Conference League AI Odds"
        description="Expert AI predictions for UEFA Europa League and Conference League fixtures. Matchweek win probabilities, knockout progression odds, and Thursday banker tips."
        canonical="/europa-league-predictions"
        keywords="europa league predictions today, uefa europa league tips, conference league predictions, thursday football tips, europa league winner odds"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <Breadcrumbs className="mb-6" />
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-orange-600 text-white px-4 py-1.5 font-bold">
            🏆 UEFA Europa League &amp; Conference League
          </Badge>
          <h1 className="text-4xl font-black mb-3">Europa League AI Predictions</h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
            Free mathematical predictions for every UEFA Europa League and Conference League matchday. Analyzed by Bivariate Poisson distributions, travel fatigue modeling, and knockout squad rotation metrics.
          </p>
        </div>
        <PredictionsDashboard initialLeague="Europa League" />
      </main>
      <Footer />
    </div>
  );
}
