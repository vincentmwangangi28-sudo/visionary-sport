import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, Percent, Flame, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ValueBet {
  id: string;
  match_id: string;
  home_team: string;
  away_team: string;
  league: string;
  prediction: string;
  confidence: number;
  odds_value: number | null;
  match_date: string;
  implied_prob: number;
  edge: number;
  kelly: number;
  ev: number;
}

const fetchValueCandidates = async () => {
  const { data, error } = await supabase
    .from("predictions")
    .select("id, match_id, home_team, away_team, league, prediction, confidence, odds_value, match_date, is_premium")
    .eq("is_premium", false)
    .gte("match_date", new Date().toISOString())
    .not("odds_value", "is", null)
    .gte("confidence", 55)
    .order("match_date", { ascending: true })
    .limit(80);
  if (error) throw error;
  return data ?? [];
};

/**
 * Value Bet Finder — pure math on existing predictions:
 *   implied_prob = 1 / decimal_odds
 *   edge         = (model_prob * odds) - 1      (a.k.a. expected value per 1 unit)
 *   kelly        = (odds * p - 1) / (odds - 1)  (fraction of bankroll)
 */
const ValueBetFinder = () => {
  const [minEdge, setMinEdge] = useState<number>(5);

  const { data = [], isLoading } = useQuery({
    queryKey: ["value-bet-candidates"],
    queryFn: fetchValueCandidates,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const bets: ValueBet[] = useMemo(() => {
    return data
      .map((p: any) => {
        const odds = Number(p.odds_value);
        const conf = Number(p.confidence) / 100;
        if (!odds || odds <= 1 || !isFinite(odds)) return null;
        const implied = 1 / odds;
        const ev = conf * odds - 1; // expected value per unit staked
        const kelly = (odds * conf - 1) / (odds - 1);
        return {
          ...p,
          implied_prob: implied * 100,
          edge: (conf - implied) * 100,
          kelly: Math.max(0, kelly) * 100,
          ev: ev * 100,
        } as ValueBet;
      })
      .filter((b): b is ValueBet => !!b && b.edge >= minEdge)
      .sort((a, b) => b.edge - a.edge)
      .slice(0, 20);
  }, [data, minEdge]);

  return (
    <TooltipProvider>
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Flame className="h-6 w-6 text-primary" />
                Value Bet Finder
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Picks where our model's confidence beats the bookmaker's implied probability.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              For entertainment only. 18+. Bet responsibly.
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="font-medium">Minimum edge</label>
              <span className="font-mono text-primary">{minEdge.toFixed(0)}%</span>
            </div>
            <Slider
              value={[minEdge]}
              onValueChange={(v) => setMinEdge(v[0])}
              min={0}
              max={30}
              step={1}
              aria-label="Minimum edge percentage"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : bets.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No value bets above {minEdge}% edge right now.</p>
              <p className="text-xs mt-1">Try lowering the threshold or check back after the next prediction refresh.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {bets.map((b) => (
                <li
                  key={b.id}
                  className="rounded-lg border border-border/60 bg-background/40 p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">
                          {b.home_team} <span className="text-muted-foreground">vs</span> {b.away_team}
                        </span>
                        <Badge variant="secondary" className="text-xs">{b.league}</Badge>
                      </div>
                      <p className="text-sm text-primary mt-1">
                        Pick: <span className="font-medium">{b.prediction}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(b.match_date).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm shrink-0">
                      <Metric
                        icon={<TrendingUp className="h-3.5 w-3.5" />}
                        label="Edge"
                        value={`+${b.edge.toFixed(1)}%`}
                        tone="positive"
                        hint="Model probability minus market implied probability."
                      />
                      <Metric
                        icon={<Percent className="h-3.5 w-3.5" />}
                        label="Kelly"
                        value={`${b.kelly.toFixed(1)}%`}
                        hint="Suggested fraction of bankroll (full Kelly)."
                      />
                      <Metric
                        icon={<Target className="h-3.5 w-3.5" />}
                        label="EV"
                        value={`${b.ev >= 0 ? "+" : ""}${b.ev.toFixed(1)}%`}
                        tone={b.ev >= 0 ? "positive" : "negative"}
                        hint="Expected value per 1 unit staked."
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Odds <span className="font-mono text-foreground">{b.odds_value?.toFixed(2)}</span></span>
                    <span>· Model <span className="font-mono text-foreground">{b.confidence}%</span></span>
                    <span>· Market <span className="font-mono text-foreground">{b.implied_prob.toFixed(1)}%</span></span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

const Metric = ({
  icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "positive" | "negative";
  hint: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="text-right cursor-help">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1 justify-end">
          {icon}
          {label}
        </div>
        <div
          className={
            "font-mono font-semibold " +
            (tone === "positive"
              ? "text-primary"
              : tone === "negative"
              ? "text-destructive"
              : "text-foreground")
          }
        >
          {value}
        </div>
      </div>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[220px] text-xs">
      {hint}
    </TooltipContent>
  </Tooltip>
);

export default ValueBetFinder;
