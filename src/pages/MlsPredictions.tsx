import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SEOAuthorityHub } from '@/components/SEOAuthorityHub';
import { Link } from 'react-router-dom';

export default function MlsPredictions() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <SEO
        title="MLS Predictions Today: Inter Miami, LAFC & Major League Soccer Tips"
        description="Free Major League Soccer (MLS) predictions today. Get Over 2.5 goals, BTTS, and 1X2 picks for Inter Miami, LA Galaxy, LAFC, and Columbus Crew."
        keywords="mls predictions today, major league soccer betting tips, inter miami prediction today, mls over 2.5 goals tips, mls parlay picks"
        canonicalPath="/mls-predictions"
      />
      <Navbar />
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-24 md:pb-12 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions', href: '/' },
            { label: 'MLS Predictions (Major League Soccer)' },
          ]}
        />

        {/* Dark Broadcast League Header */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                United States &amp; Canada · Eastern &amp; Western Conferences
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400">2026 Regular Season &amp; MLS Cup</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Major League Soccer (MLS) Predictions, xG &amp; Over 2.5 Goals Hub
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Because MLS clubs allocate Designated Player (DP) salary budgets heavily toward attacking stars, Major League Soccer consistently ranks top-3 globally for Both Teams to Score (61%+) and Over 2.5 Goals.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/standings?league=MLS"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
            >
              MLS Table
            </Link>
            <Link
              to="/over-under-predictions"
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors"
            >
              Over 2.5 Radar
            </Link>
          </div>
        </div>

        <PredictionsDashboard defaultLeague="MLS" />
        <SEOAuthorityHub />
      </main>
      <Footer />
    </div>
  );
}
