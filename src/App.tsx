import "./App.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { UserPreferencesProvider } from "@/hooks/useUserPreferences";
import { GeoRegionProvider } from "@/hooks/useGeoRegion";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { UnifiedSearchProvider } from "@/hooks/useUnifiedSearch";
import { BetSlipProvider } from "@/hooks/useBetSlip";
import { useLocaleDetection } from "@/hooks/useLocaleDetection";
import { useSEOManager } from "@/hooks/useSEOManager";
import { useWebMCPTools } from "@/hooks/useWebMCPTools";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SiteAnnouncementBanner } from "@/components/SiteAnnouncementBanner";
import { BreadcrumbLayoutSchema } from "@/components/BreadcrumbLayoutSchema";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { queryClient } from "@/lib/queryClient";
import React, { Suspense, memo, useState, useEffect, useCallback, ComponentType, ReactNode } from "react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionCardSkeleton } from "@/components/PredictionCardSkeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

import DeferredBackgroundHooks from "@/components/DeferredBackgroundHooks";
import { Toaster as Sonner } from "@/components/ui/sonner";

const UnifiedSearchModal = lazyWithRetry(() => import("@/components/UnifiedSearchModal").then(m => ({ default: m.UnifiedSearchModal })));
const BetSlipDrawer = lazyWithRetry(() => import("@/components/BetSlipDrawer").then(m => ({ default: m.BetSlipDrawer })));
const AIChatbot = lazyWithRetry(() => import("@/components/AIChatbot").then(m => ({ default: m.AIChatbot })));
const PWAInstallPrompt = lazyWithRetry(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const FirstVisitSignupModal = lazyWithRetry(() => import("@/components/FirstVisitSignupModal").then(m => ({ default: m.FirstVisitSignupModal })));
const BackToTop = lazyWithRetry(() => import("@/components/BackToTop").then(m => ({ default: m.BackToTop })));

import Index from "./pages/Index";
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
const ResponsibleGaming      = lazyWithRetry(() => import("./pages/ResponsibleGaming"));
const PrivacyPolicy          = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService         = lazyWithRetry(() => import("./pages/TermsOfService"));
const CookiePolicy           = lazyWithRetry(() => import("./pages/CookiePolicy"));
const Contact                = lazyWithRetry(() => import("./pages/Contact"));
const Widgets                = lazyWithRetry(() => import("./pages/Widgets"));
const EmbedWidget            = lazyWithRetry(() => import("./pages/EmbedWidget"));
const BetOfTheDay            = lazyWithRetry(() => import("./pages/BetOfTheDay"));
const OverUnderPredictions   = lazyWithRetry(() => import("./pages/OverUnderPredictions"));
const DoubleChancePredictions = lazyWithRetry(() => import("./pages/DoubleChancePredictions"));
const DrawPredictions        = lazyWithRetry(() => import("./pages/DrawPredictions"));
const HalftimeFulltimePredictions = lazyWithRetry(() => import("./pages/HalftimeFulltimePredictions"));
const EuropaLeaguePredictions = lazyWithRetry(() => import("./pages/EuropaLeaguePredictions"));
const Ligue1Predictions      = lazyWithRetry(() => import("./pages/Ligue1Predictions"));
const PoissonCalculatorPage  = lazyWithRetry(() => import("./pages/PoissonCalculatorPage"));
const SureWinPredictions       = lazyWithRetry(() => import("./pages/SureWinPredictions"));
const CornersPredictions       = lazyWithRetry(() => import("./pages/CornersPredictions"));
const CardsPredictions         = lazyWithRetry(() => import("./pages/CardsPredictions"));
const ChampionshipPredictions   = lazyWithRetry(() => import("./pages/ChampionshipPredictions"));
const EredivisiePredictions     = lazyWithRetry(() => import("./pages/EredivisiePredictions"));
const PrimeiraLigaPredictions   = lazyWithRetry(() => import("./pages/PrimeiraLigaPredictions"));
const ConferenceLeaguePredictions = lazyWithRetry(() => import("./pages/ConferenceLeaguePredictions"));
const CopaLibertadoresPredictions = lazyWithRetry(() => import("./pages/CopaLibertadoresPredictions"));
const ValueBetCalculator       = lazyWithRetry(() => import("./pages/ValueBetCalculator"));
const KellyCriterionCalculator = lazyWithRetry(() => import("./pages/KellyCriterionCalculator"));
const Over15GoalsPredictions   = lazyWithRetry(() => import("./pages/Over15GoalsPredictions"));
const TomorrowPredictions      = lazyWithRetry(() => import("./pages/TomorrowPredictions"));
const WeekendPredictions       = lazyWithRetry(() => import("./pages/WeekendPredictions"));
const AsianHandicapPredictions = lazyWithRetry(() => import("./pages/AsianHandicapPredictions"));
const DrawNoBetPredictions     = lazyWithRetry(() => import("./pages/DrawNoBetPredictions"));
const WinToNilPredictions      = lazyWithRetry(() => import("./pages/WinToNilPredictions"));
const ArbitrageCalculator      = lazyWithRetry(() => import("./pages/ArbitrageCalculator"));
const OddsConverter            = lazyWithRetry(() => import("./pages/OddsConverter"));
const SaudiProLeaguePredictions = lazyWithRetry(() => import("./pages/SaudiProLeaguePredictions"));
const BrazilianSerieAPredictions = lazyWithRetry(() => import("./pages/BrazilianSerieAPredictions"));
const ScottishPremiershipPredictions = lazyWithRetry(() => import("./pages/ScottishPremiershipPredictions"));
const FirstHalfGoalsPredictions = lazyWithRetry(() => import("./pages/FirstHalfGoalsPredictions"));
const Over35GoalsPredictions   = lazyWithRetry(() => import("./pages/Over35GoalsPredictions"));
const BttsAndWinPredictions    = lazyWithRetry(() => import("./pages/BttsAndWinPredictions"));
const AnytimeGoalscorerPredictions = lazyWithRetry(() => import("./pages/AnytimeGoalscorerPredictions"));
const ParlayCalculator         = lazyWithRetry(() => import("./pages/ParlayCalculator"));
const MarginCalculator         = lazyWithRetry(() => import("./pages/MarginCalculator"));
const FaCupPredictions         = lazyWithRetry(() => import("./pages/FaCupPredictions"));
const TurkishSuperLigPredictions = lazyWithRetry(() => import("./pages/TurkishSuperLigPredictions"));
const BelgianProLeaguePredictions = lazyWithRetry(() => import("./pages/BelgianProLeaguePredictions"));
const ArgentinaPrimeraPredictions = lazyWithRetry(() => import("./pages/ArgentinaPrimeraPredictions"));
const Under25GoalsPredictions    = lazyWithRetry(() => import("./pages/Under25GoalsPredictions"));
const SecondHalfGoalsPredictions = lazyWithRetry(() => import("./pages/SecondHalfGoalsPredictions"));
const EuropeanHandicapPredictions = lazyWithRetry(() => import("./pages/EuropeanHandicapPredictions"));
const MidweekJackpotPredictions  = lazyWithRetry(() => import("./pages/MidweekJackpotPredictions"));
const SystemBetCalculator        = lazyWithRetry(() => import("./pages/SystemBetCalculator"));
const HedgeBetCalculator         = lazyWithRetry(() => import("./pages/HedgeBetCalculator"));
const LigaMxPredictions          = lazyWithRetry(() => import("./pages/LigaMxPredictions"));
const MlsPredictions             = lazyWithRetry(() => import("./pages/MlsPredictions"));
const GreekSuperLeaguePredictions = lazyWithRetry(() => import("./pages/GreekSuperLeaguePredictions"));
const SouthAfricaPslPredictions  = lazyWithRetry(() => import("./pages/SouthAfricaPslPredictions"));
const RolloverBetsPredictions    = lazyWithRetry(() => import("./pages/RolloverBetsPredictions"));
const Daily2OddsPredictions      = lazyWithRetry(() => import("./pages/Daily2OddsPredictions"));
const BetBuilderPredictions      = lazyWithRetry(() => import("./pages/BetBuilderPredictions"));
const BothHalvesPredictions      = lazyWithRetry(() => import("./pages/BothHalvesPredictions"));
const DutchingCalculator         = lazyWithRetry(() => import("./pages/DutchingCalculator"));
const RoiYieldCalculator         = lazyWithRetry(() => import("./pages/RoiYieldCalculator"));
const NigerianNpflPredictions    = lazyWithRetry(() => import("./pages/NigerianNpflPredictions"));
const EgyptianPremierLeaguePredictions = lazyWithRetry(() => import("./pages/EgyptianPremierLeaguePredictions"));
const JLeaguePredictions         = lazyWithRetry(() => import("./pages/JLeaguePredictions"));
const AustralianALeaguePredictions = lazyWithRetry(() => import("./pages/AustralianALeaguePredictions"));

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
    <main
      id="main-content"
      aria-busy="true"
      aria-label="Main page content"
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
    </main>
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
    <main id="main-content" className="min-h-[65vh] flex items-center justify-center p-4 bg-background">
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
    </main>
  );
});
RouteErrorFallback.displayName = "RouteErrorFallback";

