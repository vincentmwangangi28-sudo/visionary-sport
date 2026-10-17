import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Trophy } from 'lucide-react';

export default function PrimeiraLigaPredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Portuguese Primeira Liga Predictions: Benfica, Sporting CP & Porto"
        description="Portuguese Primeira Liga AI predictions today. Verified win probabilities, handicap picks, and clean sheet stats for Sporting CP, Benfica, and Porto."
        canonical="/primeira-liga-predictions"
        keywords="primeira liga predictions, portuguese league betting tips, sporting cp prediction, benfica odds, fc porto betting picks, liga portugal tips"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <Breadcrumbs className="mb-6" />
        <div className="text-center mb-10 space-y-3">
          <Badge className="bg-red-600/15 text-red-600 dark:text-red-400 border-red-600/30 font-bold px-4 py-1.5">
            🇵🇹 Portuguese Primeira Liga
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Primeira Liga Predictions 2026/27
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            AI match previews and Poisson probabilities for Portugal&apos;s top flight. Analyzing the &ldquo;Os Três Grandes&rdquo; (Benfica, Sporting CP, and FC Porto) dominance, disciplined defensive records, and European qualification battles.
          </p>
        </div>

        <PredictionsDashboard initialLeague="Primeira Liga" />

        {/* Primeira Liga Insights Box */}
        <section className="mt-12 bg-card border rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-red-500" /> Liga Portugal Strategic Betting Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground leading-relaxed pt-1">
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Big Three Fortress Form</strong>
              Sporting CP, Benfica, and Porto combine for over 82% home win rates across domestic league fixtures.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">High Foul & Booking Rates</strong>
              Portuguese football matches average 4.8 cards per game—making Asian Cards and Over 4.5 Bookings lucrative secondary markets.
            </div>
            <div className="p-4 bg-muted/40 rounded-xl border space-y-1">
              <strong className="text-foreground block font-bold text-sm">Under 2.5 in Mid-Table Clashes</strong>
              Outside the top 4 clubs, mid-table Portuguese clashes feature compact defenses that average just 2.18 goals per game.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
