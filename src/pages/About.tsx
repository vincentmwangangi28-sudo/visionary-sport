import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Target, Zap, Shield, Users, Brain, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const About = () => {
  const [stats, setStats] = useState({
    totalPredictions: 0,
    accuracy: 0,
    activeUsers: 0,
    leagues: 0
  });

  useEffect(() => {
    // Animate stats on mount
    const timer = setTimeout(() => {
      setStats({
        totalPredictions: 50000,
        accuracy: 87,
        activeUsers: 10000,
        leagues: 25
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Predictions",
      description: "Our advanced machine learning models analyze thousands of data points to generate accurate predictions."
    },
    {
      icon: Target,
      title: "87% Accuracy Rate",
      description: "Industry-leading prediction accuracy verified by thousands of users across Kenya and beyond."
    },
    {
      icon: Zap,
      title: "Real-Time Updates",
      description: "Live match updates and instant predictions delivered as games unfold."
    },
    {
      icon: Shield,
      title: "Transparent & Secure",
      description: "Full prediction history tracking and secure authentication to protect your data."
    },
    {
      icon: Users,
      title: "Community-Driven",
      description: "Join 10,000+ bettors making smarter decisions with our AI insights."
    },
    {
      icon: TrendingUp,
      title: "Continuous Learning",
      description: "Our AI models improve daily by learning from outcomes and refining predictions."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="px-4 mb-16">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              About PredictPro
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We're revolutionizing sports betting with AI-powered predictions that help you make smarter, 
              more informed decisions. Founded in 2024, PredictPro combines cutting-edge machine learning 
              with deep football analytics to deliver the most accurate predictions in the market.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-4 mb-16">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.totalPredictions.toLocaleString()}+
                </div>
                <div className="text-sm text-muted-foreground">Total Predictions</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.accuracy}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy Rate</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.activeUsers.toLocaleString()}+
                </div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.leagues}+
                </div>
                <div className="text-sm text-muted-foreground">Leagues Covered</div>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 mb-16">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
              Why Choose PredictPro?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="p-6 hover-lift">
                    <div className="p-3 rounded-lg bg-gradient-victory inline-block mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="p-8 md:p-12 bg-gradient-prediction">
              <h2 className="text-3xl font-bold mb-4 text-foreground text-center">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed text-center">
                To democratize access to professional-grade sports analytics and empower bettors 
                across Africa with AI-driven insights. We believe everyone deserves access to accurate, 
                transparent, and reliable predictions that level the playing field.
              </p>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
