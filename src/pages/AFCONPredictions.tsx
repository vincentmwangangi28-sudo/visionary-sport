import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CONTINENTAL_DISTRIBUTION_HUBS } from "@/services/geoRegionService";
import { useGeoRegion } from "@/hooks/useGeoRegion";
import { Globe, Trophy, Zap, ArrowUpRight, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const CONTINENTAL_DERBIES = [
  { slug: "gor-mahia-vs-afc-leopards", title: "Gor Mahia vs AFC Leopards", league: "Kenya FKF Premier League (Mashemeji Derby)", zone: "East Africa 🇰🇪" },
  { slug: "simba-sc-vs-young-africans", title: "Simba SC vs Young Africans", league: "Tanzania NBC Premier League (Kariakoo Derby)", zone: "East Africa 🇹🇿" },
  { slug: "kaizer-chiefs-vs-orlando-pirates", title: "Kaizer Chiefs vs Orlando Pirates", league: "South Africa Betway Premiership (Soweto Derby)", zone: "Southern Africa 🇿🇦" },
  { slug: "mamelodi-sundowns-vs-orlando-pirates", title: "Mamelodi Sundowns vs Orlando Pirates", league: "CAF Champions League & PSL Title Clash", zone: "Southern Africa 🏆" },
  { slug: "enyimba-vs-rangers-international", title: "Enyimba vs Rangers International", league: "Nigeria NPFL Oriental Derby", zone: "West Africa 🇳🇬" },
  { slug: "hearts-of-oak-vs-asante-kotoko", title: "Hearts of Oak vs Asante Kotoko", league: "Ghana Premier League Super Clash", zone: "West Africa 🇬🇭" },
  { slug: "al-ahly-vs-zamalek", title: "Al Ahly vs Zamalek", league: "Egyptian Premier League & CAF Super Derby", zone: "North Africa 🇪🇬" },
  { slug: "wydad-ac-vs-raja-casablanca", title: "Wydad AC vs Raja Casablanca", league: "Morocco Botola Pro Casablanca Derby", zone: "North Africa 🇲🇦" },
  { slug: "tp-mazembe-vs-as-vita-club", title: "TP Mazembe vs AS Vita Club", league: "DR Congo Linafoot Classico", zone: "Central Africa 🇨🇩" },
];

const AFRICAN_HUBS = CONTINENTAL_DISTRIBUTION_HUBS.filter((h) =>
  ["pan_africa", "east_africa", "west_africa", "southern_africa", "central_africa", "north_africa_middle_east"].includes(h.id)
);

export default function AFCONPredictions() {
  const { regionId, setRegion } = useGeoRegion();
  const [selectedLeague, setSelectedLeague] = useState<string | undefined>(undefined);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="AFCON, CAF & Pan-African Football Predictions Today | PredictPro"
        description="Free AI football predictions across all 54 CAF nations: AFCON, CAF Champions League, KPL, NPFL, South Africa PSL, Botola Pro & Egyptian League."
        canonical="/afcon-predictions"
        keywords="AFCON predictions, CAF Champions League tips, African football predictions, Nigeria NPFL predictions, South Africa PSL tips, Kenya KPL tips, Egypt Al Ahly predictions"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-10 max-w-6xl space-y-10">
        {/* Hero Header */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-primary/5 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-emerald-600 text-white font-bold px-3 py-1">
                  🌍 Pan-African Football Intelligence (54 CAF Nations)
                </Badge>
                <Badge variant="outline" className="border-primary/40 text-primary font-mono text-xs">
                  CECAFA · WAFU · COSAFA · UNIFFAC · UNAF
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                AFCON, CAF Champions League &amp; All-Africa Predictions
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Quantitative Expected Goals (xG), bivariate Poisson scoreline matrices, and 1X2 banker picks distributed across East, West, Southern, Central, and North Africa—covering AFCON, CAF Champions League, FKF KPL, Nigeria NPFL, South Africa PSL, DR Congo Linafoot, Egyptian Premier League, and Morocco Botola Pro.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <Button
                onClick={() => {
                  setRegion("pan_africa");
                  toast.success("Activated All-Africa Continental (54 CAF Nations) priority feed!");
                }}
                className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Globe className="h-4 w-4" />
                {regionId === "pan_africa" ? "All-Africa Feed Active" : "Prioritize All-Africa Feed"}
              </Button>
              <Link to="/jackpot-predictions">
                <Button variant="outline" className="w-full gap-2 font-semibold text-xs">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  17-Game Continental Jackpots
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Subregion Switcher Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-6 pt-5 border-t border-border/50">
            {AFRICAN_HUBS.map((hub) => {
              const active = regionId === hub.id;
              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => {
                    setRegion(hub.id);
                    toast.success(`Switched regional priority to ${hub.flag} ${hub.title}`);
                  }}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? "bg-primary/10 border-primary text-foreground shadow-xs"
                      : "bg-card/80 border-border/60 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-lg">{hub.flag}</span>
                    {active && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                  <div className="font-bold text-xs mt-1 truncate">{hub.title.replace(" Hub", "")}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {hub.countriesCount} Countries · {hub.hreflangLocales[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Fixtures & Predictions Dashboard */}
        <section aria-label="Continental Match Predictions">
          <PredictionsDashboard key={selectedLeague || "all-continent"} initialLeague={selectedLeague} />
        </section>

        {/* Continental Derbies & Flagship Match Previews */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Zap className="h-3.5 w-3.5" />
                <span>Continental Derbies &amp; Flagship Fixtures</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                Major African Club &amp; Regional Clash Predictions
              </h2>
            </div>
            <Link to="/seo-indexing">
              <Button variant="ghost" size="sm" className="text-xs gap-1 font-semibold text-primary">
                Continental Syndication Status <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {CONTINENTAL_DERBIES.map((derby) => (
              <Card key={derby.slug} className="border-border/70 hover:border-primary/40 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px] font-semibold">
                      {derby.zone}
                    </Badge>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <CardTitle className="text-sm font-bold mt-1">{derby.title}</CardTitle>
                  <CardDescription className="text-xs">{derby.league}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link
                    to={`/predict/${derby.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    View Poisson Matrix &amp; H2H Odds
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Subregional Coverage Breakdown */}
        <section className="p-6 bg-muted/30 border border-border/60 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-bold">Explore All Prediction Markets &amp; Regional Hubs</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { to: "/kpl-predictions", l: "🇰🇪 East Africa & KPL Hub" },
              { to: "/jackpot-predictions", l: "🏆 17-Game Mega & Midweek Jackpots" },
              { to: "/best-bets", l: "🔒 Today's Banker Bets (75%+ AI)" },
              { to: "/value-bets", l: "📈 Daily +EV Value Bets" },
              { to: "/correct-score", l: "🎯 Exact Correct Score Matrix" },
              { to: "/btts", l: "⚽ BTTS & Over 2.5 Goals" },
              { to: "/accumulator", l: "🧮 Smart Accumulator Builder" },
              { to: "/premier-league-predictions", l: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League Predictions" },
              { to: "/champions-league-predictions", l: "🇪🇺 UEFA Champions League" },
              { to: "/world-cup-predictions", l: "🌍 FIFA World Cup 2026" },
            ].map((link) => (
              <Link key={link.to} to={link.to}>
                <Button variant="outline" size="sm" className="min-h-[42px] text-xs font-semibold">
                  {link.l}
                </Button>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

