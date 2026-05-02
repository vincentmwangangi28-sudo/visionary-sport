import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Lock, RefreshCw, Sparkles, TrendingUp, Trophy, Zap, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayPredictions, type TodayPrediction } from "@/hooks/useTodayPredictions";
import { useAuth } from "@/hooks/useAuth";

const confidenceTone = (c: number) => {
  if (c >= 80) return "text-emerald-400";
  if (c >= 65) return "text-primary";
  if (c >= 50) return "text-amber-400";
  return "text-muted-foreground";
};

const confidenceFill = (c: number) => {
  if (c >= 80) return "hsl(var(--primary))";
  if (c >= 65) return "hsl(var(--primary) / 0.85)";
  if (c >= 50) return "hsl(var(--accent))";
  return "hsl(var(--muted-foreground))";
};

const ConfidenceRadial = ({ value }: { value: number }) => {
  const data = [{ name: "confidence", value, fill: confidenceFill(value) }];
  return (
    <div className="relative h-24 w-24 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: "hsl(var(--muted) / 0.3)" }} dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold ${confidenceTone(value)}`}>{value}%</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Conf</span>
      </div>
    </div>
  );
};

const LockedInsights = ({ user }: { user: any }) => (
  <div className="relative mt-4 overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_60%)]" />
    <div className="relative flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Lock className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">Premium Insights Locked</h4>
          <Badge variant="secondary" className="gap-1">
            <Crown className="h-3 w-3" /> Premium
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Unlock expected goals, momentum index, AI match narrative and the model's reasoning for this high‑confidence pick.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" className="gap-1">
            <Link to={user ? "/shop" : "/auth"}>
              <Sparkles className="h-4 w-4" />
              {user ? "Upgrade to Premium" : "Sign in to unlock"}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/about">How predictions work</Link>
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const PredictionRow = ({ p, user }: { p: TodayPrediction; user: any }) => {
  const kickoff = new Date(p.match_date);
  const isLocked = !!p.locked;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/50 backdrop-blur transition hover:border-primary/40 hover:shadow-[0_0_32px_-12px_hsl(var(--primary)/0.4)]">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-4">
            {!isLocked && typeof p.confidence === "number" ? (
              <ConfidenceRadial value={p.confidence} />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-dashed border-primary/30 bg-primary/5">
                <Lock className="h-6 w-6 text-primary/70" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Trophy className="h-3 w-3" />
                <span className="truncate">{p.league}</span>
                <span>•</span>
                <span>
                  {kickoff.toLocaleDateString()}{" "}
                  {kickoff.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                {p.is_premium && (
                  <Badge variant="secondary" className="ml-auto gap-1">
                    <Crown className="h-3 w-3" /> Premium
                  </Badge>
                )}
              </div>
              <h3 className="mt-1 truncate text-lg font-semibold">
                {p.home_team} <span className="text-muted-foreground">vs</span> {p.away_team}
              </h3>

              {!isLocked && p.prediction ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                    {p.prediction.replace(/_/g, " ")}
                  </Badge>
                  {p.odds_value && (
                    <Badge variant="outline">Odds {p.odds_value.toFixed(2)}</Badge>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Pick & confidence hidden — this is a premium signal.
                </p>
              )}
            </div>
          </div>
        </div>

        {!isLocked && p.reasoning && (
          <div className="border-t border-border/60 bg-muted/20 p-5">
            <p className="text-sm leading-relaxed text-foreground/90">{p.reasoning}</p>
          </div>
        )}

        {isLocked && <LockedInsights user={user} />}
      </Card>
    </motion.div>
  );
};

const StatsBar = ({ predictions }: { predictions: TodayPrediction[] }) => {
  const stats = useMemo(() => {
    const total = predictions.length;
    const visible = predictions.filter((p) => typeof p.confidence === "number");
    const avg = visible.length
      ? Math.round(visible.reduce((s, p) => s + (p.confidence ?? 0), 0) / visible.length)
      : 0;
    const high = predictions.filter((p) => (p.confidence ?? 0) >= 75 || p.is_premium).length;
    return { total, avg, high };
  }, [predictions]);

  const chartData = predictions
    .filter((p) => typeof p.confidence === "number")
    .map((p) => ({
      name: `${p.home_team.slice(0, 3)} v ${p.away_team.slice(0, 3)}`,
      confidence: p.confidence,
    }));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2 bg-gradient-to-br from-card to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Confidence by match</p>
            <h3 className="text-lg font-semibold">Today's signal strength</h3>
          </div>
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div className="mt-4 h-40">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="confidence" radius={[6, 6, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={confidenceFill(d.confidence ?? 0)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Sign in to view confidence on premium picks.
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-4">
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-card">
          <div className="flex items-center gap-3">
            <Zap className="h-7 w-7 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Matches today</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-card">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-emerald-400" />
            <div>
              <p className="text-xs text-muted-foreground">Avg confidence</p>
              <p className="text-2xl font-bold">{stats.avg}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-accent/10 to-card">
          <div className="flex items-center gap-3">
            <Crown className="h-7 w-7 text-accent-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">High‑value picks</p>
              <p className="text-2xl font-bold">{stats.high}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const TodayMatchesDashboard = () => {
  const { predictions, loading, error, isPremium, isAdmin, refresh } = useTodayPredictions();
  const { user } = useAuth();

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium uppercase tracking-wider">Today</span>
          </div>
          <h1 className="mt-1 text-3xl font-bold md:text-4xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Match Predictions Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            AI‑powered signals, refreshed continuously.{" "}
            {isPremium ? (
              <span className="text-primary">Premium access unlocked.</span>
            ) : (
              <span>
                <Link to={user ? "/shop" : "/auth"} className="text-primary underline-offset-4 hover:underline">
                  Upgrade
                </Link>{" "}
                to reveal locked insights.
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Badge variant="outline" className="gap-1">
              <Crown className="h-3 w-3" /> Admin
            </Badge>
          )}
          <Button onClick={refresh} variant="outline" size="sm" className="gap-2" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Predictions
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <StatsBar predictions={predictions} />
      </div>

      {error && (
        <Card className="mb-6 border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
          {error}
        </Card>
      )}

      <div className="space-y-4">
        {loading && predictions.length === 0 ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)
        ) : predictions.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No matches scheduled for today yet.</p>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {predictions.map((p) => (
              <PredictionRow key={p.id} p={p} user={user} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};

export default TodayMatchesDashboard;
