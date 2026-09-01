import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { UserPreferencesProvider } from "@/hooks/useUserPreferences";
import { BetSlipProvider } from "@/hooks/useBetSlip";
import { BetSlipDrawer } from "@/components/BetSlipDrawer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AIChatbot } from "@/components/AIChatbot";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";
import { queryClient } from "@/lib/queryClient";
import { Suspense } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const Index             = lazyWithRetry(() => import("./pages/Index"));
const MatchPrediction   = lazyWithRetry(() => import("./pages/MatchPrediction"));
const Auth              = lazyWithRetry(() => import("./pages/Auth"));
const Leaderboard       = lazyWithRetry(() => import("./pages/Leaderboard"));
const Insights          = lazyWithRetry(() => import("./pages/Insights"));
const Performance       = lazyWithRetry(() => import("./pages/Performance"));
const About             = lazyWithRetry(() => import("./pages/About"));
const Archive           = lazyWithRetry(() => import("./pages/Archive"));
const Methodology       = lazyWithRetry(() => import("./pages/Methodology"));
const Preferences       = lazyWithRetry(() => import("./pages/Preferences"));
const Shop              = lazyWithRetry(() => import("./pages/Shop"));
const Rewards           = lazyWithRetry(() => import("./pages/Rewards"));
const News              = lazyWithRetry(() => import("./pages/News"));
const AccumulatorBuilder= lazyWithRetry(() => import("./pages/AccumulatorBuilder"));
const ValueBets         = lazyWithRetry(() => import("./pages/ValueBets"));
const Tipsters          = lazyWithRetry(() => import("./pages/Tipsters"));
const BankrollManager   = lazyWithRetry(() => import("./pages/BankrollManager"));
const LiveScores        = lazyWithRetry(() => import("./pages/LiveScores"));
const MatchPredictor    = lazyWithRetry(() => import("./pages/MatchPredictor"));
const BestBets          = lazyWithRetry(() => import("./pages/BestBets"));
const AdminDashboard    = lazyWithRetry(() => import("./pages/AdminDashboard"));
const NotFound          = lazyWithRetry(() => import("./pages/NotFound"));
const OtherSports       = lazyWithRetry(() => import("./pages/OtherSports"));
const Statistics        = lazyWithRetry(() => import("./pages/Statistics"));
const Highlights        = lazyWithRetry(() => import("./pages/Highlights"));
const PlayerSearch      = lazyWithRetry(() => import("./pages/PlayerSearch"));
const Standings                  = lazyWithRetry(() => import("./pages/Standings"));
const PremierLeaguePredictions   = lazyWithRetry(() => import("./pages/PremierLeaguePredictions"));
const ChampionsLeaguePredictions = lazyWithRetry(() => import("./pages/ChampionsLeaguePredictions"));
const KPLPredictions             = lazyWithRetry(() => import("./pages/KPLPredictions"));
const LaLigaPredictions          = lazyWithRetry(() => import("./pages/LaLigaPredictions"));
const BundesligaPredictions      = lazyWithRetry(() => import("./pages/BundesligaPredictions"));
const SerieAPredictions          = lazyWithRetry(() => import("./pages/SerieAPredictions"));
const WorldCupPredictions = lazyWithRetry(() => import("./pages/WorldCupPredictions"));
const AFCONPredictions           = lazyWithRetry(() => import("./pages/AFCONPredictions"));
const Blog                       = lazyWithRetry(() => import("./pages/Blog"));
const BlogPost                   = lazyWithRetry(() => import("./pages/BlogPost"));
const Sitemap                    = lazyWithRetry(() => import("./pages/Sitemap"));
const CorrectScore      = lazyWithRetry(() => import("./pages/CorrectScore"));
const BTTS              = lazyWithRetry(() => import("./pages/BTTS"));
const DroppingOddsPage  = lazyWithRetry(() => import("./pages/DroppingOddsPage"));
const MatchScreenerPage = lazyWithRetry(() => import("./pages/MatchScreenerPage"));
const TrackRecordPage   = lazyWithRetry(() => import("./pages/TrackRecordPage"));

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
            <UserPreferencesProvider>
              <BetSlipProvider>
                <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium">
                  Skip to content
                </a>
                <OfflineBanner />
                <Toaster />
                <Sonner />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/"              element={<Index />} />
                    <Route path="/auth"          element={<Auth />} />
                    <Route path="/about"         element={<About />} />
                    <Route path="/archive"       element={<Archive />} />
                    <Route path="/results"       element={<Archive />} />
                    <Route path="/methodology"   element={<Methodology />} />
                    <Route path="/preferences"   element={<Preferences />} />
                    <Route path="/leaderboard"   element={<Leaderboard />} />
                    <Route path="/insights"      element={<Insights />} />
                    <Route path="/news"          element={<News />} />
                    <Route path="/live"          element={<LiveScores />} />
                    <Route path="/value-bets"    element={<ValueBets />} />
                    <Route path="/dropping-odds" element={<DroppingOddsPage />} />
                    <Route path="/screener"      element={<MatchScreenerPage />} />
                    <Route path="/track-record"  element={<TrackRecordPage />} />
                    <Route path="/accumulator"   element={<AccumulatorBuilder />} />
                    <Route path="/tipsters"      element={<Tipsters />} />
                    <Route path="/bankroll"      element={<BankrollManager />} />
                    <Route path="/predict"       element={<MatchPredictor />} />
                    <Route path="/predict/:matchSlug" element={<MatchPrediction />} />
                    <Route path="/best-bets"     element={<BestBets />} />
                    <Route path="/performance"   element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                    <Route path="/shop"          element={<ProtectedRoute><Shop /></ProtectedRoute>} />
                    <Route path="/rewards"       element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
                    <Route path="/admin"         element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/correct-score" element={<CorrectScore />} />
                    <Route path="/btts"          element={<BTTS />} />
                    <Route path="/sports"        element={<OtherSports />} />
                    <Route path="/statistics"    element={<Statistics />} />
                    <Route path="/highlights"    element={<Highlights />} />
                    <Route path="/players"       element={<PlayerSearch />} />
                    <Route path="/standings"                    element={<Standings />} />
                    <Route path="/premier-league-predictions"   element={<PremierLeaguePredictions />} />
                    <Route path="/champions-league-predictions" element={<ChampionsLeaguePredictions />} />
                    <Route path="/kpl-predictions"              element={<KPLPredictions />} />
                    <Route path="/la-liga-predictions"          element={<LaLigaPredictions />} />
                    <Route path="/bundesliga-predictions"       element={<BundesligaPredictions />} />
                    <Route path="/serie-a-predictions"          element={<SerieAPredictions />} />
                    <Route path="/world-cup-predictions"        element={<WorldCupPredictions />} />
                    <Route path="/afcon-predictions"            element={<AFCONPredictions />} />
                    <Route path="/blog"                         element={<Blog />} />
                    <Route path="/blog/:slug"                   element={<BlogPost />} />
                    <Route path="/sitemap"                      element={<Sitemap />} />
                    <Route path="*"                             element={<NotFound />} />
                  </Routes>
                </Suspense>
                <BetSlipDrawer />
                <MobileBottomNav />
                <AIChatbot />
              </BetSlipProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
