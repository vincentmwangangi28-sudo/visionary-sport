import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { UserPreferencesProvider } from "@/hooks/useUserPreferences";
import { GeoRegionProvider } from "@/hooks/useGeoRegion";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { UnifiedSearchProvider } from "@/hooks/useUnifiedSearch";
import { BetSlipProvider } from "@/hooks/useBetSlip";
import { useLocaleDetection } from "@/hooks/useLocaleDetection";
import { useAutoIndexing } from "@/hooks/useAutoIndexing";
import { useGeminiDailyCron } from "@/hooks/useGeminiDailyCron";
import { useMatchSync } from "@/hooks/useMatchSync";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { BackToTop } from "@/components/BackToTop";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SiteAnnouncementBanner } from "@/components/SiteAnnouncementBanner";
import { queryClient } from "@/lib/queryClient";
import React, { Suspense, memo, useState, useEffect, ComponentType, ReactNode } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionCardSkeleton } from "@/components/PredictionCardSkeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

const UnifiedSearchModal = lazyWithRetry(() => import("@/components/UnifiedSearchModal").then(m => ({ default: m.UnifiedSearchModal })));
const BetSlipDrawer = lazyWithRetry(() => import("@/components/BetSlipDrawer").then(m => ({ default: m.BetSlipDrawer })));
const AIChatbot = lazyWithRetry(() => import("@/components/AIChatbot").then(m => ({ default: m.AIChatbot })));
const PWAInstallPrompt = lazyWithRetry(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));

const Index             = lazyWithRetry(() => import("./pages/Index"));
const PersonalizedDashboard = lazyWithRetry(() => import("./pages/PersonalizedDashboard"));
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
const GlobalTournaments  = lazyWithRetry(() => import("./pages/GlobalTournaments"));
const Recommendations    = lazyWithRetry(() => import("./pages/Recommendations"));
const UpcomingFixturesPage = lazyWithRetry(() => import("./pages/UpcomingFixturesPage"));
const SEOIndexingPage        = lazyWithRetry(() => import("./pages/SEOIndexingPage"));
const JackpotPredictions     = lazyWithRetry(() => import("./pages/JackpotPredictions"));
const USSoccerPredictions    = lazyWithRetry(() => import("./pages/USSoccerPredictions"));
const StreaksRadar           = lazyWithRetry(() => import("./pages/StreaksRadar"));
const H2HComparisonPage      = lazyWithRetry(() => import("./pages/H2HComparisonPage"));

interface RouteLoadingFallbackProps {
  routePath?: string;
}

