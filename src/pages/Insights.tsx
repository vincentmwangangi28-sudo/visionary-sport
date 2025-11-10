import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Target, BarChart } from "lucide-react";

const Insights = () => {
  const insights = [
    {
      id: 1,
      title: "How Our AI Achieves 87% Prediction Accuracy",
      excerpt: "Deep dive into the machine learning models and data sources that power PredictPro's industry-leading prediction accuracy.",
      category: "AI Technology",
      date: "2025-11-08",
      readTime: "5 min read",
      icon: Target
    },
    {
      id: 2,
      title: "Premier League Betting Trends: November 2025",
      excerpt: "Analysis of the most profitable betting strategies and patterns we've identified in the Premier League this month.",
      category: "Strategy",
      date: "2025-11-07",
      readTime: "7 min read",
      icon: TrendingUp
    },
    {
      id: 3,
      title: "Understanding Confidence Scores",
      excerpt: "Learn how to interpret our AI confidence scores and use them to make smarter betting decisions.",
      category: "Education",
      date: "2025-11-05",
      readTime: "4 min read",
      icon: BarChart
    },
    {
      id: 4,
      title: "Top 5 Leagues for AI Predictions",
      excerpt: "Which football leagues provide the most reliable data for AI predictions? Our comprehensive analysis.",
      category: "Analysis",
      date: "2025-11-03",
      readTime: "6 min read",
      icon: Target
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Insights & Analysis
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Expert insights, betting strategies, and AI technology deep dives from the PredictPro team
            </p>
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((insight) => {
              const Icon = insight.icon;
              return (
                <Card key={insight.id} className="p-6 hover-lift cursor-pointer group">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-gradient-victory">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2">
                        {insight.category}
                      </Badge>
                      <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {insight.title}
                      </h2>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    {insight.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(insight.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                    <span>•</span>
                    <span>{insight.readTime}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* CTA Section */}
          <Card className="mt-12 p-8 bg-gradient-prediction text-center">
            <h3 className="text-2xl font-bold mb-3 text-foreground">
              Want More Insights?
            </h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to our newsletter for weekly analysis, betting tips, and AI prediction updates.
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg bg-background border border-border text-foreground"
              />
              <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Insights;
