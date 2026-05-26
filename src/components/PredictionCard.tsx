import { SharePrediction } from '@/components/SharePrediction';
import { Card } from "@/components/ui/card";
import { SharePrediction } from '@/components/SharePrediction';
import { Badge } from "@/components/ui/badge";
import { SharePrediction } from '@/components/SharePrediction';
import { Progress } from "@/components/ui/progress";
import { SharePrediction } from '@/components/SharePrediction';
import { TrendingUp, Calendar, Clock } from "lucide-react";

interface PredictionCardProps {
  homeTeam: string; awayTeam: string; league: string; prediction: string;
  confidence: number; reasoning: string; matchTime: string; matchDate: string;
}
function getConfidenceTier(conf: number) {
  if (conf >= 75) return { color: 'text-green-500', dot: '🟢', label: 'High', variant: 'default' as const };
  if (conf >= 50) return { color: 'text-yellow-500', dot: '🟡', label: 'Medium', variant: 'secondary' as const };
  return { color: 'text-red-500', dot: '🔴', label: 'Low', variant: 'outline' as const };
}
function ConfidenceGauge({ value }: { value: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const tier = getConfidenceTier(value);
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className={tier.color}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${tier.color}`}>{value}%</span>
      </div>
    </div>
  );
}

const sharePrediction = async (prediction: Prediction) => {
  const text = `🤖 AI Prediction: ${prediction.home_team} vs ${prediction.away_team}\n📊 ${prediction.prediction} (${prediction.confidence}% confidence)\n⚽ ${prediction.league}\n\nGet yours at predictpro.guru`;
  if (navigator.share) {
    await navigator.share({ title: 'PredictPro Prediction', text, url: 'https://predictpro.guru' });
  } else {
    await navigator.clipboard.writeText(text);
  }
};

export const PredictionCard = ({ homeTeam, awayTeam, league, prediction, confidence, reasoning, matchTime, matchDate }: PredictionCardProps) => {
  const tier = getConfidenceTier(confidence);
  const trackView = () => {
    if (typeof window !== 'undefined' && (window as any).gtag)
      (window as any).gtag('event', 'prediction_view', { event_category: 'Predictions', event_label: `${homeTeam} vs ${awayTeam}`, value: confidence });
  };
  return (
    <Card className="p-6 hover-lift hover-glow transition-all duration-300 bg-gradient-prediction border-primary/10 animate-fade-in cursor-pointer" onClick={trackView}>
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="text-xs">{league}</Badge>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{matchDate}</span></div>
          <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{matchTime}</span></div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">{homeTeam}</h3>
        <span className="text-muted-foreground font-medium">vs</span>
        <h3 className="text-xl font-bold">{awayTeam}</h3>
      </div>
      <div className="flex items-start gap-4 mb-4">
        <ConfidenceGauge value={confidence} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /><span className="font-semibold text-sm">AI Prediction</span></div>
            <Badge variant={tier.variant} className="text-xs gap-1">{tier.dot} {tier.label}</Badge>
          </div>
          <p className="text-lg font-bold text-primary mb-1">{prediction}</p>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{reasoning}</p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Confidence</span><span className={`font-bold ${tier.color}`}>{confidence}%</span>
        </div>
        <Progress value={confidence} className="h-1.5" />
      </div>
    </Card>
  );
};
