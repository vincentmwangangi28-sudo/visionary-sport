import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FAQ = [
  {
    q: "How are Premier League match probabilities calculated?",
    a: "Match probabilities combine rolling 10-match Expected Goals (xG) differentials, home/away venue splits, head-to-head histories, and confirmed squad availability across all 20 Premier League clubs.",
  },
  {
    q: "Are Premier League predictions and xG tables free?",
    a: "Yes — 100% of PredictPro's Premier League match previews, Correct Score matrices, Expected Goals (xG) projections, and H2H comparisons are completely free.",
  },
  {
    q: "Which Premier League fixtures have higher variance?",
    a: "Local derbies (Arsenal vs Tottenham, Liverpool vs Everton, Manchester Derby) and fixtures immediately following midweek UEFA Champions League travel carry wider scoreline variance.",
  },
  {
    q: "How often are Premier League odds and tips updated?",
    a: "Matchday probabilities and bookmaker value edges (+EV) are refreshed daily at 06:00 UTC and recalculated whenever line movements or team news occur.",
  },
];

export default function PremierLeaguePredictions() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <SEO
        title="Premier League Score Predictor & EPL Predictions Today | PredictPro"
        description="Free Premier League predictions for today's matches. Expected goals (xG), H2H stats, and value bets for Arsenal, Man City, Liverpool, and Chelsea."
        canonical="/premier-league-predictions"
        keywords="barclays premier league score predictor, Premier League predictions today, EPL score predictor, Premier League tips today, Arsenal predictions, Man City tips, Liverpool predictions, Chelsea prediction"
        structuredData={{
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <Navbar />
      <main className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 py-8 pb-20 md:pb-12 space-y-6">
        <Breadcrumbs />

        {/* Dark Broadcast Competition Header */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span>England · Tier 1</span>
              <span>·</span>
              <span>38 Matchweeks · 380 Fixtures</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              English Premier League Predictions &amp; xG Previews
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Matchday 1X2 probabilities, Expected Goals (xG) form guides, and bookmaker value edges across all 20 Premier League clubs.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {["Arsenal", "Man City", "Liverpool", "Chelsea", "Tottenham", "Aston Villa", "Newcastle", "Man United"].map((club) => (
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
            <Link to="/standings?league=39">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                View EPL Table &amp; xPTS
              </Button>
            </Link>
            <Link to="/h2h">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              >
                Club H2H Simulator
              </Button>
            </Link>
          </div>
        </div>

        <PredictionsDashboard initialLeague="Premier League" />

        {/* FAQ for SEO */}
        <section className="pt-6 border-t border-border">
          <h2 className="text-lg font-bold mb-4">Premier League Analytical FAQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQ.map((f, i) => (
              <Card key={i} className="border-border shadow-none">
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm mb-1.5">{f.q}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
