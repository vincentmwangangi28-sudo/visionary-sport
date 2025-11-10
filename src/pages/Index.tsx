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

const Index = () => {
  useNotifications();
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StreakDisplay />
            <AccuracyTracker />
          </div>
        </div>
      </section>

      <div id="how-it-works">
        <HowItWorks />
      </div>
      <ActiveContests />
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
