import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { LiveMarketSteamTicker } from "@/components/LiveMarketSteamTicker";
import { AISmartSlipGenerator } from "@/components/AISmartSlipGenerator";
import { MonteCarloMatchSimulatorModal } from "@/components/MonteCarloMatchSimulatorModal";
import { LiveMatches } from "@/components/LiveMatches";
import { UpcomingMatches } from "@/components/UpcomingMatches";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { PastResultsArchive } from "@/components/PastResultsArchive";
import { AIRecommendationsHub } from "@/components/AIRecommendationsHub";
import { DailyAIDigestBanner } from "@/components/DailyAIDigestBanner";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { usePredictions } from "@/hooks/usePredictions";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Globe, Shield } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "Algorithmic Modeling", desc: "Gemini-driven inference processes form, H2H regression, injuries and market odds into a single confidence-weighted vector." },
  { icon: TrendingUp, title: "xG-Derived Value Detection", desc: "Statistical edge modelling flags where market-implied probability diverges from our Expected Goals (xG) Matrix." },
  { icon: Globe, title: "40+ League Coverage", desc: "EPL, La Liga, Champions League, KPL, AFCON, MLS — full-spectrum daily coverage across every major football market." },
  { icon: Shield, title: "Transparent & Auditable", desc: "Every output ships with model reasoning. Responsible-gambling safeguards built into the pipeline." },
];

export default function Index() {
  const { predictions, isLoading: isPredsLoading } = usePredictions(1);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="PredictPro — AI Football Predictions Today | Free Daily Betting Tips & xG Stats"
        description="AI-powered football predictions today with 87% accuracy. Free daily betting tips, banker picks, xG stats, BTTS, and value bets for Premier League, Champions League, and 40+ leagues worldwide."
        keywords="football predictions today, ai football predictions, free football betting tips, premier league predictions today, sure wins today, banker bet of the day, both teams to score btts tips, over 2.5 goals predictions, value bets today"
        canonical="/"
      />
      <Navbar />
      <LiveMarketSteamTicker />
      <main id="main-content" tabIndex={-1}>
        <Hero />

        {/* High-Intent Specialized Prediction Hubs Ribbon */}
        <div className="border-b border-border/40 bg-card/60 backdrop-blur-sm sticky top-16 z-20 py-2.5 px-4">
          <div className="container mx-auto max-w-6xl flex items-center justify-between gap-3 overflow-x-auto no-scrollbar text-xs">
            <span className="font-bold text-muted-foreground whitespace-nowrap hidden lg:inline flex-shrink-0">
              🔥 Trending Today:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <Link to="/jackpot-predictions" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 font-bold border border-red-500/20 whitespace-nowrap transition-all">
                <span>🏆 Mega Jackpot (17 Games)</span>
              </Link>
              <Link to="/predict" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-bold border border-primary/20 whitespace-nowrap transition-all">
                <span>🎯 AI Pro Tips Today</span>
              </Link>
              <Link to="/btts" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 whitespace-nowrap transition-all">
                <span>⚽ BTTS &amp; Over 2.5</span>
              </Link>
              <Link to="/value-bets" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 whitespace-nowrap transition-all">
                <span>📈 Value Bets (+EV)</span>
              </Link>
              <Link to="/us-soccer-predictions" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 whitespace-nowrap transition-all">
                <span>🇺🇸 US Soccer &amp; MLS</span>
              </Link>
              <Link to="/kpl-predictions" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground font-semibold border whitespace-nowrap transition-all">
                <span>🇰🇪 Kenya Premier League</span>
              </Link>
              <Link to="/accumulator" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-foreground font-semibold border whitespace-nowrap transition-all">
                <span>⚡ Acca Builder</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Live In-Play Matches */}
        <LiveMatches />

        {/* 1-Click AI Smart Slip Generator */}
        <section className="py-8 bg-muted/10 border-b border-border/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <AISmartSlipGenerator />
          </div>
        </section>

        {/* Automated Gemini Matchday Intelligence Digest */}
        <section className="py-8 bg-muted/5 border-b border-border/50">
          <div className="container mx-auto px-4 max-w-6xl space-y-6">
            <DailyAIDigestBanner predictions={predictions} />
            <BreakingNewsTicker />
          </div>
        </section>

        {/* AI Recommendations Hub - Curated Top Picks */}
        <section className="py-10 bg-muted/15 border-b border-border/50">
          <div className="container mx-auto px-4 max-w-6xl">
            <AIRecommendationsHub
              predictions={predictions}
              isLoading={isPredsLoading}
              maxItems={4}
            />
          </div>
        </section>

        {/* Comprehensive Predictions Engine */}
        <section className="py-12 border-b border-border/40">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Today's AI Predictions</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Confidence-scored match vectors with Poisson/xG statistical regression · Click any card for head-to-head analysis
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <MonteCarloMatchSimulatorModal />
                <Link to="/best-bets">
                  <Button variant="outline" size="sm" className="gap-2 font-semibold" aria-label="View Best Bets">
                    <Zap className="h-4 w-4 text-primary" aria-hidden="true" />Best Bets
                  </Button>
                </Link>
              </div>
            </div>
            <PredictionsDashboard />
          </div>
        </section>

        {/* Upcoming Fixtures Schedule */}
        <UpcomingMatches />

        {/* Historical Verified Archive */}
        <PastResultsArchive />

        {/* Features */}
        <section className="py-14 bg-muted/20">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl font-bold text-center mb-8">Why Choose PredictPro</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-background rounded-xl p-5 border hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
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
            <h2 className="text-3xl font-black mb-3">Ready to Trade on Better Data?</h2>
            <p className="text-muted-foreground mb-6">10,000+ members running the model daily. Free to start.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/predict">
                <Button size="lg" className="gap-2" aria-label="Run the AI prediction model">
                  <Zap className="h-5 w-5" aria-hidden="true" />Run the Model
                </Button>
              </Link>
              <Link to="/shop">
                <Button size="lg" variant="outline" aria-label="View Subscription Plans">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
