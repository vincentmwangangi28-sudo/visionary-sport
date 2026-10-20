import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Link } from 'react-router-dom';

export default function SaudiProLeaguePredictions() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Saudi Pro League (Roshn SPL) Football Predictions: Al-Hilal, Al-Nassr & Al-Ittihad',
    description:
      'Daily Saudi Pro League (SPL) football predictions, Over 2.5 goals probabilities, BTTS tips, and xG forecasts for Al-Hilal, Al-Nassr, Al-Ittihad, and Al-Ahli.',
    url: 'https://predictpro.guru/saudi-pro-league-predictions',
    creator: {
      '@type': 'Organization',
      name: 'PredictPro',
      url: 'https://predictpro.guru',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground justify-between">
      <SEO
        title="Saudi Pro League Predictions Today: Al-Hilal, Al-Nassr & SPL Tips"
        description="Free Saudi Pro League (Roshn SPL) football predictions today. Over 2.5 goals, BTTS, and Asian Handicap picks for Al-Hilal, Al-Nassr & Al-Ittihad."
        canonical="/saudi-pro-league-predictions"
        keywords="saudi pro league predictions, spl predictions today, al nassr prediction today, al hilal betting tips, saudi league over 2.5 goals"
        structuredData={jsonLd}
      />
      <Navbar />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Saudi Pro League Predictions' },
          ]}
        />

        {/* Dark Broadcast League Header */}
        <section className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Saudi Arabia · Roshn Saudi Pro League
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400">
                3.18 Avg Goals / Match
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Saudi Pro League (SPL) Predictions &amp; Goal Market Tips
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              The Roshn Saudi Pro League features one of the largest attacking xG disparities in world football between the top four clubs (<strong className="text-white">Al-Hilal, Al-Nassr, Al-Ittihad, Al-Ahli</strong>) and mid-table sides—making Over 2.5 Goals and -1.5 Asian Handicap markets prime statistical targets.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/asian-handicap-predictions"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
            >
              Asian Handicap
            </Link>
            <Link
              to="/over-under-predictions"
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors"
            >
              Over 2.5 Radar
            </Link>
          </div>
        </section>

        <PredictionsDashboard defaultLeague="Saudi Pro League" />
      </main>

      <Footer />
    </div>
  );
}
