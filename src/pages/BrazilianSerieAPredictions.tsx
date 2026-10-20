import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PredictionsDashboard } from '@/components/PredictionsDashboard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Link } from 'react-router-dom';

export default function BrazilianSerieAPredictions() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Brazilian Serie A (Brasileirão) Football Predictions: Flamengo, Palmeiras & Botafogo',
    description:
      'Daily Brasileirão Serie A football predictions, 1X2 home advantage probabilities, Under/Over 2.5 goals, and BTTS tips across Brazil’s top flight.',
    url: 'https://predictpro.guru/brazilian-serie-a-predictions',
    creator: {
      '@type': 'Organization',
      name: 'PredictPro',
      url: 'https://predictpro.guru',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground justify-between">
      <SEO
        title="Brazilian Serie A Predictions Today: Brasileirão Tips & Odds"
        description="Free Brazilian Serie A (Brasileirão) football predictions today. Get home-advantage 1X2 picks, BTTS, and xG forecasts for Palmeiras, Flamengo & Botafogo."
        canonical="/brazilian-serie-a-predictions"
        keywords="brazilian serie a predictions, brasileirao predictions today, brazil serie a betting tips, flamengo prediction, palmeiras betting tips"
        jsonLd={jsonLd}
      />
      <Navbar />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Predictions Hub', href: '/' },
            { label: 'Brazilian Serie A Predictions' },
          ]}
        />

        {/* Dark Broadcast League Header */}
        <section className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Brazil · Brasileirão Série A
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] font-mono text-slate-400">
                51% Home Win Advantage
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Brazilian Serie A (Brasileirão) Football Predictions &amp; xG Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Long domestic flight distances and Copa Libertadores squad rotation make the <strong className="text-white">Brasileirão Série A</strong> one of the strongest home-advantage leagues in world football, led by <strong className="text-white">Flamengo, Palmeiras, Botafogo, São Paulo, and Corinthians</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/copa-libertadores-predictions"
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
            >
              Copa Libertadores
            </Link>
            <Link
              to="/standings"
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors"
            >
              League Tables
            </Link>
          </div>
        </section>

        <PredictionsDashboard defaultLeague="Brasileirão" />
      </main>

      <Footer />
    </div>
  );
}
