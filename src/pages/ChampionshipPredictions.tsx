import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, ShieldCheck } from 'lucide-react';

export default function ChampionshipPredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="English Championship Predictions & AI Betting Tips 2026/27"
        description="EFL Championship predictions today. Free AI betting tips, promotion xG stats, and Asian Handicap analysis for Leeds, Sunderland, and Sheffield United."
        canonical="/championship-predictions"
        keywords="championship predictions today, efl championship betting tips, english championship tips, leeds united predictions, championship acca tips"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <Breadcrumbs className="mb-6" />
        <div className="text-center mb-10 space-y-3">
          <Badge className="bg-amber-600/15 text-amber-600 dark:text-amber-400 border-amber-600/30 font-bold px-4 py-1.5">
            🏴󠁧󠁢󠁥󠁮󠁧󠁿 English EFL Championship
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Championship Predictions 2026/27
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Free mathematical predictions for the most competitive second tier in world football. Powered by Dixon-Coles Poisson simulations, squad depth indices, and travel turnaround models across all 46 matchweeks.
          </p>
        </div>

        <PredictionsDashboard initialLeague="Championship" />

        {/* Championship Insights Box */}
        <section className="mt-12 bg-card border rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> EFL Championship Tactical Trends
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground leading-relaxed pt-1">
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">46-Game Schedule Fatigue</strong>
              Midweek Tuesday/Wednesday fixtures historically see a 14% drop in second-half pressing intensity and increased late goals.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Draw Density in Relegation Fights</strong>
              Teams in positions 18 through 22 draw approximately 31% of their home fixtures between February and May.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Parachute Payment Advantage</strong>
              Clubs recently relegated from the Premier League boast an average +0.42 xG differential against non-parachute sides.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
