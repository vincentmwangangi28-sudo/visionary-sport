import { useMemo, useState } from "react";
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
import {
  Lock,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
  Crown,
  Search,
  Target,
  Goal,
  Flame,
  Shield,
  Activity,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTodayPredictions, type TodayPrediction } from "@/hooks/useTodayPredictions";
import { useAuth } from "@/hooks/useAuth";

/* ---------------- helpers ---------------- */

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

const MARKET_ICONS: Record<string, any> = {
  "1x2": Trophy,
  btts: Goal,
  clean_sheet_home: Shield,
  clean_sheet_away: Shield,
  both_win_corners: Flame,
  ou_2_5: Activity,
  ou_corners_9_5: Flame,
  double_chance: Shield,
  ht_result: Target,
  score_range: Target,
  first_goal: Goal,
};

/** Build market chips from real DB markets, with locked placeholders as a fallback. */
const buildMarkets = (p: TodayPrediction) => {
  const real = (p.markets ?? []).map((m) => ({
    key: m.market_key,
    label: m.market_label,
    value: m.market_value,
    confidence: m.confidence,
    locked: false,
    icon: MARKET_ICONS[m.market_key] ?? Activity,
  }));
  if (real.length > 0) return real;
  return [
    { key: "btts", label: "Both Teams To Score", value: "—", confidence: 0, locked: true, icon: Goal },
    { key: "clean_sheet_home", label: "Home Clean Sheet", value: "—", confidence: 0, locked: true, icon: Shield },
    { key: "both_win_corners", label: "Both Teams 4+ Corners", value: "—", confidence: 0, locked: true, icon: Flame },
    { key: "ou_2_5", label: "Over / Under 2.5", value: "—", confidence: 0, locked: true, icon: Activity },
    { key: "score_range", label: "Forecasted Score Range", value: "—", confidence: 0, locked: true, icon: Target },
    { key: "ht_result", label: "Half-Time Result", value: "—", confidence: 0, locked: true, icon: Target },
  ];
};

/* ---------------- small components ---------------- */

