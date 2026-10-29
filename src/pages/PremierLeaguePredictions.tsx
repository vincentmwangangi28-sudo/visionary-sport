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
      <main className="container mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 pb-20 space-y-5">
        <Breadcrumbs />

        {/* Clean Competition Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <span>England · Tier 1</span>
              <span>·</span>
              <span className="text-muted-foreground">38 Matchweeks · 380 Fixtures</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              English Premier League Forecasts &amp; xG Previews
            </h1>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Matchday 1X2 probabilities, Bivariate Poisson scoreline distributions, and Expected Goals (xG) form guides across all 20 Premier League clubs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link to="/standings?league=39">
              <Button size="sm" className="h-9 text-xs font-bold">
                View EPL Table &amp; xPTS
              </Button>
            </Link>
            <Link to="/h2h">
              <Button variant="outline" size="sm" className="h-9 text-xs font-semibold">
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
