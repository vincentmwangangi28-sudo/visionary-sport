import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Flame, Trophy } from 'lucide-react';

export default function EredivisiePredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Dutch Eredivisie AI Predictions: Ajax, PSV, Feyenoord & xG Tips"
        description="Free Dutch Eredivisie predictions today. High-scoring Over 2.5 goals models, BTTS probabilities, and Asian Handicap picks for Ajax, PSV, and Feyenoord."
        canonical="/eredivisie-predictions"
        keywords="eredivisie predictions today, dutch league betting tips, psv predictions, ajax amsterdam tips, feyenoord xg predictions, eredivisie over 2.5"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <Breadcrumbs className="mb-6" />
        <div className="text-center mb-10 space-y-3">
          <Badge className="bg-orange-600/15 text-orange-600 dark:text-orange-400 border-orange-600/30 font-bold px-4 py-1.5">
            🇳🇱 Dutch Eredivisie
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Eredivisie Predictions 2026/27
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Europe&apos;s premier high-scoring league. Mathematical models optimized for high total match goals, Both Teams to Score (GG), and dominant home attacking pace for PSV, Ajax, Feyenoord, and Twente.
          </p>
        </div>

        <PredictionsDashboard initialLeague="Eredivisie" />

        {/* Eredivisie Insights Box */}
        <section className="mt-12 bg-card border rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Eredivisie Goal Scoring Characteristics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground leading-relaxed pt-1">
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">3.15 Average Goals Per Match</strong>
              Eredivisie ranks among the top 3 highest-scoring leagues worldwide, with Over 2.5 hitting in ~61% of all fixtures.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Dominant High-Pressing</strong>
              Dutch tactical philosophy prioritizes attacking buildup over low-block containment, creating abundant transition chances.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Artificial Turf Factoring</strong>
              Several Dutch clubs feature synthetic pitches which measurably increase ball speed and short-pass passing completion rates.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