const RouteLoadingFallback = memo(({ routePath }: RouteLoadingFallbackProps) => {
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  useEffect(() => {
    // If chunk loading takes longer than 2.5s under network throttling, show polite notice
    const timer = setTimeout(() => {
      setShowSlowNotice(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading page content"
      className="min-h-[85vh] bg-background w-full pb-24 animate-in fade-in duration-200"
    >
      {/* Top Indeterminate Streaming Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-primary/20 overflow-hidden pointer-events-none">
        <div className="h-full bg-primary animate-pulse w-3/4 mx-auto rounded-full shadow-[0_0_12px_hsl(var(--primary))]" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 pt-6 space-y-6">
        {/* Subtle slow connection notice if network is throttled */}
        {showSlowNotice && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-300 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 min-w-0">
              <WifiOff className="h-4 w-4 flex-shrink-0 animate-pulse text-amber-500" />
              <span className="truncate">Network throttling detected. Fetching page module in the background...</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="h-6 text-[11px] px-2.5 border-amber-500/40 hover:bg-amber-500/20 flex-shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reload
            </Button>
          </div>
        )}

        {/* Header Skeleton */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="h-8 w-64 max-w-[80vw] rounded-xl" />
          <Skeleton className="h-4 w-96 max-w-[90vw] rounded-md" />
        </div>

        {/* Filter / Category Pill bar skeleton */}
        <div className="flex items-center gap-2 overflow-x-hidden pt-1">
          <Skeleton className="h-8 w-24 rounded-lg flex-shrink-0" />
          <Skeleton className="h-8 w-28 rounded-lg flex-shrink-0" />
          <Skeleton className="h-8 w-20 rounded-lg flex-shrink-0" />
          <Skeleton className="h-8 w-32 rounded-lg flex-shrink-0" />
        </div>

        {/* Responsive Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <PredictionCardSkeleton />
          <PredictionCardSkeleton />
          <PredictionCardSkeleton />
        </div>
      </div>
    </div>
  );
});
RouteLoadingFallback.displayName = "RouteLoadingFallback";

interface RouteErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

const RouteErrorFallback = memo(({ error, onReset }: RouteErrorFallbackProps) => {
  const isChunkError =
    error.name === "ChunkLoadError" ||
    error.message?.includes("dynamically imported module") ||
    error.message?.includes("Failed to fetch") ||
    error.message?.includes("Loading chunk") ||
    error.message?.includes("import()");

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card border rounded-2xl p-6 shadow-sm text-center space-y-4 animate-in fade-in duration-200">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          {isChunkError ? <WifiOff className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">
            {isChunkError ? "Network Throttling Interruption" : "Unable to Load Page"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isChunkError
              ? "The network connection was too slow or interrupted while retrieving this module."
              : "An unexpected error occurred while rendering this route."}
          </p>
        </div>

        <div className="p-2.5 bg-muted/60 rounded-xl border text-left font-mono text-[11px] text-muted-foreground break-words max-h-24 overflow-y-auto">
          {error.message || "Unknown error"}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Button onClick={onReset} className="gap-1.5 text-xs font-bold">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Page Load
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="text-xs gap-1.5"
          >
            Refresh Browser
          </Button>
        </div>
      </div>
    </div>
  );
});
RouteErrorFallback.displayName = "RouteErrorFallback";

interface RouteBoundaryProps {
  component?: ComponentType<any>;
  children?: ReactNode;
  isProtected?: boolean;
}

const RouteBoundary = memo(({ component: Component, children, isProtected }: RouteBoundaryProps) => {
  const content = Component ? (
    isProtected ? (
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    ) : (
      <Component />
    )
  ) : isProtected ? (
    <ProtectedRoute>{children}</ProtectedRoute>
  ) : (
    children
  );

  return (
    <ErrorBoundary
      compact
      fallback={(error, reset) => <RouteErrorFallback error={error} onReset={reset} />}
    >
      <Suspense fallback={<RouteLoadingFallback />}>
        {content}
      </Suspense>
    </ErrorBoundary>
  );
});
RouteBoundary.displayName = "RouteBoundary";

const LocaleDetectionInitializer: React.FC = () => {
  useLocaleDetection();
  return null;
};

const AutoIndexingInitializer: React.FC = () => {
  useAutoIndexing();
  return null;
};

const GeminiDailyCronInitializer: React.FC = () => {
  useGeminiDailyCron();
  return null;
};

const MatchSyncInitializer: React.FC = () => {
  useMatchSync();
  return null;
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <UserPreferencesProvider>
              <GeoRegionProvider>
                <CurrencyProvider>
                  <UnifiedSearchProvider>
                    <LocaleDetectionInitializer />
                    <AutoIndexingInitializer />
                    <GeminiDailyCronInitializer />
                    <MatchSyncInitializer />
                    <BetSlipProvider>
                      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium">
                        Skip to content
                      </a>
                      <OfflineBanner />
                      <SiteAnnouncementBanner />
                      <Toaster />
                      <Sonner />
                      <Suspense fallback={<RouteLoadingFallback />}>
                        <ErrorBoundary>
                          <Routes>
                            <Route path="/"              element={<RouteBoundary component={Index} />} />
                            <Route path="/dashboard"     element={<RouteBoundary component={PersonalizedDashboard} />} />
                            <Route path="/my-dashboard"  element={<RouteBoundary component={PersonalizedDashboard} />} />
                            <Route path="/auth"          element={<RouteBoundary component={Auth} />} />
                            <Route path="/about"         element={<RouteBoundary component={About} />} />
                            <Route path="/archive"       element={<RouteBoundary component={Archive} />} />
                            <Route path="/results"       element={<RouteBoundary component={Archive} />} />
                            <Route path="/methodology"   element={<RouteBoundary component={Methodology} />} />
                            <Route path="/preferences"   element={<RouteBoundary component={Preferences} />} />
                            <Route path="/leaderboard"   element={<RouteBoundary component={Leaderboard} />} />
                            <Route path="/insights"      element={<RouteBoundary component={Insights} />} />
                            <Route path="/news"          element={<RouteBoundary component={News} />} />
                            <Route path="/live"          element={<RouteBoundary component={LiveScores} />} />
                            <Route path="/value-bets"    element={<RouteBoundary component={ValueBets} />} />
                            <Route path="/streaks"       element={<RouteBoundary component={StreaksRadar} />} />
                            <Route path="/trends"        element={<RouteBoundary component={StreaksRadar} />} />
                            <Route path="/dropping-odds" element={<RouteBoundary component={DroppingOddsPage} />} />
                            <Route path="/screener"      element={<RouteBoundary component={MatchScreenerPage} />} />
                            <Route path="/track-record"  element={<RouteBoundary component={TrackRecordPage} />} />
                            <Route path="/tournaments"   element={<RouteBoundary component={GlobalTournaments} />} />
                            <Route path="/global-tournaments" element={<RouteBoundary component={GlobalTournaments} />} />
                            <Route path="/accumulator"   element={<RouteBoundary component={AccumulatorBuilder} />} />
                            <Route path="/tipsters"      element={<RouteBoundary component={Tipsters} />} />
                            <Route path="/bankroll"      element={<RouteBoundary component={BankrollManager} />} />
                            <Route path="/predict"       element={<RouteBoundary component={MatchPredictor} />} />
                            <Route path="/predict/:matchSlug" element={<RouteBoundary component={MatchPrediction} />} />
                            <Route path="/best-bets"     element={<RouteBoundary component={BestBets} />} />
                            <Route path="/upcoming"      element={<RouteBoundary component={UpcomingFixturesPage} />} />
                            <Route path="/upcoming-fixtures" element={<RouteBoundary component={UpcomingFixturesPage} />} />
                            <Route path="/recommendations" element={<RouteBoundary component={Recommendations} />} />
                            <Route path="/performance"   element={<RouteBoundary component={Performance} isProtected />} />
                            <Route path="/shop"          element={<RouteBoundary component={Shop} isProtected />} />
                            <Route path="/rewards"       element={<RouteBoundary component={Rewards} isProtected />} />
                            <Route path="/admin"         element={<RouteBoundary component={AdminDashboard} isProtected />} />
                            <Route path="/correct-score" element={<RouteBoundary component={CorrectScore} />} />
                            <Route path="/btts"          element={<RouteBoundary component={BTTS} />} />
                            <Route path="/sports"        element={<RouteBoundary component={OtherSports} />} />
                            <Route path="/h2h"           element={<RouteBoundary component={H2HComparisonPage} />} />
                            <Route path="/compare"       element={<RouteBoundary component={H2HComparisonPage} />} />
                            <Route path="/statistics"    element={<RouteBoundary component={Statistics} />} />
                            <Route path="/highlights"    element={<RouteBoundary component={Highlights} />} />
                            <Route path="/players"       element={<RouteBoundary component={PlayerSearch} />} />
                            <Route path="/standings"                    element={<RouteBoundary component={Standings} />} />
                            <Route path="/premier-league-predictions"   element={<RouteBoundary component={PremierLeaguePredictions} />} />
                            <Route path="/champions-league-predictions" element={<RouteBoundary component={ChampionsLeaguePredictions} />} />
                            <Route path="/kpl-predictions"              element={<RouteBoundary component={KPLPredictions} />} />
                            <Route path="/jackpot-predictions"          element={<RouteBoundary component={JackpotPredictions} />} />
                            <Route path="/us-soccer-predictions"        element={<RouteBoundary component={USSoccerPredictions} />} />
                            <Route path="/la-liga-predictions"          element={<RouteBoundary component={LaLigaPredictions} />} />
                            <Route path="/bundesliga-predictions"       element={<RouteBoundary component={BundesligaPredictions} />} />
                            <Route path="/serie-a-predictions"          element={<RouteBoundary component={SerieAPredictions} />} />
                            <Route path="/world-cup-predictions"        element={<RouteBoundary component={WorldCupPredictions} />} />
                            <Route path="/afcon-predictions"            element={<RouteBoundary component={AFCONPredictions} />} />
                            <Route path="/blog"                         element={<RouteBoundary component={Blog} />} />
                            <Route path="/blog/:slug"                   element={<RouteBoundary component={BlogPost} />} />
                            <Route path="/seo-indexing"                 element={<RouteBoundary component={SEOIndexingPage} />} />
                            <Route path="/sitemap"                      element={<RouteBoundary component={Sitemap} />} />
                            <Route path="*"                             element={<RouteBoundary component={NotFound} />} />
                          </Routes>
                        </ErrorBoundary>
                      </Suspense>
                      <Suspense fallback={null}>
                        <ErrorBoundary fallback={null}>
                          <UnifiedSearchModal />
                        </ErrorBoundary>
                      </Suspense>
                      <Suspense fallback={null}>
                        <ErrorBoundary fallback={null}>
                          <BetSlipDrawer />
                        </ErrorBoundary>
                      </Suspense>
                      <Suspense fallback={null}>
                        <ErrorBoundary fallback={null}>
                          <AIChatbot />
                        </ErrorBoundary>
                      </Suspense>
                      <Suspense fallback={null}>
                        <ErrorBoundary fallback={null}>
                          <PWAInstallPrompt />
                        </ErrorBoundary>
                      </Suspense>
                      <MobileBottomNav />
                      <BackToTop />
                    </BetSlipProvider>
                  </UnifiedSearchProvider>
                </CurrencyProvider>
              </GeoRegionProvider>
            </UserPreferencesProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
