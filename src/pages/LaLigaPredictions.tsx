import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function LaLigaPredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="La Liga Predictions 2025/26 | Free AI Tips | PredictPro"
        description="Free La Liga predictions for 2025/26. AI tips for Real Madrid, Barcelona, Atletico Madrid and every Primera Division match."
        canonical="/la-liga-predictions"
        keywords="La Liga predictions today, Spanish football tips, Real Madrid prediction, Barcelona tips, Atletico Madrid La Liga prediction"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-red-600 text-white px-4 py-1.5">🇪🇸 La Liga</Badge>
          <h1 className="text-4xl font-black mb-3">La Liga Predictions 2025/26</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Free La Liga predictions for 2025/26. AI tips for Real Madrid, Barcelona, Atletico Madrid and every Primera Division match.</p>
        </div>
        <PredictionsDashboard />
        <div className="mt-10 p-6 bg-muted/30 rounded-xl">
          <h3 className="font-semibold mb-4">More Predictions</h3>
          <div className="flex flex-wrap gap-2">
            {[
              {to:'/best-bets',l:'Best Bets Today'},
              {to:'/value-bets',l:'Value Bets'},
              {to:'/correct-score',l:'Correct Score'},
              {to:'/btts',l:'BTTS Tips'},
              {to:'/accumulator',l:'Acca Builder'},
              {to:'/world-cup-predictions',l:'World Cup 2026'},
            ].map(link=><Link key={link.to} to={link.to}><Button variant="outline" size="sm">{link.l}</Button></Link>)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
