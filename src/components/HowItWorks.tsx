import { Target, Sparkles, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Target,
    number: "01",
    title: "Select Your Match",
    description: "Browse today's upcoming matches across multiple leagues and competitions",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "AI Analyzes Instantly",
    description: "Our advanced AI processes team form, player stats, head-to-head records, and real-time conditions in seconds",
  },
  {
    icon: Trophy,
    number: "03",
    title: "Make Informed Decisions",
    description: "Get detailed predictions with confidence scores, expert reasoning, and win more consistently",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How <span className="bg-gradient-hero bg-clip-text text-transparent">It Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From match selection to winning predictions in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index}
                className="relative p-8 hover:shadow-card transition-all duration-300 hover:-translate-y-2 group"
              >
                {/* Step Number */}
                <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-hero flex items-center justify-center shadow-elegant">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                  <Icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>

                {/* Connector Arrow (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform translate-x-full -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
