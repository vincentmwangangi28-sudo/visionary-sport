import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Clock } from "lucide-react";

interface PredictionCardProps {
  homeTeam: string;
  awayTeam: string;
  league: string;
  prediction: string;
  confidence: number;
  reasoning: string;
  matchTime: string;
  matchDate: string;
}

export const PredictionCard = ({
  homeTeam,
  awayTeam,
  league,
  prediction,
  confidence,
  reasoning,
  matchTime,
  matchDate,
}: PredictionCardProps) => {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 75) return "text-primary";
    if (conf >= 50) return "text-secondary";
    return "text-muted-foreground";
  };

  const getConfidenceBadge = (conf: number) => {
    if (conf >= 75) return { label: "High", variant: "default" as const };
    if (conf >= 50) return { label: "Medium", variant: "secondary" as const };
    return { label: "Low", variant: "outline" as const };
  };

  const badge = getConfidenceBadge(confidence);

  return (
    <Card className="p-6 hover:shadow-card transition-all duration-300 bg-gradient-prediction border-primary/10">
      {/* League Badge */}
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="text-xs">
          {league}
        </Badge>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{matchDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{matchTime}</span>
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">{homeTeam}</h3>
          <span className="text-muted-foreground">vs</span>
          <h3 className="text-xl font-bold">{awayTeam}</h3>
        </div>
      </div>

      {/* Prediction */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-semibold">AI Prediction:</span>
          </div>
          <Badge variant={badge.variant}>{badge.label} Confidence</Badge>
        </div>
        <p className="text-lg font-bold text-primary mb-2">{prediction}</p>
        <p className="text-sm text-muted-foreground">{reasoning}</p>
      </div>

      {/* Confidence Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence Level</span>
          <span className={`font-bold ${getConfidenceColor(confidence)}`}>
            {confidence}%
          </span>
        </div>
        <Progress value={confidence} className="h-2" />
      </div>
    </Card>
  );
};
