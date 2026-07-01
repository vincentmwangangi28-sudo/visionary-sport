import { useEffect, lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { SEOHead } from "@/components/SEOHead";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useNotifications } from "@/hooks/useNotifications";
import { initAnalytics } from "@/lib/analytics";

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

const SectionLoader = () => <div className="min-h-[180px]" />;

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
        breadcrumbs={[{ name: "Home", url: "https://predictpro.guru" }]}
        faqs={[
          { question: "What is PredictPro?", answer: "PredictPro is an AI-powered sports prediction platform in Kenya offering 85%+ accuracy on football, basketball, and tennis predictions." },
          { question: "How accurate are the predictions?", answer: "Our AI model achieves 85%+ accuracy across major leagues including Premier League, La Liga, and Champions League." },
          { question: "How do I get predictions?", answer: "Sign up for free to access daily predictions. Premium members get unlimited predictions with higher confidence levels." }
        ]}
      />
      <Navbar />
      <main id="main-content">
      <Hero />
      
      
      {/* Above-fold lazy sections */}
      <Suspense fallback={<SectionLoader />}>
        <section className="py-10 px-4 bg-grid-pattern">
          <div className="container mx-auto">
            <ScrollReveal>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Smart Betting Tools</h2>
                <p className="text-muted-foreground mt-1.5 text-sm md:text-base">AI-powered tools to maximize your wins</p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <ScrollReveal delay={0.05}><SmartSlipBuilder /></ScrollReveal>
              <ScrollReveal delay={0.1}><ConfidenceHeatmap /></ScrollReveal>
              <ScrollReveal delay={0.15}><UpsetAlerts /></ScrollReveal>
            </div>
          </div>
        </section>

        <div className="section-divider" />

        <section className="py-10 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <ScrollReveal className="lg:col-span-2">
                <LiveMatchTracker />
              </ScrollReveal>
              <div className="space-y-5">
                <ScrollReveal delay={0.1} direction="right"><TransferRumorsFeed /></ScrollReveal>
                <ScrollReveal delay={0.15} direction="right"><InteractivePolls /></ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        <ScrollReveal><LiveMatches /></ScrollReveal>
        <ScrollReveal><UpcomingMatches /></ScrollReveal>
      </Suspense>

      {/* Mid-page sections */}
      <Suspense fallback={<SectionLoader />}>
        <div className="section-divider" />
        
        <ScrollReveal>
          <div id="predictions"><PredictionsDashboard /></div>
        </ScrollReveal>
        <ScrollReveal><PredictionPerformance /></ScrollReveal>
        
        <section className="py-10 px-4 bg-muted/20 bg-grid-pattern">
          <div className="container mx-auto">
            <ScrollReveal>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Track Your Progress</h2>
                <p className="text-muted-foreground mt-1.5 text-sm md:text-base">Build winning streaks and see transparent accuracy stats</p>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              <ScrollReveal delay={0.05}><StreakDisplay /></ScrollReveal>
              <ScrollReveal delay={0.1}><AccuracyTracker /></ScrollReveal>
              <ScrollReveal delay={0.15}><UserBadges /></ScrollReveal>
              <ScrollReveal delay={0.2}>
                <div className="space-y-4">
                  <PushNotifications />
                  <WhatsAppSubscription />
                  <BettingTipsHistory />
                </div>
              </ScrollReveal>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mt-6">
              <ScrollReveal delay={0.05}><EmailSubscription /></ScrollReveal>
              <ScrollReveal delay={0.1}><SmsSubscription /></ScrollReveal>
              <ScrollReveal delay={0.15}><AccuracyReportsCard /></ScrollReveal>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
              <ScrollReveal direction="left"><ReferralLeaderboard /></ScrollReveal>
              <ScrollReveal direction="right"><PublicAccuracyDashboard /></ScrollReveal>
            </div>
          </div>
        </section>
      </Suspense>

      {/* Below-fold sections */}
      <Suspense fallback={<SectionLoader />}>
        <div className="section-divider" />

        <ScrollReveal><div id="how-it-works"><HowItWorks /></div></ScrollReveal>
        <ScrollReveal><ActiveContests /></ScrollReveal>
        
        <ScrollReveal>
          <section className="py-10 px-4">
            <div className="container mx-auto max-w-md">
              <PremiumUpgradeCard />
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal><div id="features"><Features /></div></ScrollReveal>
        <ScrollReveal><div id="testimonials"><Testimonials /></div></ScrollReveal>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
