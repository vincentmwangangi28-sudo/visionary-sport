import { Card } from "@/components/ui/card";
import { Brain, Shield, TrendingUp, Zap, Award, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Transform Data into Winning Strategies",
    description: "Advanced AI processes thousands of data points—team form, player injuries, weather conditions—to deliver predictions you can trust",
  },
  {
    icon: TrendingUp,
    title: "87% Win Rate You Can Count On",
    description: "Join thousands of users who have increased their betting success by leveraging our consistently accurate AI predictions",
  },
  {
    icon: Zap,
    title: "Stay Ahead with Live Intelligence",
    description: "Never miss a beat—predictions update in real-time as team news breaks and match conditions evolve",
  },
  {
    icon: Shield,
    title: "Full Transparency, Zero Guesswork",
    description: "Every prediction comes with detailed AI reasoning so you understand exactly why we recommend each outcome",
  },
  {
    icon: Award,
    title: "Compete and Win Big",
    description: "Climb the leaderboard, prove your prediction skills, and earn exclusive rewards in weekly contests",
  },
  {
    icon: BarChart3,
    title: "Track Your Journey to Success",
    description: "Monitor your prediction performance, identify winning patterns, and continuously improve your betting strategy",
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
