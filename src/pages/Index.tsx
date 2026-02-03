import { useEffect, lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SEOHead } from "@/components/SEOHead";
import { useNotifications } from "@/hooks/useNotifications";
import { initAnalytics } from "@/lib/analytics";

// Lazy load below-the-fold components to reduce main-thread work
const LiveMatches = lazy(() => import("@/components/LiveMatches").then(m => ({ default: m.LiveMatches })));
const LiveMatchTracker = lazy(() => import("@/components/LiveMatchTracker").then(m => ({ default: m.LiveMatchTracker })));
const UpcomingMatches = lazy(() => import("@/components/UpcomingMatches").then(m => ({ default: m.UpcomingMatches })));
const PredictionsDashboard = lazy(() => import("@/components/PredictionsDashboard").then(m => ({ default: m.PredictionsDashboard })));
const PredictionPerformance = lazy(() => import("@/components/PredictionPerformance").then(m => ({ default: m.PredictionPerformance })));
const StreakDisplay = lazy(() => import("@/components/StreakDisplay").then(m => ({ default: m.StreakDisplay })));
const AccuracyTracker = lazy(() => import("@/components/AccuracyTracker").then(m => ({ default: m.AccuracyTracker })));
const Features = lazy(() => import("@/components/Features").then(m => ({ default: m.Features })));
const ActiveContests = lazy(() => import("@/components/ActiveContests").then(m => ({ default: m.ActiveContests })));
const HowItWorks = lazy(() => import("@/components/HowItWorks").then(m => ({ default: m.HowItWorks })));
const Testimonials = lazy(() => import("@/components/Testimonials").then(m => ({ default: m.Testimonials })));
const Footer = lazy(() => import("@/components/Footer").then(m => ({ default: m.Footer })));
const PremiumUpgradeCard = lazy(() => import("@/components/PremiumUpgradeCard").then(m => ({ default: m.PremiumUpgradeCard })));
const BettingTipsHistory = lazy(() => import("@/components/BettingTipsHistory").then(m => ({ default: m.BettingTipsHistory })));
const PushNotifications = lazy(() => import("@/components/PushNotifications").then(m => ({ default: m.PushNotifications })));
const SmartSlipBuilder = lazy(() => import("@/components/SmartSlipBuilder").then(m => ({ default: m.SmartSlipBuilder })));
const ConfidenceHeatmap = lazy(() => import("@/components/ConfidenceHeatmap").then(m => ({ default: m.ConfidenceHeatmap })));
const UpsetAlerts = lazy(() => import("@/components/UpsetAlerts").then(m => ({ default: m.UpsetAlerts })));
const UserBadges = lazy(() => import("@/components/UserBadges").then(m => ({ default: m.UserBadges })));
const InteractivePolls = lazy(() => import("@/components/InteractivePolls").then(m => ({ default: m.InteractivePolls })));
const TransferRumorsFeed = lazy(() => import("@/components/TransferRumorsFeed").then(m => ({ default: m.TransferRumorsFeed })));
const WhatsAppSubscription = lazy(() => import("@/components/WhatsAppSubscription").then(m => ({ default: m.WhatsAppSubscription })));
const EmailSubscription = lazy(() => import("@/components/EmailSubscription").then(m => ({ default: m.EmailSubscription })));
const SmsSubscription = lazy(() => import("@/components/SmsSubscription").then(m => ({ default: m.SmsSubscription })));
const AccuracyReportsCard = lazy(() => import("@/components/AccuracyReportsCard").then(m => ({ default: m.AccuracyReportsCard })));
const ReferralLeaderboard = lazy(() => import("@/components/ReferralLeaderboard").then(m => ({ default: m.ReferralLeaderboard })));
const PublicAccuracyDashboard = lazy(() => import("@/components/PublicAccuracyDashboard").then(m => ({ default: m.PublicAccuracyDashboard })));

// Minimal loading placeholder for lazy components
const SectionLoader = () => <div className="min-h-[200px]" />;

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
      
      <Suspense fallback={<SectionLoader />}>
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
      </Suspense>
    </div>
  );
};

export default Index;
