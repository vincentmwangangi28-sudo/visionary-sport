import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Clock } from "lucide-react";
import { SocialShare } from "@/components/SocialShare";

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
  // GA4 Event Tracking
  const trackPredictionView = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'prediction_view', {
        'event_category': 'Predictions',
        'event_label': `${homeTeam} vs ${awayTeam}`,
        'value': confidence
      });
    }
  };

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

  // Enhanced structured data for SportsEvent
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${homeTeam} vs ${awayTeam}`,
    "startDate": `${matchDate}T${matchTime}:00+03:00`,
    "homeTeam": { "@type": "SportsTeam", "name": homeTeam },
    "awayTeam": { "@type": "SportsTeam", "name": awayTeam },
    "sport": "Football",
    "location": { 
      "@type": "Place", 
      "name": league 
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "additionalProperty": [
      { 
        "@type": "PropertyValue", 
        "name": "Recommended Outcome", 
        "value": prediction 
      },
      { 
        "@type": "PropertyValue", 
        "name": "Confidence Score", 
        "value": `${confidence}%` 
      },
      {
        "@type": "PropertyValue",
        "name": "AI Reasoning",
        "value": reasoning
      }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Card 
        className="p-6 hover-lift hover-glow transition-all duration-300 bg-gradient-prediction border-primary/10 animate-fade-in"
        onClick={trackPredictionView}
      >
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
          <Progress value={confidence} className="h-2" aria-label={`Prediction confidence: ${confidence}%`} />
        </div>

        {/* Social Share */}
        <div className="mt-4 flex justify-end">
          <SocialShare
            title={`${homeTeam} vs ${awayTeam}`}
            prediction={prediction}
            confidence={confidence}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            league={league}
          />
        </div>
      </Card>
    </>
  );
};
