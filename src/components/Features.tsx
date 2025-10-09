import { Card } from "@/components/ui/card";
import { Brain, Shield, TrendingUp, Zap, Award, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Advanced machine learning models analyze team form, player stats, and historical data",
  },
  {
    icon: TrendingUp,
    title: "High Accuracy",
    description: "Consistently achieving 87% prediction accuracy across multiple sports",
  },
  {
    icon: Zap,
    title: "Real-Time Updates",
    description: "Predictions updated instantly as match conditions and team news change",
  },
  {
    icon: Shield,
    title: "Transparent Reasoning",
    description: "See exactly why the AI made each prediction with detailed explanations",
  },
  {
    icon: Award,
    title: "Leaderboard Contests",
    description: "Compete with other users and win prizes based on prediction accuracy",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Track your prediction history and performance with comprehensive stats",
  },
];

export const Features = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Why Choose <span className="bg-gradient-hero bg-clip-text text-transparent">PredictPro</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cutting-edge AI technology meets sports expertise
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="p-6 hover:shadow-card transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
