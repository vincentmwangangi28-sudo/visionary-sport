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
const AdminDashboard    = lazy(() => import("./pages/AdminDashboard"));
const NotFound          = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                <Route path="/"                element={<Index />} />
                <Route path="/auth"            element={<Auth />} />
                <Route path="/about"           element={<About />} />
                <Route path="/leaderboard"     element={<Leaderboard />} />
                <Route path="/insights"        element={<Insights />} />
                <Route path="/news"            element={<News />} />
                <Route path="/live"            element={<LiveScores />} />
                <Route path="/value-bets"      element={<ValueBets />} />
                <Route path="/accumulator"     element={<AccumulatorBuilder />} />
                <Route path="/tipsters"        element={<Tipsters />} />
                <Route path="/bankroll"        element={<BankrollManager />} />
                <Route path="/performance"     element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                <Route path="/shop"            element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                <Route path="/rewards"         element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
                <Route path="/admin"           element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="*"               element={<NotFound />} />
              </Routes>
            </Suspense>
            <AIChatbot />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
