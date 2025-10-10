import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TodaysPredictions } from "@/components/TodaysPredictions";
import { Features } from "@/components/Features";
import { ActiveContests } from "@/components/ActiveContests";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div id="predictions">
        <TodaysPredictions />
      </div>
      <ActiveContests />
      <Features />
    </div>
  );
};

export default Index;
