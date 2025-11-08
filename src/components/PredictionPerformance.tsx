import { Card } from "@/components/ui/card";
import { useUserPerformance } from "@/hooks/useUserPerformance";
import { BarChart3, Target, TrendingUp, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const PredictionPerformance = () => {
  const { performance, loading } = useUserPerformance();

  if (loading) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Your Prediction Performance</h2>
            <p className="text-muted-foreground">Loading your stats...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!performance) return null;

  const stats = [
    {
      icon: BarChart3,
      label: "Total Predictions",
      value: performance.total_predictions,
      color: "text-primary"
    },
    {
      icon: CheckCircle,
      label: "Correct Predictions",
      value: performance.correct_predictions,
      color: "text-primary"
    },
    {
      icon: Target,
      label: "Average Confidence",
      value: `${performance.average_confidence}%`,
      color: "text-secondary"
    },
    {
      icon: TrendingUp,
      label: "Win Rate",
      value: `${performance.win_rate}%`,
      color: "text-accent"
    }
  ];

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">📈 Your Prediction Performance</h2>
          <p className="text-muted-foreground">Track your success with AI-powered predictions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6 hover-lift bg-card border-border">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-victory ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="p-8 bg-gradient-prediction border-border">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2 text-foreground">Win Rate Progress</h3>
            <Progress value={performance.win_rate} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              You're performing {performance.win_rate >= 70 ? 'excellently' : 'well'}! Keep it up.
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              💡 <strong>Tip:</strong> Want to improve your win rate? Try filtering predictions by confidence above 70% for higher accuracy.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
};
