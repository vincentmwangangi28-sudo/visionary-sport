import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function BundesligaPredictions() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="German Bundesliga Predictions: Bayern, Dortmund & xG Odds"
        description="Tactical German Bundesliga match previews, Over 2.5 goals trends, and Poisson win probabilities for Bayern Munich, Dortmund, Leverkusen, and RB Leipzig."
        canonical="/bundesliga-predictions"
        keywords="bundesliga predictions today, german football betting tips, bayern dortmund odds, bayer leverkusen tips, bundesliga over 2.5"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs />

        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span>Germany · Bundesliga</span>
              <span>·</span>
              <span>34 Matchweeks · 306 Fixtures</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              German Bundesliga Predictions &amp; Goal Expectancy
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              High-tempo transition metrics, Over 2.5 &amp; BTTS probabilities, and 1X2 forecasts for Bayern Munich, Bayer Leverkusen, Borussia Dortmund, and RB Leipzig.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {["Bayern Munich", "Bayer Leverkusen", "Borussia Dortmund", "RB Leipzig", "VfB Stuttgart", "Eintracht Frankfurt"].map((club) => (
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
            <Link to="/standings?league=78">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                View Bundesliga Table &amp; xPTS
              </Button>
            </Link>
            <Link to="/btts">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                BTTS &amp; Over 2.5 Hub
              </Button>
            </Link>
          </div>
        </div>

        <PredictionsDashboard initialLeague="Bundesliga" />
      </main>
      <Footer />
    </div>
  );
}
