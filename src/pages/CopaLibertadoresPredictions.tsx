import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy } from 'lucide-react';

export default function CopaLibertadoresPredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Copa Libertadores AI Predictions: South American Odds & Tips"
        description="CONMEBOL Copa Libertadores predictions today. Accurate AI tips, home altitude advantage adjustments, and match previews for Flamengo, Palmeiras, River Plate, and Boca Juniors."
        canonical="/copa-libertadores-predictions"
        keywords="copa libertadores predictions today, libertadores tips, flamengo prediction, river plate odds, conmebol betting picks, south american football tips"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <Breadcrumbs className="mb-6" />
        <div className="text-center mb-10 space-y-3">
          <Badge className="bg-yellow-600/15 text-yellow-600 dark:text-yellow-400 border-yellow-600/30 font-bold px-4 py-1.5">
            🏆 CONMEBOL Copa Libertadores
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Copa Libertadores Predictions 2026/27
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            South America&apos;s most passionate football competition. Advanced AI modeling incorporating extreme altitude variables (La Paz, Quito), hostile stadium atmospheres, and Brazilian vs Argentine tactical dynamics.
          </p>
        </div>

        <PredictionsDashboard initialLeague="Copa Libertadores" />

        {/* Libertadores Insights Box */}
        <section className="mt-12 bg-card border rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-yellow-500" /> South American Continental Betting Dynamics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground leading-relaxed pt-1">
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Altitude Factor (3,600m+)</strong>
              Clubs playing at extreme elevation in Bolivia and Ecuador enjoy an 18% higher home win rate against sea-level Brazilian opponents.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Card Volatility</strong>
              Libertadores knockout matches average 6.2 cards per fixture, making Asian Over 5.5 Cards a proven high-edge betting market.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Brazilian Financial Dominance</strong>
              Brazilian Serie A clubs have claimed 6 consecutive titles due to deep squad valuations and tactical European coaches.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
