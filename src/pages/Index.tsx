import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LiveMatches } from "@/components/LiveMatches";
import { UpcomingMatches } from "@/components/UpcomingMatches";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { PredictionPerformance } from "@/components/PredictionPerformance";
import { StreakDisplay } from "@/components/StreakDisplay";
import { AccuracyTracker } from "@/components/AccuracyTracker";
import { Features } from "@/components/Features";
import { ActiveContests } from "@/components/ActiveContests";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { useNotifications } from "@/hooks/useNotifications";
import { PremiumUpgradeCard } from "@/components/PremiumUpgradeCard";
import { initAnalytics } from "@/lib/analytics";
import { BettingTipsHistory } from "@/components/BettingTipsHistory";
import { PushNotifications } from "@/components/PushNotifications";
import { SmartSlipBuilder } from "@/components/SmartSlipBuilder";
import { ConfidenceHeatmap } from "@/components/ConfidenceHeatmap";
import { UpsetAlerts } from "@/components/UpsetAlerts";
import { UserBadges } from "@/components/UserBadges";
import { SEOHead } from "@/components/SEOHead";

const Index = () => {
  useNotifications();
  
  useEffect(() => {
    initAnalytics();
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="AI Sports Predictions - Football, Basketball, Tennis | PredictPro"
        description="Get AI-powered sports predictions with 85%+ accuracy. Multi-sport predictions for football, basketball, tennis with confidence scores, upset alerts, and smart accumulators."
        keywords={["AI predictions", "football predictions", "basketball predictions", "betting tips", "sports analysis", "Kenya predictions"]}
      />
      <Navbar />
      <Hero />
      
      {/* Smart Tools Section */}
      <section className="py-8 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SmartSlipBuilder />
            <ConfidenceHeatmap />
            <UpsetAlerts />
          </div>
        </div>
      </section>

      <LiveMatches />
      <UpcomingMatches />
      <div id="predictions">
        <PredictionsDashboard />
      </div>
      <PredictionPerformance />
      
      {/* Streak Challenges & Accuracy Tracker */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Track Your Progress
            </h2>
            <p className="text-muted-foreground">
              Build winning streaks and see our transparent accuracy stats
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <StreakDisplay />
            <AccuracyTracker />
            <UserBadges />
            <div className="space-y-4">
              <PushNotifications />
              <BettingTipsHistory />
            </div>
          </div>
        </div>
      </section>

      <div id="how-it-works">
        <HowItWorks />
      </div>
      <ActiveContests />
      
      {/* Premium Upgrade Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-md">
          <PremiumUpgradeCard />
        </div>
      </section>

      <div id="features">
        <Features />
      </div>
      <div id="testimonials">
        <Testimonials />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
