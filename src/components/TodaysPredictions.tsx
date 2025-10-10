import { PredictionCard } from "./PredictionCard";
import { usePredictions } from "@/hooks/usePredictions";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";

export const TodaysPredictions = () => {
  const { predictions, loading } = usePredictions();

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
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Today's AI Predictions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced machine learning predictions for today's biggest matches
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {predictions.map((prediction, index) => (
            <div
              key={prediction.id}
              className="animate-slide-up"
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
