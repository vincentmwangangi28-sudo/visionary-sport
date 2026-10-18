import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoinShop } from "@/components/CoinShop";
import {
  CheckCircle2,
  Sparkles,
  Globe,
  Zap,
  ShieldCheck,
  BarChart2,
  Bell,
  Layers,
  SlidersHorizontal,
  ArrowRight,
  Flame,
} from "lucide-react";
import { Link } from "react-router-dom";

const FREE_PLATFORM_MODULES = [
  {
    title: "Daily AI Match Predictions (40+ Leagues)",
    description: "Unrestricted access to Bivariate Poisson & Expected Goals (xG) match forecasts across every major global competition.",
    icon: Zap,
    to: "/today-predictions",
    cta: "Explore Today's Forecasts",
    badge: "100% Free",
  },
  {
    title: "Club Expected Goals (xG) & FDR Hub",
    description: "Rolling 10-match xG vs xGA trendlines, Home/Away λ splits, 6-axis Tactical DNA, and 5-match Fixture Difficulty Ratings.",
    icon: BarChart2,
    to: "/teams",
    cta: "Open Club xG Hub",
    badge: "Unlocked",
  },
  {
    title: "Exact Scoreline Poisson Matrices",
    description: "Full 6×6 Bivariate Poisson scoreline probability heatmaps and top expected score vectors for every fixture.",
    icon: Layers,
    to: "/correct-score",
    cta: "View Scoreline Matrices",
    badge: "100% Free",
  },
  {
    title: "Quantitative Match Screener",
    description: "Filter daily fixtures by model consensus, Expected Goals (xG) totals, BTTS probability, and statistical edge.",
    icon: SlidersHorizontal,
    to: "/screener",
    cta: "Launch Match Screener",
    badge: "Unlocked",
  },
  {
    title: "Live In-Play xG Momentum Engine",
    description: "Real-time remaining-time Poisson probability simulator with red-card state adjustments and 10-minute momentum waves.",
    icon: Flame,
    to: "/live",
    cta: "Open Live Match Center",
    badge: "100% Free",
  },
  {
    title: "Automated Match Alerts & Calibration",
    description: "Browser push and Telegram match notifications plus Brier Score forecast calibration tracking on your personal dashboard.",
    icon: Bell,
    to: "/dashboard",
    cta: "Open My Dashboard",
    badge: "Unlocked",
  },
];

export default function Shop() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="100% Free AI Football Analytics & Open-Access Predictions | PredictPro"
        description="All PredictPro AI football predictions, Expected Goals (xG) models, Correct Score Poisson matrices, and 40+ league analytics are 100% free with zero paywalls."
        canonical="/shop"
        keywords="free football predictions, free expected goals xg analytics, open access soccer predictions, free correct score model"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-24 pb-20 md:pb-12 max-w-6xl">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3.5 py-1 text-xs font-bold">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 inline" />
            100% Free Open-Access Platform · Zero Paywalls
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Every Quantitative Model is 100% Free
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            PredictPro is completely free for all football fans and analysts worldwide. No subscriptions, no locked predictions, and no payment required.
          </p>
        </div>

        {/* Active Free Forever Banner */}
        <Card className="mb-8 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-foreground">Full Open-Access Pass Active</h2>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">$0 / Forever</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  All daily match forecasts, 80%+ high-consensus models, Correct Score matrices, Referee Set-Piece xG, and Club FDR analytics are unlocked automatically.
                </p>
              </div>
            </div>
            <Link to="/today-predictions" className="shrink-0">
              <Button className="gap-2 font-bold">
                <Sparkles className="h-4 w-4" />
                Explore Today&apos;s Forecasts
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Unlocked Platform Modules Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {FREE_PLATFORM_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card key={mod.title} className="flex flex-col border-border/70 hover:border-primary/40 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
                      {mod.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold">{mod.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {mod.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-3">
                  <Link to={mod.to}>
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs font-bold">
                      <span>{mod.cta}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Community Bonus Coins & Voucher Redeemer (100% Free) */}
        <div className="max-w-3xl mx-auto">
          <CoinShop />
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span>Open-access football statistical intelligence · Free for everyone worldwide</span>
        </div>
      </main>
      <Footer />
    </div>
  );
}
