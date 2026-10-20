import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LaLigaPredictions() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Spanish La Liga Predictions: Real Madrid, Barca & El Clasico"
        description="Deep statistical La Liga football predictions. Attacking xG metrics, Asian Handicap lines, and 1X2 picks for Real Madrid, Barcelona, and Atletico Madrid."
        canonical="/la-liga-predictions"
        keywords="la liga predictions today, spanish football tips, real madrid vs barcelona prediction, el clasico odds, la liga betting tips"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs />

        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span>Spain · Primera División</span>
              <span>·</span>
              <span>38 Matchweeks · 380 Fixtures</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Spanish LaLiga Predictions &amp; Match Previews
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Expected Goals (xG) projections, Asian Handicap lines, and 1X2 probabilities for Real Madrid, Barcelona, Atlético Madrid, and all 20 Primera División clubs.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {["Real Madrid", "Barcelona", "Atlético Madrid", "Athletic Club", "Real Sociedad", "Villarreal", "Real Betis", "Girona"].map((club) => (
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
            <Link to="/standings?league=140">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                View LaLiga Table &amp; xPTS
              </Button>
            </Link>
            <Link to="/h2h">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                El Clásico H2H Simulator
              </Button>
            </Link>
          </div>
        </div>

        <PredictionsDashboard initialLeague="La Liga" />
      </main>
      <Footer />
    </div>
  );
}
