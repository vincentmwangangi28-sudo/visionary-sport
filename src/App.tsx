import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AIChatbot } from "@/components/AIChatbot";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { queryClient } from "@/lib/queryClient";
import { Suspense, lazy } from "react";

const Index             = lazy(() => import("./pages/Index"));
const Auth              = lazy(() => import("./pages/Auth"));
const Leaderboard       = lazy(() => import("./pages/Leaderboard"));
const Insights          = lazy(() => import("./pages/Insights"));
const Performance       = lazy(() => import("./pages/Performance"));
const About             = lazy(() => import("./pages/About"));
const Shop              = lazy(() => import("./pages/Shop"));
const Rewards           = lazy(() => import("./pages/Rewards"));
const News              = lazy(() => import("./pages/News"));
const AccumulatorBuilder= lazy(() => import("./pages/AccumulatorBuilder"));
const ValueBets         = lazy(() => import("./pages/ValueBets"));
const Tipsters          = lazy(() => import("./pages/Tipsters"));
const BankrollManager   = lazy(() => import("./pages/BankrollManager"));
const LiveScores        = lazy(() => import("./pages/LiveScores"));
const MatchPredictor    = lazy(() => import("./pages/MatchPredictor"));
const BestBets          = lazy(() => import("./pages/BestBets"));
const AdminDashboard    = lazy(() => import("./pages/AdminDashboard"));
const NotFound          = lazy(() => import("./pages/NotFound"));
const OtherSports       = lazy(() => import("./pages/OtherSports"));
const Statistics        = lazy(() => import("./pages/Statistics"));
const Highlights        = lazy(() => import("./pages/Highlights"));
const PlayerSearch      = lazy(() => import("./pages/PlayerSearch"));
const Standings         = lazy(() => import("./pages/Standings"));
const CorrectScore      = lazy(() => import("./pages/CorrectScore"));
const BTTS              = lazy(() => import("./pages/BTTS"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black">PP</div>
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"              element={<Index />} />
                <Route path="/auth"          element={<Auth />} />
                <Route path="/about"         element={<About />} />
                <Route path="/leaderboard"   element={<Leaderboard />} />
                <Route path="/insights"      element={<Insights />} />
                <Route path="/news"          element={<News />} />
                <Route path="/live"          element={<LiveScores />} />
                <Route path="/value-bets"    element={<ValueBets />} />
                <Route path="/accumulator"   element={<AccumulatorBuilder />} />
                <Route path="/tipsters"      element={<Tipsters />} />
                <Route path="/bankroll"      element={<BankrollManager />} />
                <Route path="/predict"       element={<MatchPredictor />} />
                <Route path="/best-bets"     element={<BestBets />} />
                <Route path="/performance"   element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                <Route path="/shop"          element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                <Route path="/rewards"       element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
                <Route path="/admin"         element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/correct-score" element={<CorrectScore />} />
                <Route path="/btts"          element={<BTTS />} />
                <Route path="/sports"        element={<OtherSports />} />
                <Route path="/statistics"    element={<Statistics />} />
                <Route path="/highlights"   element={<Highlights />} />
                <Route path="/players"       element={<PlayerSearch />} />
                <Route path="/standings"     element={<Standings />} />
                <Route path="*"             element={<NotFound />} />
              </Routes>
            </Suspense>
            <MobileBottomNav />
            <AIChatbot />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
