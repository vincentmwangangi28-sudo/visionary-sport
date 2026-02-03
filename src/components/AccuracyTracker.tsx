import { Card } from "./ui/card";
import { useAccuracyStats } from "@/hooks/useAccuracyStats";
import { Progress } from "./ui/progress";
import { BarChart, Target, TrendingUp } from "lucide-react";

export const AccuracyTracker = () => {
  const { stats, loading } = useAccuracyStats();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-green-500/5 to-blue-500/5">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-5 w-5 text-green-500" />
              <h3 className="text-xl font-bold text-foreground">Platform Accuracy</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on {stats.totalPredictions} verified predictions
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {stats.overall.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall</p>
          </div>
        </div>

        {/* By League */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart className="h-4 w-4 text-blue-500" />
            <h4 className="font-semibold text-sm text-foreground">Accuracy by League</h4>
          </div>
          <div className="space-y-3">
            {stats.byLeague.map((league, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{league.league}</span>
                  <span className="text-muted-foreground">
                    {league.accuracy.toFixed(1)}% ({league.total} predictions)
                  </span>
                </div>
                <Progress value={league.accuracy} className="h-2" aria-label={`${league.league} accuracy: ${league.accuracy.toFixed(1)}%`} />
              </div>
            ))}
          </div>
        </div>

        {/* By Confidence */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <h4 className="font-semibold text-sm text-foreground">Accuracy by Confidence Level</h4>
          </div>
          <div className="space-y-3">
            {stats.byConfidence.map((conf, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{conf.range}</span>
                  <span className="text-muted-foreground">
                    {conf.accuracy.toFixed(1)}% ({conf.total} predictions)
                  </span>
                </div>
                <Progress value={conf.accuracy} className="h-2" aria-label={`${conf.range} accuracy: ${conf.accuracy.toFixed(1)}%`} />
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trend */}
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-3">Weekly Performance</h4>
          <div className="grid grid-cols-4 gap-2">
            {stats.weekly.map((week, index) => (
              <div key={index} className="text-center">
                <div className="text-lg font-bold text-primary">
                  {week.accuracy.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">{week.week}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            ✅ All stats are updated in real-time and verified from match results
          </p>
        </div>
      </div>
    </Card>
  );
};
