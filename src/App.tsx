import "./App.css";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";

// Eagerly load the main index page for fast LCP
import Index from "./pages/Index";

// Lazy load all other pages for reduced initial bundle size
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthError = lazy(() => import("./pages/AuthError"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Insights = lazy(() => import("./pages/Insights"));
const Performance = lazy(() => import("./pages/Performance"));
const About = lazy(() => import("./pages/About"));
const Shop = lazy(() => import("./pages/Shop"));
const Rewards = lazy(() => import("./pages/Rewards"));
const News = lazy(() => import("./pages/News"));
const NotFound = lazy(() => import("./pages/NotFound"));
const MatchDetail = lazy(() => import("./pages/MatchDetail"));
const ResponsibleGaming = lazy(() => import("./pages/ResponsibleGaming"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Today = lazy(() => import("./pages/Today"));
const MathematicalPredictionsGuide = lazy(() => import("./pages/MathematicalPredictionsGuide"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24h — keep cache long enough to persist
    },
  },
});

const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: "predictpro-query-cache",
  throttleTime: 1000,
});

// Only persist the queries we want available offline
const persistOptions = {
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24h
  dehydrateOptions: {
    shouldDehydrateQuery: (query: any) => {
      const key = query.queryKey?.[0];
      return key === "news-articles" || key === "predictions";
    },
  },
};

// Minimal loading fallback to avoid layout shift
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <HelmetProvider>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/auth/error" element={<AuthError />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/news" element={<News />} />
              <Route path="/about" element={<About />} />
              <Route path="/match/:matchId" element={<MatchDetail />} />
              <Route path="/responsible-gaming" element={<ResponsibleGaming />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/today" element={<Today />} />
              <Route path="/guides/mathematical-football-predictions" element={<MathematicalPredictionsGuide />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </PersistQueryClientProvider>
  </HelmetProvider>
);

export default App;
