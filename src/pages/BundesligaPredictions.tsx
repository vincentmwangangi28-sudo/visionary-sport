import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function BundesligaPredictions() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Bundesliga Predictions 2025/26 | Free AI Tips | PredictPro"
        description="Free Bundesliga predictions for 2025/26. AI tips for Bayer Leverkusen, Bayern Munich, Dortmund and all 18 Bundesliga clubs."
        canonical="/bundesliga-predictions"
        keywords="Bundesliga predictions today, German football tips, Leverkusen prediction, Bayern Munich tips, Dortmund prediction Bundesliga"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-8 max-w-5xl">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-black text-white px-4 py-1.5">🇩🇪 Bundesliga</Badge>
          <h1 className="text-4xl font-black mb-3">Bundesliga Predictions 2025/26</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Free Bundesliga predictions for 2025/26. AI tips for Bayer Leverkusen, Bayern Munich, Dortmund and all 18 Bundesliga clubs.</p>
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
