import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Brain, Globe, Shield, TrendingUp, Users, Zap, Mail, Twitter, CheckCircle2, FileText, Scale } from "lucide-react";

const TEAM = [
  { name: "Quantitative AI Engine", role: "Google Gemini + Bivariate Poisson", desc: "Powers all match simulations, Dixon-Coles low-score adjustments, and natural-language tactical breakdowns." },
  { name: "Live Match Telemetry", role: "API-Football + Opta-Grade Feeds", desc: "Real-time fixtures, rolling 10-match Expected Goals (npxG), H2H records, standings, and player availability across 40+ leagues." },
  { name: "Statistical Modeling Lab", role: "6×6 Scoreline Matrix & Elo Ratings", desc: "Calculates fair implied probabilities across UEFA, CONMEBOL, CONCACAF, AFC, and CAF competitions." },
  { name: "Open-Access Publishing", role: "100% Free Research Platform", desc: "Zero paywalls or paid tipster subscriptions. All statistical tools, archives, and match previews are freely accessible." },
];

const VALUES = [
  { icon: Brain, title: "Data-Driven Science", desc: "Every match forecast is computed using Expected Goals (xG), team strength vectors, and historical head-to-head telemetry." },
  { icon: Shield, title: "Audited Transparency", desc: "We publish full confidence scores, mathematical reasoning, and a permanent settled results archive for complete accountability." },
  { icon: Globe, title: "Global Coverage", desc: "40+ leagues across 6 continents — from the English Premier League and Champions League to KPL, MLS, and AFCON." },
  { icon: TrendingUp, title: "Probability Education", desc: "Our interactive Poisson and Kelly Criterion calculators help football fans understand implied probabilities and variance." },
  { icon: Users, title: "Analyst Community", desc: "Community match discussions, accuracy leaderboards, and transparent consensus polls alongside algorithmic models." },
  { icon: Zap, title: "Real-Time Updates", desc: "Live match scores, confirmed starting XI lineups, and injury impact alerts refreshed continuously on matchdays." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About PredictPro: Quantitative Sports Modeling & AI Science"
        description="Discover the Dixon-Coles Poisson distributions, machine learning pipelines, and sports analytics engineers powering PredictPro’s verified predictions."
        canonical="/about"
        keywords="about predictpro, ai sports prediction team, football analytics platform, expected goals modeling, quantitative sports science"
      />
      <Navbar />
      <main id="main-content">
        {/* Hero */}
        <section className="container mx-auto px-4 py-24 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Globe className="h-4 w-4" />Independent Quantitative Football Analytics Publication
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
            Quantitative Football Science<br />&amp; Expected Goals Intelligence
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            PredictPro combines Bivariate Poisson statistical models, real-time Expected Goals (xG) telemetry, and editorial match previews to deliver transparent football analysis across 40+ global leagues.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/methodology"><Button size="lg" className="gap-2"><Zap className="h-4 w-4" />Explore Our Methodology</Button></Link>
            <Link to="/poisson-calculator"><Button variant="outline" size="lg">Interactive Poisson Lab</Button></Link>
          </div>
        </section>

        {/* Values */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-2xl font-bold text-center mb-8">Core Editorial &amp; Analytical Principles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {VALUES.map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="border-primary/10 hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold mb-1.5">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="container mx-auto px-4 py-16 max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-2">Our Statistical &amp; Data Architecture</h2>
          <p className="text-muted-foreground text-center mb-8">Enterprise sports telemetry and mathematical modeling pipelines</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {TEAM.map(t => (
              <Card key={t.name} className="hover:border-primary/20 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    <div>
                      <p className="font-bold">{t.name}</p>
                      <p className="text-xs text-primary font-medium mb-1">{t.role}</p>
                      <p className="text-sm text-muted-foreground">{t.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Editorial Standards & Governance (E-E-A-T for Google AdSense) */}
        <section className="container mx-auto px-4 pb-16 max-w-5xl">
          <Card className="border-border/80 bg-card/60">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Editorial Governance &amp; Transparency
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Publisher ID: pub-1375386376692976</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">Editorial Standards, Verification &amp; Publisher Disclosure</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every match preview, statistical table, and analytical guide published on PredictPro undergoes automated data integrity checks against official league feeds (Opta / API-Football) and is reviewed by our quantitative sports engineering desk led by <strong>Vincent Mwangangi</strong>. Historical forecasts are permanently logged in our <Link to="/archive" className="text-primary hover:underline font-medium">Verified Results Archive</Link> without retroactive alteration.
              </p>
              <div className="flex flex-wrap gap-3 pt-2 text-xs">
                <Link to="/privacy" className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold">
                  <FileText className="h-3.5 w-3.5" /> Privacy Policy
                </Link>
                <Link to="/terms" className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold">
                  <Scale className="h-3.5 w-3.5" /> Terms of Service
                </Link>
                <Link to="/cookies" className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold">
                  <Shield className="h-3.5 w-3.5" /> Cookie Policy
                </Link>
                <Link to="/responsible-gaming" className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 18+ Responsible Gaming Policy
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Informational & 18+ Notice */}
        <section className="bg-amber-500/10 border-y border-amber-500/20 py-8">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Shield className="h-8 w-8 text-amber-600 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">Informational Sports Statistics &amp; 18+ Responsibility</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              PredictPro is an independent statistical research publication and is <strong>NOT</strong> a bookmaker or gambling operator. All match projections are strictly for informational and analytical purposes. Past statistical performance never guarantees future outcomes. Please engage responsibly (18+ Only). Free confidential support: <strong className="text-foreground">BeGambleAware.org (0808 8020 133)</strong> &bull; <strong className="text-foreground">Kenya: 0800 722 200</strong>.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-2">Contact Our Editorial &amp; Engineering Desk</h2>
          <p className="text-muted-foreground mb-6">Questions, data inquiries, or feedback — reach out to our team directly.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="mailto:support@predictpro.guru">
              <Button variant="outline" className="gap-2"><Mail className="h-4 w-4" />support@predictpro.guru</Button>
            </a>
            <Link to="/contact">
              <Button variant="outline" className="gap-2">Contact Form &amp; Office Details</Button>
            </Link>
            <a href="https://twitter.com/PredictProAI" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2"><Twitter className="h-4 w-4" />@PredictProAI</Button>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
