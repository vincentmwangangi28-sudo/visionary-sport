import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';

export default function Ligue1Predictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="French Ligue 1 AI Predictions: PSG, Marseille & xG Odds"
        description="French Ligue 1 football predictions. Comprehensive Expected Goals (xG) projections, BTTS probabilities, and value betting tips for PSG, Marseille, and Monaco."
        canonical="/ligue-1-predictions"
        keywords="ligue 1 predictions today, french football tips, psg prediction, marseille odds, ligue 1 betting picks, monaco xg predictions"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <Breadcrumbs className="mb-6" />
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-emerald-700 text-white px-4 py-1.5 font-bold">
            🇫🇷 French Ligue 1
          </Badge>
          <h1 className="text-4xl font-black mb-3">Ligue 1 Predictions 2026/27</h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
            Free mathematical predictions for French Ligue 1 McDonald’s fixtures. AI-driven match previews, Asian Handicap analysis, and Expected Goals (xG) statistics for PSG, Marseille, Lyon, Monaco, and Lille.
          </p>
        </div>
        <PredictionsDashboard initialLeague="Ligue 1" />
      </main>
      <Footer />
    </div>
  );
}
