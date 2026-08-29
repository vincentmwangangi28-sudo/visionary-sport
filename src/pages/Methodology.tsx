import { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Link } from 'react-router-dom';
import {
  Brain,
  TrendingUp,
  Cpu,
  BarChart3,
  ShieldCheck,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Database,
  LineChart,
  Layers,
  Scale
} from 'lucide-react';

// Poisson probability function
function poisson(k: number, lambda: number): number {
  const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

export default function Methodology() {
  // Simulator state for interactive Poisson xG model
  const [homeXG, setHomeXG] = useState<number[]>([1.85]);
  const [awayXG, setAwayXG] = useState<number[]>([1.15]);

  // Compute Poisson scoreline matrix (up to 5x5)
  const simulationResults = useMemo(() => {
    const hLambda = homeXG[0];
    const aLambda = awayXG[0];

    let homeWinProb = 0;
    let drawProb = 0;
    let awayWinProb = 0;
    let over25Prob = 0;
    let bttsProb = 0;

    const matrix: { score: string; prob: number }[] = [];

    for (let h = 0; h <= 5; h++) {
      for (let a = 0; a <= 5; a++) {
        const p = poisson(h, hLambda) * poisson(a, aLambda);
        matrix.push({ score: `${h} - ${a}`, prob: p });

        if (h > a) homeWinProb += p;
        else if (h === a) drawProb += p;
        else awayWinProb += p;

        if (h + a > 2.5) over25Prob += p;
        if (h > 0 && a > 0) bttsProb += p;
      }
    }

    matrix.sort((a, b) => b.prob - a.prob);

    return {
      homeWin: Math.round(homeWinProb * 100),
      draw: Math.round(drawProb * 100),
      awayWin: Math.round(awayWinProb * 100),
      over25: Math.round(over25Prob * 100),
      under25: Math.round((1 - over25Prob) * 100),
      bttsYes: Math.round(bttsProb * 100),
      bttsNo: Math.round((1 - bttsProb) * 100),
      fairHomeOdds: homeWinProb > 0 ? (1 / homeWinProb).toFixed(2) : '—',
      fairDrawOdds: drawProb > 0 ? (1 / drawProb).toFixed(2) : '—',
      fairAwayOdds: awayWinProb > 0 ? (1 / awayWinProb).toFixed(2) : '—',
      topScores: matrix.slice(0, 5),
    };
  }, [homeXG, awayXG]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="PredictPro AI Prediction Methodology & Mathematical Modeling"
        description="Learn how PredictPro uses Expected Goals (xG), Bivariate Poisson distribution, Bayesian line updates, and +EV mathematical models to generate transparent football predictions."
        canonical="/methodology"
      />
      <Navbar />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-10 max-w-5xl" tabIndex={-1}>
        {/* Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary px-3 py-1 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            Open & Auditable Analytics
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            PredictPro Prediction Methodology
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            We reject the black-box approach of standard tipster websites. Our platform combines quantitative expected goals (xG) statistics, Poisson probability modeling, and market price inefficiency detection (+EV) to generate objective, high-probability football intelligence.
          </p>
        </div>

        {/* 4 Core Pillars */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card className="border-border/60 bg-muted/20">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3">
                <Database className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="font-bold text-base mb-1">1. High-Density Ingestion</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ingests live match data, rolling 10-game rolling xG, player availability, travel fatigue, and historical head-to-head records across 40+ global leagues.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-muted/20">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <Cpu className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="font-bold text-base mb-1">2. Poisson xG Engine</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calculates attacking threat vs. defensive suppression vectors to model the goal-scoring probability distribution for each team.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-muted/20">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="font-bold text-base mb-1">3. +EV Edge Detection</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Compares our simulated probabilities against bookmaker implied odds to flag market inefficiencies where probability exceeds quoted price.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-muted/20">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                <Brain className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="font-bold text-base mb-1">4. Gemini Reasoning</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Translates dense multivariate statistics into natural, transparent explanations so users understand exactly why a pick was selected.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Model Simulator */}
        <Card className="mb-12 border-primary/30 bg-primary/[0.02] shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
                  Interactive Poisson Simulation Laboratory
                </CardTitle>
                <CardDescription className="text-sm">
                  Adjust expected goals (xG) to see the mathematical model simulate 1X2 win probability, fair odds, and scoreline frequencies in real time.
                </CardDescription>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">Live Mathematical Engine</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 p-4 rounded-xl bg-background border">
              {/* Home Team Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold flex items-center gap-1.5">
                    🏠 Home Team Expected Goals (xG)
                  </span>
                  <Badge variant="secondary" className="font-mono text-sm px-2.5">
                    {homeXG[0].toFixed(2)} xG
                  </Badge>
                </div>
                <Slider
                  value={homeXG}
                  onValueChange={setHomeXG}
                  min={0.3}
                  max={3.5}
                  step={0.05}
                  aria-label="Home Team Expected Goals"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>0.3 (Low threat)</span>
                  <span>1.85 (Strong attack)</span>
                  <span>3.5 (Dominant)</span>
                </div>
              </div>

              {/* Away Team Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold flex items-center gap-1.5">
                    ✈️ Away Team Expected Goals (xG)
                  </span>
                  <Badge variant="secondary" className="font-mono text-sm px-2.5">
                    {awayXG[0].toFixed(2)} xG
                  </Badge>
                </div>
                <Slider
                  value={awayXG}
                  onValueChange={setAwayXG}
                  min={0.3}
                  max={3.5}
                  step={0.05}
                  aria-label="Away Team Expected Goals"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>0.3 (Low threat)</span>
                  <span>1.15 (Average away)</span>
                  <span>3.5 (Dominant)</span>
                </div>
              </div>
            </div>

            {/* Simulation Results Grid */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-background border text-center">
                <div className="text-xs text-muted-foreground font-semibold uppercase">Home Win (1)</div>
                <div className="text-2xl font-black text-primary mt-1">{simulationResults.homeWin}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">Fair Odds: <b className="text-foreground">{simulationResults.fairHomeOdds}</b></div>
              </div>
              <div className="p-4 rounded-xl bg-background border text-center">
                <div className="text-xs text-muted-foreground font-semibold uppercase">Draw (X)</div>
                <div className="text-2xl font-black text-amber-500 mt-1">{simulationResults.draw}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">Fair Odds: <b className="text-foreground">{simulationResults.fairDrawOdds}</b></div>
              </div>
              <div className="p-4 rounded-xl bg-background border text-center">
                <div className="text-xs text-muted-foreground font-semibold uppercase">Away Win (2)</div>
                <div className="text-2xl font-black text-blue-500 mt-1">{simulationResults.awayWin}%</div>
                <div className="text-xs text-muted-foreground mt-0.5">Fair Odds: <b className="text-foreground">{simulationResults.fairAwayOdds}</b></div>
              </div>
            </div>

            {/* Secondary Markets & Top Scorelines */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background border space-y-2.5">
                <div className="text-xs font-bold text-muted-foreground uppercase">Goal Markets Probability</div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-border/60">
                  <span>Over 2.5 Goals</span>
                  <Badge variant="outline" className="font-bold">{simulationResults.over25}%</Badge>
                </div>
                <div className="flex justify-between items-center text-sm py-1 border-b border-border/60">
                  <span>Under 2.5 Goals</span>
                  <Badge variant="outline" className="font-bold">{simulationResults.under25}%</Badge>
                </div>
                <div className="flex justify-between items-center text-sm py-1">
                  <span>Both Teams to Score (BTTS - Yes)</span>
                  <Badge variant="outline" className="font-bold">{simulationResults.bttsYes}%</Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background border space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase">Top Likely Correct Scorelines</div>
                <div className="space-y-1.5">
                  {simulationResults.topScores.map(({ score, prob }, idx) => (
                    <div key={score} className="flex justify-between items-center text-xs py-0.5">
                      <span className="font-medium flex items-center gap-1.5">
                        <span className="text-muted-foreground font-mono">#{idx + 1}</span>
                        <span>{score}</span>
                      </span>
                      <span className="font-mono font-bold text-primary">{(prob * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Breakdown Sections */}
        <div className="space-y-8 mb-12">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" aria-hidden="true" />
              1. Expected Goals (xG) & Attack/Defense Ratings
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Standard win/loss records often mask true team quality due to short-term variance, deflection goals, and goalkeeper heroics. To uncover true sustainable performance, our model calculates a team’s <b>Offensive Rating (λ_home)</b> and <b>Defensive Rating (λ_away)</b> using rolling 10-match non-penalty Expected Goals (npxG).
            </p>
            <div className="p-4 rounded-xl bg-muted/30 border text-xs font-mono leading-relaxed overflow-x-auto">
              <code>
                λ_home = League_Avg_Home_Goals × (Home_Team_Attacking_Strength ÷ League_Avg_Attack) × (Away_Team_Defensive_Weakness ÷ League_Avg_Defense)
              </code>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" aria-hidden="true" />
              2. Positive Expected Value (+EV) Filtering
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We never recommend a prediction solely because a team is favored to win. A 60% probability pick priced at 1.40 odds (-EV) is a mathematically losing proposition over time. We only publish picks that satisfy positive expected value:
            </p>
            <div className="p-4 rounded-xl bg-muted/30 border text-xs font-mono leading-relaxed overflow-x-auto">
              <code>
                Expected Value (EV) = (Model_Probability × Decimal_Odds) - 1 &gt; +0.045 (+4.5% Edge)
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              By enforcing a minimum +4.5% edge over market implied probability, our users trade with mathematical asymmetric upside.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" aria-hidden="true" />
              3. Limitations, Variance & Bankroll Management
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Football is an inherently low-scoring game subject to chaotic events (early red cards, referee penalties, severe weather conditions). No model can guarantee a 100% win rate. We strongly advocate strict bankroll discipline using the fractional Kelly Criterion:
            </p>
            <div className="grid sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-lg border bg-background text-center">
                <div className="font-bold text-sm text-green-600 dark:text-green-400">Conservative Profile</div>
                <div className="text-xs text-muted-foreground mt-1">1% – 2% of total bankroll per pick. Ideal for steady capital growth.</div>
              </div>
              <div className="p-3.5 rounded-lg border bg-background text-center">
                <div className="font-bold text-sm text-primary">Balanced Profile</div>
                <div className="text-xs text-muted-foreground mt-1">2.5% – 3.5% per single pick with 70%+ confidence score.</div>
              </div>
              <div className="p-3.5 rounded-lg border bg-background text-center">
                <div className="font-bold text-sm text-amber-600 dark:text-amber-400">Aggressive Profile</div>
                <div className="text-xs text-muted-foreground mt-1">Max 5% stake per selection. High-yield multi-leg accumulators.</div>
              </div>
            </div>
          </section>
        </div>

        {/* Call to Actions */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Ready to Explore Verified Results?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inspect our permanent historical archive with opening odds and win/loss verification.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/archive">
              <Button className="gap-1.5" aria-label="View Results Archive">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Prediction Archive
              </Button>
            </Link>
            <Link to="/predict">
              <Button variant="outline" className="gap-1.5" aria-label="Run Prediction Model">
                <Flame className="h-4 w-4" aria-hidden="true" />
                Run Model
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
