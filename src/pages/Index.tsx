import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LiveMatches } from "@/components/LiveMatches";
import { LiveMatchTracker } from "@/components/LiveMatchTracker";
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
import { InteractivePolls } from "@/components/InteractivePolls";
import { TransferRumorsFeed } from "@/components/TransferRumorsFeed";
import { WhatsAppSubscription } from "@/components/WhatsAppSubscription";
import { EmailSubscription } from "@/components/EmailSubscription";
import { SmsSubscription } from "@/components/SmsSubscription";
import { AccuracyReportsCard } from "@/components/AccuracyReportsCard";
import { ReferralLeaderboard } from "@/components/ReferralLeaderboard";
import { PublicAccuracyDashboard } from "@/components/PublicAccuracyDashboard";

const Index = () => {
  useNotifications();
  
  useEffect(() => {
    initAnalytics();
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="AI Football Predictions Kenya - 85% Accuracy"
        description="Get AI-powered football predictions with 85%+ accuracy in Kenya. Daily betting tips, match analysis, upset alerts, and smart accumulators for Premier League, La Liga, Champions League."
        keywords={["AI predictions Kenya", "football predictions Nairobi", "betting tips Kenya", "Premier League predictions", "sports analysis Kenya", "accurate football tips"]}
        canonicalUrl="https://predictpro.guru"
        breadcrumbs={[
          { name: "Home", url: "https://predictpro.guru" }
        ]}
        faqs={[
          { question: "What is PredictPro?", answer: "PredictPro is an AI-powered sports prediction platform in Kenya offering 85%+ accuracy on football, basketball, and tennis predictions." },
          { question: "How accurate are the predictions?", answer: "Our AI model achieves 85%+ accuracy across major leagues including Premier League, La Liga, and Champions League." },
          { question: "How do I get predictions?", answer: "Sign up for free to access daily predictions. Premium members get unlimited predictions with higher confidence levels." }
        ]}
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

      {/* Live Match Tracker & Transfer Rumors */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LiveMatchTracker />
            </div>
            <div className="space-y-6">
              <TransferRumorsFeed />
              <InteractivePolls />
            </div>
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
              <WhatsAppSubscription />
              <BettingTipsHistory />
            </div>
          </div>
          
          {/* Subscription & Reports Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <EmailSubscription />
            <SmsSubscription />
            <AccuracyReportsCard />
          </div>
          
          {/* Referral & Trust Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <ReferralLeaderboard />
            <PublicAccuracyDashboard />
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
