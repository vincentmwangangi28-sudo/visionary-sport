import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Link } from 'react-router-dom';

export default function EuropaLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="UEFA Europa League Predictions & Conference League Odds"
        description="Statistical predictions for UEFA Europa League and Conference League fixtures. Matchweek win probabilities, knockout progression odds, and Thursday tips."
        canonical="/europa-league-predictions"
        keywords="europa league predictions today, uefa europa league tips, conference league predictions, thursday football tips, europa league winner odds"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs className="mb-1" />

        {/* Dark Broadcast League Header */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                UEFA Club Competitions · Thursday Matchday Hub
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400">Europa League &amp; Conference League</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              UEFA Europa League Predictions &amp; Knockout xG Models
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Mathematical predictions for every UEFA Europa League and Conference League matchday, factoring Bivariate Poisson distributions, Thursday-to-Sunday travel fatigue, and knockout squad rotation.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/champions-league-predictions"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
            >
              Champions League
            </Link>
            <Link
              to="/accumulator"
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors"
            >
              Thursday Acca
            </Link>
          </div>
        </div>

        <PredictionsDashboard initialLeague="Europa League" />
      </main>
      <Footer />
    </div>
  );
}