const ConfidenceRadial = ({ value, size = 96 }: { value: number; size?: number }) => {
  const data = [{ name: "confidence", value, fill: confidenceFill(value) }];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
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

const MarketChip = ({
  icon: Icon,
  label,
  value,
  confidence,
  locked,
}: {
  icon: any;
  label: string;
  value: string;
  confidence: number;
  locked?: boolean;
}) => (
  <div
    className={`group relative flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 transition hover:border-primary/40 hover:bg-muted/40 ${
      locked ? "opacity-80" : ""
    }`}
  >
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">
          {locked ? "•••••" : value}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-1">
      {locked ? (
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <span className={`text-xs font-bold ${confidenceTone(confidence)}`}>{confidence}%</span>
      )}
    </div>
  </div>
);

const LockedInsights = ({ user }: { user: any }) => (
  <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-5">
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

/* ---------------- prediction card ---------------- */

const PredictionCard = ({ p, user }: { p: TodayPrediction; user: any }) => {
  const kickoff = new Date(p.match_date);
  const isLocked = !!p.locked;
  const markets = useMemo(() => buildMarkets(p), [p]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/50 backdrop-blur transition hover:border-primary/40 hover:shadow-[0_0_32px_-12px_hsl(var(--primary)/0.4)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/10 px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <Trophy className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-medium">{p.league}</span>
            <span className="opacity-50">•</span>
            <span className="whitespace-nowrap">
              {kickoff.toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
              {kickoff.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          {p.is_premium && (
            <Badge variant="secondary" className="gap-1 shrink-0">
              <Crown className="h-3 w-3" /> Premium
            </Badge>
          )}
        </div>

        {/* Teams + main confidence */}
        <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-5">
            {!isLocked && typeof p.confidence === "number" ? (
              <ConfidenceRadial value={p.confidence} />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-dashed border-primary/30 bg-primary/5">
                <Lock className="h-6 w-6 text-primary/70" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold leading-tight">
                {p.home_team}
                <span className="mx-2 text-xs font-normal text-muted-foreground">vs</span>
                {p.away_team}
              </h3>

              {!isLocked && p.prediction ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/20">
                    {p.prediction.replace(/_/g, " ")}
                  </Badge>
                  {p.odds_value && <Badge variant="outline">Odds {p.odds_value.toFixed(2)}</Badge>}
                  {p.result && <Badge variant="outline">Result: {p.result}</Badge>}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Pick & confidence hidden — premium signal.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Markets grid */}
        <div className="border-t border-border/60 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Prediction markets
            </p>
            <span className="text-[10px] text-muted-foreground">{markets.length} options</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {markets.map((m, idx) => (
              <MarketChip
                key={m.key}
                icon={m.icon}
                label={m.label}
                value={m.value}
                confidence={m.confidence}
                locked={m.locked || (isLocked && idx >= 2)}
              />
            ))}
          </div>
        </div>

        {/* Reasoning / locked */}
        {!isLocked && p.reasoning && (
          <div className="border-t border-border/60 bg-muted/20 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              AI Reasoning
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{p.reasoning}</p>
          </div>
        )}

        {isLocked && (
          <div className="border-t border-border/60 p-5">
            <LockedInsights user={user} />
          </div>
        )}
      </Card>
    </motion.div>
  );
};

/* ---------------- stats bar ---------------- */

const StatsBar = ({ predictions }: { predictions: TodayPrediction[] }) => {
  const stats = useMemo(() => {
    const total = predictions.length;
    const visible = predictions.filter((p) => typeof p.confidence === "number");
    const avg = visible.length
      ? Math.round(visible.reduce((s, p) => s + (p.confidence ?? 0), 0) / visible.length)
      : 0;
    const high = predictions.filter((p) => (p.confidence ?? 0) >= 75 || p.is_premium).length;
    const leagues = new Set(predictions.map((p) => p.league)).size;
    return { total, avg, high, leagues };
  }, [predictions]);

  const chartData = predictions
    .filter((p) => typeof p.confidence === "number")
    .map((p) => ({
      name: `${p.home_team.slice(0, 3)} v ${p.away_team.slice(0, 3)}`,
      confidence: p.confidence,
    }));

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <Card className="lg:col-span-2 p-5 bg-gradient-to-br from-card to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Confidence by match
            </p>
            <h3 className="text-lg font-semibold">Today's signal strength</h3>
          </div>
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div className="mt-4 h-40">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
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

      <Card className="p-5 bg-gradient-to-br from-primary/10 to-card">
        <div className="flex items-center gap-3">
          <Zap className="h-7 w-7 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Matches today</p>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground">{stats.leagues} leagues</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-card">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-emerald-400" />
          <div>
            <p className="text-xs text-muted-foreground">Avg confidence</p>
            <p className="text-2xl font-bold">{stats.avg}%</p>
            <p className="text-[11px] text-muted-foreground">{stats.high} high‑value</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

/* ---------------- main ---------------- */

export const TodayMatchesDashboard = () => {
  const { predictions, loading, error, isPremium, isAdmin, refresh, generateMarkets } = useTodayPredictions();
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [league, setLeague] = useState<string>("all");
  const [tab, setTab] = useState<string>("all");

  const leagues = useMemo(
    () => Array.from(new Set(predictions.map((p) => p.league))).sort(),
    [predictions]
  );

  const filtered = useMemo(() => {
    return predictions.filter((p) => {
      if (league !== "all" && p.league !== league) return false;
      if (
        query &&
        !`${p.home_team} ${p.away_team} ${p.league}`.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      if (tab === "high" && (p.confidence ?? 0) < 75) return false;
      if (tab === "premium" && !p.is_premium) return false;
      if (tab === "free" && p.is_premium) return false;
      return true;
    });
  }, [predictions, query, league, tab]);

  return (
    <section className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium uppercase tracking-wider">Today</span>
          </div>
          <h1 className="mt-1 bg-gradient-to-r from-foreground to-primary bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
            Match Predictions Dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            AI‑powered signals across multiple markets — 1X2, BTTS, Over/Under, Corners, HT/FT and more.{" "}
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
          {isAdmin && (
            <Button
              onClick={async () => {
                setGenerating(true);
                try { await generateMarkets(); } finally { setGenerating(false); }
              }}
              variant="premium"
              size="sm"
              className="gap-2"
              disabled={generating}
            >
              <Sparkles className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating…" : "Generate Markets"}
            </Button>
          )}
          <Button onClick={refresh} variant="outline" size="sm" className="gap-2" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatsBar predictions={predictions} />
      </div>

      {/* Filter bar */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={tab} onValueChange={setTab} className="w-full lg:w-auto">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="high" className="gap-1">
                <Flame className="h-3 w-3" /> High
              </TabsTrigger>
              <TabsTrigger value="premium" className="gap-1">
                <Crown className="h-3 w-3" /> Premium
              </TabsTrigger>
              <TabsTrigger value="free">Free</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-1 items-center gap-2 lg:max-w-md">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams or league…"
                className="pl-9"
              />
            </div>
            <Select value={league} onValueChange={setLeague}>
              <SelectTrigger className="w-[160px] gap-1">
                <Filter className="h-3.5 w-3.5" />
                <SelectValue placeholder="League" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All leagues</SelectItem>
                {leagues.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
          {error}
        </Card>
      )}

      {/* Predictions grid */}
      <div className="grid gap-5 xl:grid-cols-2">
        {loading && predictions.length === 0 ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-72 w-full rounded-lg" />)
        ) : filtered.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {predictions.length === 0
                ? "No matches scheduled for today yet."
                : "No matches match your filters."}
            </p>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <PredictionCard key={p.id} p={p} user={user} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};

export default TodayMatchesDashboard;
