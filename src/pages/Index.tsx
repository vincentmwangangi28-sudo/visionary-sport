import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { LiveLeagueTicker } from "@/components/LiveLeagueTicker";
import { LiveMatches } from "@/components/LiveMatches";
import { UpcomingMatches } from "@/components/UpcomingMatches";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { AdBannerHorizontal } from "@/components/AdBanner";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Globe, Shield } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "AI-Powered Analysis", desc: "Google Gemini AI processes form, H2H, injuries and odds to deliver predictions you can trust." },
  { icon: TrendingUp, title: "Value Bet Finder", desc: "Statistical edge detection identifies where bookmaker odds underestimate true probability." },
  { icon: Globe, title: "40+ Leagues Worldwide", desc: "EPL, La Liga, Champions League, KPL, AFCON, MLS — every major league covered daily." },
  { icon: Shield, title: "Transparent & Safe", desc: "Every prediction includes AI reasoning. Responsible gambling tools built in." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="PredictPro — AI Football Predictions | Free Daily Tips"
        description="AI-powered football predictions with 87% accuracy. Free daily tips for Premier League, La Liga, Champions League, KPL and 40+ leagues worldwide."
        canonical="/"
      />
      <Navbar />
      <LiveLeagueTicker />
      <Hero />

      {/* Live Matches */}
      <LiveMatches />

      {/* Upcoming with AI */}
      <UpcomingMatches />

      <AdBannerHorizontal className="container mx-auto px-4 max-w-6xl my-4" />

      {/* Predictions grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Today's AI Predictions</h2>
              <p className="text-muted-foreground text-sm mt-1">Updated daily · Click any card for H2H + analysis</p>
            </div>
            <Link to="/best-bets">
              <Button variant="outline" size="sm" className="gap-2">
                <Zap className="h-4 w-4" />Best Bets
              </Button>
            </Link>
          </div>
          <PredictionsDashboard />
        </div>
      </section>

      {/* Features */}
      <section className="py-14 bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose PredictPro</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-background rounded-xl p-5 border hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-black mb-3">Ready to Win Smarter?</h2>
          <p className="text-muted-foreground mb-6">Join 10,000+ members using AI predictions daily. Free to start.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/predict"><Button size="lg" className="gap-2"><Zap className="h-5 w-5" />Try Match Predictor</Button></Link>
            <Link to="/shop"><Button size="lg" variant="outline">View Plans</Button></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
