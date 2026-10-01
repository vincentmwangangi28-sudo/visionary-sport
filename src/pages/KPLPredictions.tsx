import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { TeamNewsInjuryUpdates } from "@/components/TeamNewsInjuryUpdates";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function KPLPredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="KPL Predictions Today | Free AI Tips | PredictPro"
        description="Free Kenya Premier League (KPL) predictions. AI tips for Gor Mahia, AFC Leopards, Tusker FC, Bandari. Pay with M-Pesa."
        canonical="/kpl-predictions"
        keywords="KPL predictions today, Kenya Premier League tips, Gor Mahia prediction, AFC Leopards tips, Tusker FC prediction, KPL betting tips Kenya"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <Breadcrumbs className="mb-6" />
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-red-700 text-white px-4 py-1.5">🇰🇪 Kenya Premier League</Badge>
          <h1 className="text-4xl font-black mb-3">KPL Predictions Today</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Free Kenya Premier League (KPL) predictions. AI tips for Gor Mahia, AFC Leopards, Tusker FC, Bandari. Pay with M-Pesa.</p>
        </div>
        <PredictionsDashboard initialLeague="KPL" />

        <div className="mt-10">
          <TeamNewsInjuryUpdates leagueFilter="KPL" />
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/70">
            <CardContent className="p-5 space-y-2">
              <Badge variant="secondary" className="text-[11px] font-bold">🇰🇪 Kenya FKF Premier League</Badge>
              <h2 className="text-base font-bold">Gor Mahia vs AFC Leopards (Mashemeji Derby)</h2>
              <p className="text-xs text-muted-foreground">
                Full Bivariate Poisson scoreline probabilities, Expected Goals (xG) form, and head-to-head statistical breakdown.
              </p>
              <Link to="/predict/gor-mahia-vs-afc-leopards" className="inline-block text-xs font-bold text-primary hover:underline pt-1">
                View Mashemeji Derby AI Prediction →
              </Link>
            </CardContent>
          </Card>
          <Card className="border-border/70">
            <CardContent className="p-5 space-y-2">
              <Badge variant="secondary" className="text-[11px] font-bold">🇹🇿 Tanzania NBC Premier League</Badge>
              <h2 className="text-base font-bold">Simba SC vs Young Africans (Kariakoo Derby)</h2>
              <p className="text-xs text-muted-foreground">
                East African CECAFA flagship clash with AI 1X2 banker confidence, BTTS probabilities, and exact score matrix.
              </p>
              <Link to="/predict/simba-sc-vs-young-africans" className="inline-block text-xs font-bold text-primary hover:underline pt-1">
                View Kariakoo Derby AI Prediction →
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-muted/30 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Continental &amp; Global Prediction Hubs</h2>
          <div className="flex flex-wrap gap-2">
            {[
              {to:'/afcon-predictions',l:'🌍 All-Africa & AFCON Hub (54 Nations)'},
              {to:'/jackpot-predictions',l:'🏆 17-Game Mega Jackpots'},
              {to:'/best-bets',l:'Best Bets Today'},
              {to:'/value-bets',l:'Value Bets'},
              {to:'/correct-score',l:'Correct Score'},
              {to:'/btts',l:'BTTS Tips'},
              {to:'/accumulator',l:'Acca Builder'},
              {to:'/world-cup-predictions',l:'World Cup 2026'},
            ].map(link=><Link key={link.to} to={link.to}><Button variant="outline" size="sm" className="min-h-[44px]">{link.l}</Button></Link>)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
