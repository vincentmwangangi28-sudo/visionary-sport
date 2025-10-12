import { PredictionCard } from "./PredictionCard";
import { usePredictions } from "@/hooks/usePredictions";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Zap } from "lucide-react";
import { useState, useEffect } from "react";

export const TodaysPredictions = () => {
  const { predictions, loading } = usePredictions();
  const [newPredictionId, setNewPredictionId] = useState<string | null>(null);

  // Highlight new predictions temporarily
  useEffect(() => {
    if (predictions.length > 0 && predictions[0]) {
      setNewPredictionId(predictions[0].id);
      const timer = setTimeout(() => setNewPredictionId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [predictions.length]);

  if (loading) {
    return (
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Today's AI Predictions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced machine learning predictions for today's biggest matches
            </p>
          </div>
          <div className="max-w-5xl mx-auto space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (predictions.length === 0) {
    return (
      <section className="py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Today's AI Predictions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced machine learning predictions for today's biggest matches
            </p>
          </div>
          <div className="max-w-5xl mx-auto text-center py-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              No predictions available yet. Generate your first prediction above!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-primary animate-pulse-glow" />
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Live AI Predictions
            </h2>
            <Zap className="h-8 w-8 text-primary animate-pulse-glow" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time AI predictions powered by advanced machine learning
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow"></div>
            <span className="text-sm font-medium text-primary">Live Updates Enabled</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {predictions.map((prediction, index) => (
            <div
              key={prediction.id}
              className={`animate-slide-up hover-lift transition-all duration-500 ${
                newPredictionId === prediction.id 
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse-glow' 
                  : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PredictionCard
                homeTeam={prediction.home_team}
                awayTeam={prediction.away_team}
                league={prediction.league}
                prediction={prediction.prediction}
                confidence={prediction.confidence}
                reasoning={prediction.reasoning}
                matchDate={new Date(prediction.match_date).toLocaleDateString()}
                matchTime={new Date(prediction.match_date).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
