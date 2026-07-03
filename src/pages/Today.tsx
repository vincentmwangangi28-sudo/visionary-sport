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
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Today's Match Predictions | PredictPro AI" />
        <meta property="og:description" content="AI football predictions for today's matches with confidence scores and expert reasoning." />
        <meta property="og:url" content="https://visionary-sport.lovable.app/today" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Today's Match Predictions | PredictPro AI" />
        <meta name="twitter:description" content="AI football predictions for today's matches with confidence scores and expert reasoning." />
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
