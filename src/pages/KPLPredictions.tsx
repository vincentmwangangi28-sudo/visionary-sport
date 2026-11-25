import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { TeamNewsInjuryUpdates } from "@/components/TeamNewsInjuryUpdates";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function KPLPredictions() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="FKF Kenya Premier League (KPL) AI Predictions & Tips"
        description="FKF Kenya Premier League football predictions. Mashemeji derby analytics, home altitude factor modeling, and daily banker tips."
        canonical="/kpl-predictions"
        keywords="kpl predictions today, kenya premier league tips, gor mahia vs afc leopards, tusker fc tips, football predictions kenya"
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs />

        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span>Kenya · FKF Premier League</span>
              <span>·</span>
              <span>18 Clubs · East Africa Tier 1</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kenya Premier League (KPL) Predictions &amp; Match Previews
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Matchday 1X2 probabilities, altitude-adjusted home advantage metrics, and low-scoring under/over models for Gor Mahia, AFC Leopards, Tusker FC, Kenya Police, and Bandari.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {["Gor Mahia", "AFC Leopards", "Tusker FC", "Kenya Police", "Bandari", "KCB", "Ulinzi Stars"].map((club) => (
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
            <Link to="/standings?league=276">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                View KPL Standings
              </Button>
            </Link>
            <Link to="/jackpot-predictions">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                17-Game Jackpot Hub
              </Button>
            </Link>
          </div>
        </div>

        <PredictionsDashboard initialLeague="KPL" />

        <div className="pt-2">
          <TeamNewsInjuryUpdates leagueFilter="KPL" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border shadow-none">
            <CardContent className="p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Kenya FKF Premier League · Official Standings
              </span>
              <h2 className="text-base font-bold">Live FKF Premier League Table &amp; Form Tracker</h2>
              <p className="text-xs text-muted-foreground">
                Track points, goal difference, home altitude form, and qualification race across all 18 FKF Premier League clubs.
              </p>
              <Link
                to="/standings?league=276"
                className="inline-block text-xs font-bold text-primary hover:underline pt-1"
              >
                Open Live KPL Standings Table →
              </Link>
            </CardContent>
          </Card>
          <Card className="border-border shadow-none">
            <CardContent className="p-5 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                East Africa CECAFA · Weekly Multi-Leg Coupons
              </span>
              <h2 className="text-base font-bold">SportPesa Mega &amp; Midweek Jackpot Projections</h2>
              <p className="text-xs text-muted-foreground">
                Explore Bivariate Poisson 1X2 probabilities, double chance coverage, and banker picks across weekly East African jackpot coupons.
              </p>
              <Link
                to="/jackpot-predictions"
                className="inline-block text-xs font-bold text-primary hover:underline pt-1"
              >
                Open 17-Game Jackpot Hub →
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
