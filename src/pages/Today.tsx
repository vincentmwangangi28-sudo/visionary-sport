import { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";

const TodayMatchesDashboard = lazy(() => import("@/components/TodayMatchesDashboard"));

const Today = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Today's Match Predictions | PredictPro AI</title>
        <meta
          name="description"
          content="AI-powered football match predictions for today with confidence scores, expert reasoning, and premium insights."
        />
        <link rel="canonical" href="https://visionary-sport.lovable.app/today" />
      </Helmet>
      <Navbar />
      <main>
        <Suspense fallback={<Skeleton className="mx-auto my-12 h-96 max-w-6xl" />}>
          <TodayMatchesDashboard />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Today;
