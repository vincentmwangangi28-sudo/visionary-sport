import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PredictionPerformance } from "@/components/PredictionPerformance";
import { AccuracyTracker } from "@/components/AccuracyTracker";
import { StreakDisplay } from "@/components/StreakDisplay";
import { RelatedContent } from "@/components/RelatedContent";

const Performance = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl mb-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
              Performance Dashboard
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your prediction accuracy, streaks, and overall performance
            </p>
          </div>
        </div>

        <PredictionPerformance />
        
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Detailed Analytics
              </h2>
              <p className="text-muted-foreground">
                Build winning streaks and see transparent accuracy stats
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StreakDisplay />
              <AccuracyTracker />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Performance;
