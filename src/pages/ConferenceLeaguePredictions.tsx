import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Trophy, Globe2 } from 'lucide-react';

export default function ConferenceLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="UEFA Conference League Predictions & AI Betting Tips"
        description="UEFA Conference League predictions today. Thursday European night match previews, Poisson win percentages, and high-value underdog tips for all league phase and knockout fixtures."
        canonical="/conference-league-predictions"
        keywords="conference league predictions today, uefa conference league tips, conference league betting picks, uecl predictions, thursday football tips"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <Breadcrumbs className="mb-6" />
        <div className="text-center mb-10 space-y-3">
          <Badge className="bg-lime-600/15 text-lime-600 dark:text-lime-400 border-lime-600/30 font-bold px-4 py-1.5">
            🏆 UEFA Conference League
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Conference League Predictions 2026/27
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            AI match predictions for UEFA&apos;s newest continental club tournament. Modeling cross-border travel fatigue, squad rotation dynamics, and high-scoring knockout football every Thursday.
          </p>
        </div>

        <PredictionsDashboard initialLeague="Conference League" />

        {/* UECL Insights Box */}
        <section className="mt-12 bg-card border rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-lime-500" /> Key Conference League Angles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground leading-relaxed pt-1">
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Squad Rotation Reality</strong>
              Top 5 European league clubs frequently rest key starters in the group phase, boosting underdog Asian Handicap cover rates to 58%.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Eastern European Travel Distance</strong>
              Long-haul flights to Kazakhstan, Azerbaijan, or Scandinavia result in noticeable second-half defensive regression for visiting sides.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">High Goal Expectancy (xG)</strong>
              With wider talent disparities between domestic champions, Conference League fixtures average 3.02 goals per match.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
