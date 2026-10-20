import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Ligue1Predictions() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="French Ligue 1 Predictions: PSG, Marseille & xG Odds"
        description="French Ligue 1 football predictions. Comprehensive Expected Goals (xG) projections, BTTS probabilities, and value betting tips for PSG, Marseille, and Monaco."
        canonical="/ligue-1-predictions"
        keywords="ligue 1 predictions today, french football tips, psg prediction, marseille odds, ligue 1 betting picks, monaco xg predictions"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs />

        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span>France · Ligue 1</span>
              <span>·</span>
              <span>34 Matchweeks · 306 Fixtures</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              French Ligue 1 Predictions &amp; xG Previews
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Statistical match previews, Asian Handicap lines, and Expected Goals (xG) statistics for Paris Saint-Germain, Marseille, Monaco, Lille, and Lyon.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {["Paris Saint-Germain", "Marseille", "AS Monaco", "Lille", "Lyon", "Nice", "Lens"].map((club) => (
                <span
                  key={club}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-200"
                >
                  {club}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link to="/standings?league=61">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                View Ligue 1 Table &amp; xPTS
              </Button>
            </Link>
            <Link to="/screener">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                Statistical Screener
              </Button>
            </Link>
          </div>
        </div>

        <PredictionsDashboard initialLeague="Ligue 1" />
      </main>
      <Footer />
    </div>
  );
}
