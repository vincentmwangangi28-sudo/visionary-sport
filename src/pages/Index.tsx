import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { TodaysPredictions } from "@/components/TodaysPredictions";
import { Features } from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <TodaysPredictions />
      <Features />
    </div>
  );
};

export default Index;
