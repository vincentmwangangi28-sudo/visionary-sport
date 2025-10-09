import { PredictionCard } from "./PredictionCard";

const mockPredictions = [
  {
    homeTeam: "Gor Mahia",
    awayTeam: "AFC Leopards",
    league: "FKF Premier League",
    prediction: "Gor Mahia to Win",
    confidence: 78,
    reasoning: "Gor Mahia's strong home record (8-2-0) and AFC's recent away struggles suggest a home victory. Both teams have key players available.",
    matchTime: "15:00 EAT",
    matchDate: "Today",
  },
  {
    homeTeam: "Arsenal",
    awayTeam: "Manchester United",
    league: "Premier League",
    prediction: "Arsenal Win or Draw",
    confidence: 65,
    reasoning: "Arsenal's current form and home advantage, combined with United's defensive vulnerabilities, indicate a likely Arsenal result.",
    matchTime: "17:30 GMT",
    matchDate: "Today",
  },
  {
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    league: "La Liga",
    prediction: "Over 2.5 Goals",
    confidence: 82,
    reasoning: "El Clásico historically produces goals. Both teams averaging 2.8 goals/game. Recent H2H shows 4 of last 5 had 3+ goals.",
    matchTime: "20:00 CET",
    matchDate: "Today",
  },
  {
    homeTeam: "Tusker FC",
    awayTeam: "Kakamega Homeboyz",
    league: "FKF Premier League",
    prediction: "Both Teams to Score",
    confidence: 71,
    reasoning: "Tusker's attacking prowess (25 goals in 15 games) vs Kakamega's defensive weaknesses. Both teams scored in last 3 meetings.",
    matchTime: "16:00 EAT",
    matchDate: "Today",
  },
];

export const TodaysPredictions = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Today's <span className="bg-gradient-hero bg-clip-text text-transparent">AI Predictions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fresh predictions updated daily using advanced AI analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {mockPredictions.map((prediction, index) => (
            <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <PredictionCard {...prediction} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
