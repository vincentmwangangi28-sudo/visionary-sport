import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EredivisiePredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="Dutch Eredivisie Predictions: Ajax, PSV, Feyenoord & xG Tips"
        description="Free Dutch Eredivisie predictions today. High-scoring Over 2.5 goals models, BTTS probabilities, and Asian Handicap picks for Ajax, PSV, and Feyenoord."
        canonical="/eredivisie-predictions"
        keywords="eredivisie predictions today, dutch league betting tips, psv predictions, ajax amsterdam tips, feyenoord xg predictions, eredivisie over 2.5"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs className="mb-1" />

        {/* Dark Broadcast League Header */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Netherlands · Top Flight Division
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400">3.15 Avg Goals / Match</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Dutch Eredivisie Predictions, xG &amp; Over 2.5 Goals Hub
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Europe&apos;s premier high-scoring league. Mathematical models optimized for total match goals, Both Teams to Score (GG), and dominant home attacking pace for PSV, Ajax, Feyenoord, and Twente.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/standings?league=Eredivisie"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
            >
              Eredivisie Table
            </Link>
            <Link
              to="/over-under-predictions"
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors"
            >
              Over 2.5 Goals
            </Link>
          </div>
        </div>

        <PredictionsDashboard initialLeague="Eredivisie" />

        {/* Eredivisie Insights Box */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <Flame className="w-5 h-5 text-emerald-500" /> Eredivisie Goal Scoring Characteristics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground leading-relaxed">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/70 space-y-1">
              <strong className="text-foreground block font-bold text-sm">3.15 Average Goals Per Match</strong>
              Eredivisie ranks among the top 3 highest-scoring leagues worldwide, with Over 2.5 hitting in ~61% of all fixtures.
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/70 space-y-1">
              <strong className="text-foreground block font-bold text-sm">Dominant High-Pressing</strong>
              Dutch tactical philosophy prioritizes attacking buildup over low-block containment, creating abundant transition chances.
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-border/70 space-y-1">
              <strong className="text-foreground block font-bold text-sm">Fast Surface Tempo</strong>
              Several Dutch venues feature fast hybrid surfaces that measurably increase ball speed and final-third entry rates.
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
