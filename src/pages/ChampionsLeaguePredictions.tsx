import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ChampionsLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="UEFA Champions League Predictions: 36-Team Swiss Phase Odds"
        description="Statistical forecasting for the UEFA Champions League. Matchweek win probabilities, knockout qualification matrices, and European banker picks."
        canonical="/champions-league-predictions"
        keywords="champions league predictions today, ucl betting tips, uefa champions league picks, ucl winner odds, champions league accumulator"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs />

        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span>UEFA · European Club Championship</span>
              <span>·</span>
              <span>36-Team League Phase &amp; Knockouts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              UEFA Champions League Predictions &amp; Matchweek Previews
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Matchweek 1X2 probabilities, cross-league Expected Goals (xG) adjustments, and qualification projections for Europe's premier club competition.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {["Real Madrid", "Man City", "Bayern Munich", "Arsenal", "Liverpool", "Inter Milan", "Barcelona", "PSG"].map((club) => (
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
            <Link to="/standings?league=2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                View UCL Standings
              </Button>
            </Link>
            <Link to="/accumulator">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                Build UCL Acca Slip
              </Button>
            </Link>
          </div>
        </div>

        <PredictionsDashboard initialLeague="Champions League" />
      </main>
      <Footer />
    </div>
  );
}
