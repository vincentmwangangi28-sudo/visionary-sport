import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LiveMatches } from "@/components/LiveMatches";
import { UpcomingMatches } from "@/components/UpcomingMatches";
import { PredictionsDashboard } from "@/components/PredictionsDashboard";
import { PredictionPerformance } from "@/components/PredictionPerformance";
import { Features } from "@/components/Features";
import { ActiveContests } from "@/components/ActiveContests";
import { HowItWorks } from "@/components/HowItWorks";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";

const Index = () => {
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