interface RouteBoundaryProps {
  component?: ComponentType<any>;
  children?: ReactNode;
  isProtected?: boolean;
  adminOnly?: boolean;
}

const RouteBoundary = memo(({ component: Component, children, isProtected, adminOnly }: RouteBoundaryProps) => {
  const [retryKey, setRetryKey] = useState(0);

  const handleReset = useCallback(() => {
    if (Component && typeof (Component as any).retry === "function") {
      (Component as any).retry();
    }
    setRetryKey((k) => k + 1);
  }, [Component]);

  const content = Component ? (
    isProtected ? (
      <ProtectedRoute adminOnly={adminOnly}>
        <Component />
      </ProtectedRoute>
    ) : (
      <Component />
    )
  ) : isProtected ? (
    <ProtectedRoute adminOnly={adminOnly}>{children}</ProtectedRoute>
  ) : (
    children
  );

  return (
    <ErrorBoundary
      key={retryKey}
      compact
      fallback={(error, reset) => (
        <RouteErrorFallback
          error={error}
          onReset={() => {
            reset();
            handleReset();
          }}
        />
      )}
    >
      <Suspense key={retryKey} fallback={<RouteLoadingFallback />}>
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

const SEOManagerInitializer: React.FC = () => {
  useSEOManager();
  return null;
};

const WebMCPInitializer: React.FC = () => {
  useWebMCPTools();
  return (
    <form
      action="/predict"
      method="get"
      role="search"
      aria-label="Quick AI Football Prediction Search"
      toolname="search_football_predictions"
      tooldescription="Search daily AI football match predictions, Expected Goals (xG) statistics, and betting tips by club or league"
      className="sr-only"
    >
      <label htmlFor="webmcp-global-search-query">Search Football Team or League Predictions</label>
      <input
        id="webmcp-global-search-query"
        type="search"
        name="q"
        required
        toolparamdescription="Football club name, matchup, or league name to search predictions for"
        placeholder="Search team or league..."
      />
      <button type="submit">Search Predictions</button>
    </form>
  );
};

const DeferredGlobalOverlays = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = false;
    const enable = () => {
      if (mounted) return;
      mounted = true;
      setReady(true);
    };
    const timer = setTimeout(enable, 20000);
    window.addEventListener("scroll", enable, { passive: true, once: true });
    window.addEventListener("pointerdown", enable, { passive: true, once: true });
    window.addEventListener("keydown", enable, { passive: true, once: true });
    window.addEventListener("touchstart", enable, { passive: true, once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", enable);
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
      window.removeEventListener("touchstart", enable);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <Suspense fallback={null}>
        <ErrorBoundary fallback={null}>
          <DeferredBackgroundHooks />
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
      <Suspense fallback={null}>
        <ErrorBoundary fallback={null}>
          <FirstVisitSignupModal />
        </ErrorBoundary>
      </Suspense>
      <Suspense fallback={null}>
        <ErrorBoundary fallback={null}>
          <Sonner />
          <BackToTop />
        </ErrorBoundary>
      </Suspense>
    </>
  );
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
                    <SEOManagerInitializer />
                    <WebMCPInitializer />
                    <BetSlipProvider>
                      <a
                        href="#main-content"
                        className="fixed left-4 top-4 z-[9999] -translate-y-24 focus:translate-y-0 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-bold text-sm shadow-lg transition-transform focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        Skip to content
                      </a>
                      <OfflineBanner />
                      <SiteAnnouncementBanner />
                      <BreadcrumbLayoutSchema />
                      <CookieConsentBanner />
                      <Suspense fallback={<RouteLoadingFallback />}>
                        <ErrorBoundary>
                          <Routes>
                            <Route path="/"              element={<RouteBoundary component={Index} />} />
                            <Route path="/dashboard"     element={<RouteBoundary component={PersonalizedDashboard} />} />
                            <Route path="/my-dashboard"  element={<Navigate to="/dashboard" replace />} />
                            <Route path="/auth"          element={<RouteBoundary component={Auth} />} />
                            <Route path="/about"         element={<RouteBoundary component={About} />} />
                            <Route path="/archive"       element={<RouteBoundary component={Archive} />} />
                            <Route path="/results"       element={<Navigate to="/archive" replace />} />
                            <Route path="/methodology"   element={<RouteBoundary component={Methodology} />} />
                            <Route path="/preferences"   element={<RouteBoundary component={Preferences} />} />
                            <Route path="/leaderboard"   element={<RouteBoundary component={Leaderboard} />} />
                            <Route path="/insights"      element={<RouteBoundary component={Insights} />} />
                            <Route path="/news"          element={<RouteBoundary component={News} />} />
                            <Route path="/live"          element={<RouteBoundary component={LiveScores} />} />
                            <Route path="/value-bets"    element={<RouteBoundary component={ValueBets} />} />
                            <Route path="/streaks"       element={<RouteBoundary component={StreaksRadar} />} />
                            <Route path="/trends"        element={<Navigate to="/streaks" replace />} />
                            <Route path="/dropping-odds" element={<RouteBoundary component={DroppingOddsPage} />} />
                            <Route path="/screener"      element={<RouteBoundary component={MatchScreenerPage} />} />
                            <Route path="/track-record"  element={<RouteBoundary component={TrackRecordPage} />} />
                            <Route path="/tournaments"   element={<RouteBoundary component={GlobalTournaments} />} />
                            <Route path="/global-tournaments" element={<Navigate to="/tournaments" replace />} />
                            <Route path="/accumulator"   element={<RouteBoundary component={AccumulatorBuilder} />} />
                            <Route path="/tipsters"      element={<RouteBoundary component={Tipsters} />} />
                            <Route path="/bankroll"      element={<RouteBoundary component={BankrollManager} />} />
                            <Route path="/predict"       element={<RouteBoundary component={MatchPredictor} />} />
                            <Route path="/predict/:matchSlug" element={<RouteBoundary component={MatchPrediction} />} />
                            <Route path="/match/:matchSlug" element={<Navigate to="/predict/:matchSlug" replace />} />
                            <Route path="/best-bets"     element={<RouteBoundary component={BestBets} />} />
                            <Route path="/upcoming"      element={<RouteBoundary component={UpcomingFixturesPage} />} />
                            <Route path="/upcoming-fixtures" element={<Navigate to="/upcoming" replace />} />
                            <Route path="/recommendations" element={<RouteBoundary component={Recommendations} />} />
                            <Route path="/performance"   element={<RouteBoundary component={Performance} isProtected />} />
                            <Route path="/shop"          element={<RouteBoundary component={Shop} isProtected />} />
                            <Route path="/rewards"       element={<RouteBoundary component={Rewards} isProtected />} />
                            <Route path="/admin"         element={<RouteBoundary component={AdminDashboard} isProtected adminOnly />} />
                            <Route path="/correct-score" element={<RouteBoundary component={CorrectScore} />} />
                            <Route path="/btts"          element={<RouteBoundary component={BTTS} />} />
                            <Route path="/sports"        element={<RouteBoundary component={OtherSports} />} />
                            <Route path="/h2h"           element={<RouteBoundary component={H2HComparisonPage} />} />
                            <Route path="/compare"       element={<Navigate to="/h2h" replace />} />
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
                            <Route path="/seo-indexing"                 element={<RouteBoundary component={SEOIndexingPage} isProtected adminOnly />} />
                            <Route path="/sitemap"                      element={<RouteBoundary component={Sitemap} />} />
                            <Route path="/privacy"                      element={<RouteBoundary component={PrivacyPolicy} />} />
                            <Route path="/privacy-policy"               element={<Navigate to="/privacy" replace />} />
                            <Route path="/terms"                        element={<RouteBoundary component={TermsOfService} />} />
                            <Route path="/terms-of-service"             element={<Navigate to="/terms" replace />} />
                            <Route path="/cookies"                      element={<RouteBoundary component={CookiePolicy} />} />
                            <Route path="/cookie-policy"                element={<Navigate to="/cookies" replace />} />
                            <Route path="/contact"                      element={<RouteBoundary component={Contact} />} />
                            <Route path="/contact-us"                   element={<Navigate to="/contact" replace />} />
                            <Route path="/responsible-gaming"           element={<RouteBoundary component={ResponsibleGaming} />} />
                            <Route path="/widgets"                      element={<RouteBoundary component={Widgets} />} />
                            <Route path="/embed/:type"                  element={<RouteBoundary component={EmbedWidget} />} />
                            <Route path="/bet-of-the-day"               element={<RouteBoundary component={BetOfTheDay} />} />
                            <Route path="/over-under-predictions"       element={<RouteBoundary component={OverUnderPredictions} />} />
                            <Route path="/double-chance-predictions"    element={<RouteBoundary component={DoubleChancePredictions} />} />
                            <Route path="/draw-predictions"             element={<RouteBoundary component={DrawPredictions} />} />
                            <Route path="/halftime-fulltime-predictions" element={<RouteBoundary component={HalftimeFulltimePredictions} />} />
                            <Route path="/europa-league-predictions"    element={<RouteBoundary component={EuropaLeaguePredictions} />} />
                            <Route path="/ligue-1-predictions"          element={<RouteBoundary component={Ligue1Predictions} />} />
                            <Route path="/poisson-calculator"           element={<RouteBoundary component={PoissonCalculatorPage} />} />
                            <Route path="/sure-win-predictions"         element={<RouteBoundary component={SureWinPredictions} />} />
                            <Route path="/corners-predictions"          element={<RouteBoundary component={CornersPredictions} />} />
                            <Route path="/cards-predictions"            element={<RouteBoundary component={CardsPredictions} />} />
                            <Route path="/championship-predictions"      element={<RouteBoundary component={ChampionshipPredictions} />} />
                            <Route path="/eredivisie-predictions"        element={<RouteBoundary component={EredivisiePredictions} />} />
                            <Route path="/primeira-liga-predictions"      element={<RouteBoundary component={PrimeiraLigaPredictions} />} />
                            <Route path="/conference-league-predictions" element={<RouteBoundary component={ConferenceLeaguePredictions} />} />
                            <Route path="/copa-libertadores-predictions" element={<RouteBoundary component={CopaLibertadoresPredictions} />} />
                            <Route path="/value-bet-calculator"          element={<RouteBoundary component={ValueBetCalculator} />} />
                            <Route path="/kelly-criterion-calculator"    element={<RouteBoundary component={KellyCriterionCalculator} />} />
                            <Route path="/over-1-5-goals-predictions"    element={<RouteBoundary component={Over15GoalsPredictions} />} />
                            <Route path="/tomorrow-predictions"          element={<RouteBoundary component={TomorrowPredictions} />} />
                            <Route path="/weekend-predictions"           element={<RouteBoundary component={WeekendPredictions} />} />
                            <Route path="/asian-handicap-predictions"    element={<RouteBoundary component={AsianHandicapPredictions} />} />
                            <Route path="/draw-no-bet-predictions"       element={<RouteBoundary component={DrawNoBetPredictions} />} />
                            <Route path="/win-to-nil-predictions"        element={<RouteBoundary component={WinToNilPredictions} />} />
                            <Route path="/arbitrage-calculator"          element={<RouteBoundary component={ArbitrageCalculator} />} />
                            <Route path="/odds-converter"                element={<RouteBoundary component={OddsConverter} />} />
                            <Route path="/saudi-pro-league-predictions"  element={<RouteBoundary component={SaudiProLeaguePredictions} />} />
                            <Route path="/brazilian-serie-a-predictions" element={<RouteBoundary component={BrazilianSerieAPredictions} />} />
                            <Route path="/scottish-premiership-predictions" element={<RouteBoundary component={ScottishPremiershipPredictions} />} />
                            <Route path="/first-half-goals-predictions"  element={<RouteBoundary component={FirstHalfGoalsPredictions} />} />
                            <Route path="/over-3-5-goals-predictions"    element={<RouteBoundary component={Over35GoalsPredictions} />} />
                            <Route path="/both-teams-to-score-and-win-predictions" element={<RouteBoundary component={BttsAndWinPredictions} />} />
                            <Route path="/anytime-goalscorer-predictions" element={<RouteBoundary component={AnytimeGoalscorerPredictions} />} />
                            <Route path="/parlay-calculator"             element={<RouteBoundary component={ParlayCalculator} />} />
                            <Route path="/margin-calculator"             element={<RouteBoundary component={MarginCalculator} />} />
                            <Route path="/fa-cup-predictions"            element={<RouteBoundary component={FaCupPredictions} />} />
                            <Route path="/turkish-super-lig-predictions" element={<RouteBoundary component={TurkishSuperLigPredictions} />} />
                            <Route path="/belgian-pro-league-predictions" element={<RouteBoundary component={BelgianProLeaguePredictions} />} />
                            <Route path="/argentina-primera-predictions" element={<RouteBoundary component={ArgentinaPrimeraPredictions} />} />
                            <Route path="/under-2-5-goals-predictions"  element={<RouteBoundary component={Under25GoalsPredictions} />} />
                            <Route path="/second-half-goals-predictions" element={<RouteBoundary component={SecondHalfGoalsPredictions} />} />
                            <Route path="/handicap-1x2-predictions"     element={<RouteBoundary component={EuropeanHandicapPredictions} />} />
                            <Route path="/midweek-jackpot-predictions"  element={<RouteBoundary component={MidweekJackpotPredictions} />} />
                            <Route path="/system-bet-calculator"        element={<RouteBoundary component={SystemBetCalculator} />} />
                            <Route path="/hedge-bet-calculator"         element={<RouteBoundary component={HedgeBetCalculator} />} />
                            <Route path="/liga-mx-predictions"          element={<RouteBoundary component={LigaMxPredictions} />} />
                            <Route path="/mls-predictions"              element={<RouteBoundary component={MlsPredictions} />} />
                            <Route path="/greek-super-league-predictions" element={<RouteBoundary component={GreekSuperLeaguePredictions} />} />
                            <Route path="/south-africa-psl-predictions" element={<RouteBoundary component={SouthAfricaPslPredictions} />} />
                            <Route path="/rollover-bets-predictions"    element={<RouteBoundary component={RolloverBetsPredictions} />} />
                            <Route path="/daily-2-odds-predictions"     element={<RouteBoundary component={Daily2OddsPredictions} />} />
                            <Route path="/bet-builder-predictions"      element={<RouteBoundary component={BetBuilderPredictions} />} />
                            <Route path="/both-halves-predictions"      element={<RouteBoundary component={BothHalvesPredictions} />} />
                            <Route path="/dutching-calculator"          element={<RouteBoundary component={DutchingCalculator} />} />
                            <Route path="/roi-yield-calculator"         element={<RouteBoundary component={RoiYieldCalculator} />} />
                            <Route path="/nigerian-npfl-predictions"    element={<RouteBoundary component={NigerianNpflPredictions} />} />
                            <Route path="/egyptian-premier-league-predictions" element={<RouteBoundary component={EgyptianPremierLeaguePredictions} />} />
                            <Route path="/j-league-predictions"         element={<RouteBoundary component={JLeaguePredictions} />} />
                            <Route path="/australian-a-league-predictions" element={<RouteBoundary component={AustralianALeaguePredictions} />} />
                            <Route path="/disclaimer"                   element={<Navigate to="/responsible-gaming" replace />} />
                            <Route path="/ads-policy"                   element={<Navigate to="/responsible-gaming" replace />} />
                            {/* 301-equivalent client redirects to reclaim incoming links & eliminate 404s */}
                            <Route path="/rollover-tips"                element={<Navigate to="/rollover-bets-predictions" replace />} />
                            <Route path="/daily-2-odds-rollover"        element={<Navigate to="/rollover-bets-predictions" replace />} />
                            <Route path="/1-50-odds-rollover"           element={<Navigate to="/rollover-bets-predictions" replace />} />
                            <Route path="/7-day-rollover-challenge"     element={<Navigate to="/rollover-bets-predictions" replace />} />
                            <Route path="/sure-2-odds"                  element={<Navigate to="/daily-2-odds-predictions" replace />} />
                            <Route path="/2-odds-daily-tips"            element={<Navigate to="/daily-2-odds-predictions" replace />} />
                            <Route path="/sure-3-odds-predictions"      element={<Navigate to="/daily-2-odds-predictions" replace />} />
                            <Route path="/5-odds-predictions"           element={<Navigate to="/daily-2-odds-predictions" replace />} />
                            <Route path="/same-game-parlay-predictions" element={<Navigate to="/bet-builder-predictions" replace />} />
                            <Route path="/sgp-football-tips"            element={<Navigate to="/bet-builder-predictions" replace />} />
                            <Route path="/bet-builder-tips-today"       element={<Navigate to="/bet-builder-predictions" replace />} />
                            <Route path="/to-win-both-halves-predictions" element={<Navigate to="/both-halves-predictions" replace />} />
                            <Route path="/score-in-both-halves-predictions" element={<Navigate to="/both-halves-predictions" replace />} />
                            <Route path="/team-to-score-both-halves"    element={<Navigate to="/both-halves-predictions" replace />} />
                            <Route path="/dutch-betting-calculator"     element={<Navigate to="/dutching-calculator" replace />} />
                            <Route path="/correct-score-dutching-calculator" element={<Navigate to="/dutching-calculator" replace />} />
                            <Route path="/betting-roi-calculator"       element={<Navigate to="/roi-yield-calculator" replace />} />
                            <Route path="/yield-calculator-betting"     element={<Navigate to="/roi-yield-calculator" replace />} />
                            <Route path="/win-rate-break-even-calculator" element={<Navigate to="/roi-yield-calculator" replace />} />
                            <Route path="/npfl-predictions"             element={<Navigate to="/nigerian-npfl-predictions" replace />} />
                            <Route path="/nigeria-premier-league-predictions" element={<Navigate to="/nigerian-npfl-predictions" replace />} />
                            <Route path="/sportybet-npfl-tips"          element={<Navigate to="/nigerian-npfl-predictions" replace />} />
                            <Route path="/egypt-premier-league-predictions" element={<Navigate to="/egyptian-premier-league-predictions" replace />} />
                            <Route path="/al-ahly-zamalek-predictions"  element={<Navigate to="/egyptian-premier-league-predictions" replace />} />
                            <Route path="/j1-league-predictions"        element={<Navigate to="/j-league-predictions" replace />} />
                            <Route path="/japanese-football-predictions" element={<Navigate to="/j-league-predictions" replace />} />
                            <Route path="/a-league-predictions"         element={<Navigate to="/australian-a-league-predictions" replace />} />
                            <Route path="/a-league-men-tips"            element={<Navigate to="/australian-a-league-predictions" replace />} />
                            <Route path="/under-2-5"                    element={<Navigate to="/under-2-5-goals-predictions" replace />} />
                            <Route path="/under-2-5-goals"              element={<Navigate to="/under-2-5-goals-predictions" replace />} />
                            <Route path="/low-scoring-predictions"      element={<Navigate to="/under-2-5-goals-predictions" replace />} />
                            <Route path="/2nd-half-goals-predictions"   element={<Navigate to="/second-half-goals-predictions" replace />} />
                            <Route path="/highest-scoring-half-predictions" element={<Navigate to="/second-half-goals-predictions" replace />} />
                            <Route path="/over-1-5-second-half-goals"   element={<Navigate to="/second-half-goals-predictions" replace />} />
                            <Route path="/european-handicap-predictions" element={<Navigate to="/handicap-1x2-predictions" replace />} />
                            <Route path="/minus-1-handicap-predictions" element={<Navigate to="/handicap-1x2-predictions" replace />} />
                            <Route path="/3-way-handicap-tips"          element={<Navigate to="/handicap-1x2-predictions" replace />} />
                            <Route path="/midweek-jackpot"              element={<Navigate to="/midweek-jackpot-predictions" replace />} />
                            <Route path="/13-games-jackpot-predictions" element={<Navigate to="/midweek-jackpot-predictions" replace />} />
                            <Route path="/sportpesa-midweek-jackpot"    element={<Navigate to="/midweek-jackpot-predictions" replace />} />
                            <Route path="/betika-midweek-jackpot"       element={<Navigate to="/midweek-jackpot-predictions" replace />} />
                            <Route path="/trixie-calculator"            element={<Navigate to="/system-bet-calculator" replace />} />
                            <Route path="/yankee-calculator"            element={<Navigate to="/system-bet-calculator" replace />} />
                            <Route path="/patent-bet-calculator"        element={<Navigate to="/system-bet-calculator" replace />} />
                            <Route path="/lucky-15-calculator"          element={<Navigate to="/system-bet-calculator" replace />} />
                            <Route path="/cash-out-calculator"          element={<Navigate to="/hedge-bet-calculator" replace />} />
                            <Route path="/live-hedge-calculator"        element={<Navigate to="/hedge-bet-calculator" replace />} />
                            <Route path="/lock-in-profit-calculator"    element={<Navigate to="/hedge-bet-calculator" replace />} />
                            <Route path="/mexican-liga-mx-predictions"  element={<Navigate to="/liga-mx-predictions" replace />} />
                            <Route path="/liga-mx-tips"                 element={<Navigate to="/liga-mx-predictions" replace />} />
                            <Route path="/major-league-soccer-predictions" element={<Navigate to="/mls-predictions" replace />} />
                            <Route path="/inter-miami-predictions"      element={<Navigate to="/mls-predictions" replace />} />
                            <Route path="/super-league-greece-predictions" element={<Navigate to="/greek-super-league-predictions" replace />} />
                            <Route path="/betway-premiership-predictions" element={<Navigate to="/south-africa-psl-predictions" replace />} />
                            <Route path="/dstv-premiership-predictions" element={<Navigate to="/south-africa-psl-predictions" replace />} />
                            <Route path="/psl-predictions"              element={<Navigate to="/south-africa-psl-predictions" replace />} />
                            <Route path="/over-0-5-first-half-goals"    element={<Navigate to="/first-half-goals-predictions" replace />} />
                            <Route path="/ht-over-0-5-predictions"      element={<Navigate to="/first-half-goals-predictions" replace />} />
                            <Route path="/1st-half-goals-tips"          element={<Navigate to="/first-half-goals-predictions" replace />} />
                            <Route path="/over-3-5"                     element={<Navigate to="/over-3-5-goals-predictions" replace />} />
                            <Route path="/over-3-5-goals"               element={<Navigate to="/over-3-5-goals-predictions" replace />} />
                            <Route path="/btts-and-win"                 element={<Navigate to="/both-teams-to-score-and-win-predictions" replace />} />
                            <Route path="/btts-over-2-5-predictions"    element={<Navigate to="/both-teams-to-score-and-win-predictions" replace />} />
                            <Route path="/goalscorer-predictions"       element={<Navigate to="/anytime-goalscorer-predictions" replace />} />
                            <Route path="/first-goalscorer-tips"        element={<Navigate to="/anytime-goalscorer-predictions" replace />} />
                            <Route path="/player-shots-on-target"       element={<Navigate to="/anytime-goalscorer-predictions" replace />} />
                            <Route path="/accumulator-calculator"       element={<Navigate to="/parlay-calculator" replace />} />
                            <Route path="/acca-odds-calculator"         element={<Navigate to="/parlay-calculator" replace />} />
                            <Route path="/overround-calculator"         element={<Navigate to="/margin-calculator" replace />} />
                            <Route path="/vig-calculator"               element={<Navigate to="/margin-calculator" replace />} />
                            <Route path="/no-vig-calculator"            element={<Navigate to="/margin-calculator" replace />} />
                            <Route path="/carabao-cup-predictions"      element={<Navigate to="/fa-cup-predictions" replace />} />
                            <Route path="/efl-cup-predictions"          element={<Navigate to="/fa-cup-predictions" replace />} />
                            <Route path="/super-lig-predictions"        element={<Navigate to="/turkish-super-lig-predictions" replace />} />
                            <Route path="/jupiler-pro-league-predictions" element={<Navigate to="/belgian-pro-league-predictions" replace />} />
                            <Route path="/liga-profesional-predictions" element={<Navigate to="/argentina-primera-predictions" replace />} />
                            <Route path="/tomorrow"                     element={<Navigate to="/tomorrow-predictions" replace />} />
                            <Route path="/tomorrow-tips"                element={<Navigate to="/tomorrow-predictions" replace />} />
                            <Route path="/predictions-for-tomorrow"     element={<Navigate to="/tomorrow-predictions" replace />} />
                            <Route path="/weekend"                      element={<Navigate to="/weekend-predictions" replace />} />
                            <Route path="/saturday-predictions"         element={<Navigate to="/weekend-predictions" replace />} />
                            <Route path="/sunday-predictions"           element={<Navigate to="/weekend-predictions" replace />} />
                            <Route path="/asian-handicap"               element={<Navigate to="/asian-handicap-predictions" replace />} />
                            <Route path="/handicap-predictions"         element={<Navigate to="/asian-handicap-predictions" replace />} />
                            <Route path="/draw-no-bet"                  element={<Navigate to="/draw-no-bet-predictions" replace />} />
                            <Route path="/dnb"                          element={<Navigate to="/draw-no-bet-predictions" replace />} />
                            <Route path="/dnb-predictions"              element={<Navigate to="/draw-no-bet-predictions" replace />} />
                            <Route path="/win-to-nil"                   element={<Navigate to="/win-to-nil-predictions" replace />} />
                            <Route path="/clean-sheet-predictions"      element={<Navigate to="/win-to-nil-predictions" replace />} />
                            <Route path="/surebet-calculator"           element={<Navigate to="/arbitrage-calculator" replace />} />
                            <Route path="/hedge-calculator"             element={<Navigate to="/hedge-bet-calculator" replace />} />
                            <Route path="/implied-probability-calculator" element={<Navigate to="/odds-converter" replace />} />
                            <Route path="/betting-odds-calculator"      element={<Navigate to="/odds-converter" replace />} />
                            <Route path="/saudi-league-predictions"     element={<Navigate to="/saudi-pro-league-predictions" replace />} />
                            <Route path="/spl-predictions"              element={<Navigate to="/saudi-pro-league-predictions" replace />} />
                            <Route path="/brasileirao-predictions"      element={<Navigate to="/brazilian-serie-a-predictions" replace />} />
                            <Route path="/spfl-predictions"             element={<Navigate to="/scottish-premiership-predictions" replace />} />
                            <Route path="/sure-wins"                    element={<Navigate to="/sure-win-predictions" replace />} />
                            <Route path="/100-sure-predictions"         element={<Navigate to="/sure-win-predictions" replace />} />
                            <Route path="/sure-banker-picks"            element={<Navigate to="/sure-win-predictions" replace />} />
                            <Route path="/corners"                      element={<Navigate to="/corners-predictions" replace />} />
                            <Route path="/corner-predictions"           element={<Navigate to="/corners-predictions" replace />} />
                            <Route path="/cards"                        element={<Navigate to="/cards-predictions" replace />} />
                            <Route path="/card-predictions"             element={<Navigate to="/cards-predictions" replace />} />
                            <Route path="/booking-predictions"          element={<Navigate to="/cards-predictions" replace />} />
                            <Route path="/championship"                 element={<Navigate to="/championship-predictions" replace />} />
                            <Route path="/efl"                          element={<Navigate to="/championship-predictions" replace />} />
                            <Route path="/efl-championship"             element={<Navigate to="/championship-predictions" replace />} />
                            <Route path="/eredivisie"                   element={<Navigate to="/eredivisie-predictions" replace />} />
                            <Route path="/dutch-eredivisie"             element={<Navigate to="/eredivisie-predictions" replace />} />
                            <Route path="/primeira-liga"                element={<Navigate to="/primeira-liga-predictions" replace />} />
                            <Route path="/liga-portugal"                element={<Navigate to="/primeira-liga-predictions" replace />} />
                            <Route path="/portuguese-league"            element={<Navigate to="/primeira-liga-predictions" replace />} />
                            <Route path="/conference-league"            element={<Navigate to="/conference-league-predictions" replace />} />
                            <Route path="/uefa-conference-league"       element={<Navigate to="/conference-league-predictions" replace />} />
                            <Route path="/copa-libertadores"            element={<Navigate to="/copa-libertadores-predictions" replace />} />
                            <Route path="/libertadores"                 element={<Navigate to="/copa-libertadores-predictions" replace />} />
                            <Route path="/ev-calculator"                element={<Navigate to="/value-bet-calculator" replace />} />
                            <Route path="/expected-value-calculator"    element={<Navigate to="/value-bet-calculator" replace />} />
                            <Route path="/kelly-calculator"             element={<Navigate to="/kelly-criterion-calculator" replace />} />
                            <Route path="/over-1-5"                     element={<Navigate to="/over-1-5-goals-predictions" replace />} />
                            <Route path="/predictions"                  element={<Navigate to="/predict" replace />} />
                            <Route path="/football-predictions"         element={<Navigate to="/" replace />} />
                            <Route path="/soccer-predictions"           element={<Navigate to="/" replace />} />
                            <Route path="/tips"                         element={<Navigate to="/best-bets" replace />} />
                            <Route path="/free-tips"                    element={<Navigate to="/best-bets" replace />} />
                            <Route path="/sure-bets"                    element={<Navigate to="/best-bets" replace />} />
                            <Route path="/banker-bets"                  element={<Navigate to="/best-bets" replace />} />
                            <Route path="/betting-tips"                 element={<Navigate to="/best-bets" replace />} />
                            <Route path="/today"                        element={<Navigate to="/best-bets" replace />} />
                            <Route path="/fixtures"                     element={<Navigate to="/upcoming" replace />} />
                            <Route path="/vip"                          element={<Navigate to="/shop" replace />} />
                            <Route path="/premium"                      element={<Navigate to="/shop" replace />} />
                            <Route path="/pricing"                      element={<Navigate to="/shop" replace />} />
                            <Route path="/jackpot"                      element={<Navigate to="/jackpot-predictions" replace />} />
                            <Route path="/mega-jackpot"                 element={<Navigate to="/jackpot-predictions" replace />} />
                            <Route path="/sportpesa-jackpot"            element={<Navigate to="/jackpot-predictions" replace />} />
                            <Route path="/betika-jackpot"               element={<Navigate to="/jackpot-predictions" replace />} />
                            <Route path="/mozzart-jackpot"              element={<Navigate to="/jackpot-predictions" replace />} />
                            <Route path="/epl"                          element={<Navigate to="/premier-league-predictions" replace />} />
                            <Route path="/epl-predictions"              element={<Navigate to="/premier-league-predictions" replace />} />
                            <Route path="/premier-league"               element={<Navigate to="/premier-league-predictions" replace />} />
                            <Route path="/ucl"                          element={<Navigate to="/champions-league-predictions" replace />} />
                            <Route path="/ucl-predictions"              element={<Navigate to="/champions-league-predictions" replace />} />
                            <Route path="/champions-league"             element={<Navigate to="/champions-league-predictions" replace />} />
                            <Route path="/laliga"                       element={<Navigate to="/la-liga-predictions" replace />} />
                            <Route path="/la-liga"                      element={<Navigate to="/la-liga-predictions" replace />} />
                            <Route path="/seriea"                       element={<Navigate to="/serie-a-predictions" replace />} />
                            <Route path="/serie-a"                      element={<Navigate to="/serie-a-predictions" replace />} />
                            <Route path="/bundesliga"                   element={<Navigate to="/bundesliga-predictions" replace />} />
                            <Route path="/kpl"                          element={<Navigate to="/kpl-predictions" replace />} />
                            <Route path="/kenya-premier-league"         element={<Navigate to="/kpl-predictions" replace />} />
                            <Route path="/world-cup"                    element={<Navigate to="/world-cup-predictions" replace />} />
                            <Route path="/afcon"                        element={<Navigate to="/afcon-predictions" replace />} />
                            <Route path="/mls"                          element={<Navigate to="/us-soccer-predictions" replace />} />
                            <Route path="/mls-predictions"              element={<Navigate to="/us-soccer-predictions" replace />} />
                            <Route path="/livescore"                    element={<Navigate to="/live" replace />} />
                            <Route path="/livescores"                   element={<Navigate to="/live" replace />} />
                            <Route path="/live-scores"                  element={<Navigate to="/live" replace />} />
                            <Route path="/acca"                         element={<Navigate to="/accumulator" replace />} />
                            <Route path="/accumulators"                 element={<Navigate to="/accumulator" replace />} />
                            <Route path="/both-teams-to-score"          element={<Navigate to="/btts" replace />} />
                            <Route path="/over-2-5-goals"               element={<Navigate to="/btts" replace />} />
                            <Route path="/over-under-2-5"               element={<Navigate to="/btts" replace />} />
                            <Route path="/correct-scores"               element={<Navigate to="/correct-score" replace />} />
                            <Route path="/ht-ft"                        element={<Navigate to="/blog/halftime-fulltime-ht-ft-predictions-strategy" replace />} />
                            <Route path="/asian-handicap"               element={<Navigate to="/blog/asian-handicap-betting-explained" replace />} />
                            <Route path="/table"                        element={<Navigate to="/standings" replace />} />
                            <Route path="/tables"                       element={<Navigate to="/standings" replace />} />
                            <Route path="/odds"                         element={<Navigate to="/dropping-odds" replace />} />
                            <Route path="*"                             element={<RouteBoundary component={NotFound} />} />
                          </Routes>
                        </ErrorBoundary>
                      </Suspense>
                      <DeferredGlobalOverlays />
                      <MobileBottomNav />
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
