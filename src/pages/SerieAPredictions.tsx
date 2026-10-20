import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function SerieAPredictions() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Italian Serie A Predictions: Tactical Low-Block & xGA Tips"
        description="Italian Serie A analytical previews targeting defensive xGA regression, Draw No Bet value lines, and derby odds for Inter, Milan, Juventus, and Napoli."
        canonical="/serie-a-predictions"
        keywords="serie a predictions today, italian football tips, inter milan vs ac milan odds, juventus prediction, serie a betting tips"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs />

        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span>Italy · Lega Serie A</span>
              <span>·</span>
              <span>38 Matchweeks · 380 Fixtures</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Italian Serie A Predictions &amp; Tactical Previews
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Defensive xGA metrics, low-block scoreline matrices, and 1X2 probabilities for Inter Milan, AC Milan, Juventus, Napoli, Atalanta, and Roma.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {["Inter Milan", "AC Milan", "Juventus", "Napoli", "Atalanta", "AS Roma", "Lazio", "Fiorentina"].map((club) => (
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
            <Link to="/standings?league=135">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                View Serie A Table &amp; xPTS
              </Button>
            </Link>
            <Link to="/h2h">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                Serie A H2H Simulator
              </Button>
            </Link>
          </div>
        </div>

        <PredictionsDashboard initialLeague="Serie A" />
      </main>
      <Footer />
    </div>
  );
}
