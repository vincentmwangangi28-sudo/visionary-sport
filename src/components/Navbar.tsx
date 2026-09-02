import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  LogOut, 
  Flame, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Calculator, 
  Users, 
  Wallet, 
  Newspaper, 
  BarChart2, 
  Trophy, 
  ShoppingBag, 
  Gift, 
  Zap, 
  Info, 
  Search, 
  CheckCircle2, 
  SlidersHorizontal, 
  ShieldCheck, 
  Layers,
  Globe,
  Clock,
  Percent
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { CoinBalance } from "./CoinBalance";
import { NotificationBell } from "./NotificationBell";
import { RealtimeStatus } from "./RealtimeStatus";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { TimezoneSelector } from "./TimezoneSelector";
import { OddsFormatSelector } from "./OddsFormatSelector";
import { DataSaverToggle } from "./DataSaverToggle";
import { GeoRegionSelector } from "./GeoRegionSelector";
import { CurrencySelector } from "./CurrencySelector";
import { GlobalSettingsModal } from "./GlobalSettingsModal";
import { UnifiedSearchTrigger } from "./UnifiedSearchTrigger";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { preferences, t } = useUserPreferences();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: "/",              label: t('nav.predictions', "Predictions"),    icon: Zap },
    { to: "/tournaments",   label: "Global Tournaments",                  icon: Globe },
    { to: "/screener",      label: t('nav.screener', "Match Screener"), icon: SlidersHorizontal },
    { to: "/dropping-odds", label: t('nav.dropping_odds', "Dropping Odds"),  icon: TrendingDown },
    { to: "/track-record",  label: t('nav.track_record', "Track Record"),   icon: ShieldCheck },
    { to: "/value-bets",    label: t('nav.value_bets', "Value Bets"),     icon: TrendingUp },
    { to: "/archive",       label: t('nav.archive', "Results Archive"),icon: CheckCircle2 },
    { to: "/live",          label: t('nav.live', "Live Scores"),    icon: Activity },
    { to: "/accumulator",   label: t('nav.acca', "Acca Builder"),   icon: Calculator },
    { to: "/correct-score", label: t('nav.correct_score', "Correct Score"),  icon: Layers },
    { to: "/btts",          label: t('nav.btts', "BTTS (GG)"),      icon: Flame },
    { to: "/tipsters",      label: t('nav.tipsters', "Tipsters"),       icon: Users },
    { to: "/bankroll",      label: t('nav.bankroll', "Bankroll"),       icon: Wallet },
    { to: "/leaderboard",   label: t('nav.leaderboard', "Leaderboard"),    icon: Trophy },
    { to: "/news",          label: t('nav.news', "News"),           icon: Newspaper },
    { to: "/insights",      label: t('nav.insights', "Insights"),       icon: BarChart2 },
    { to: "/performance",   label: t('nav.performance', "Performance"),    icon: BarChart2, protected: true },
    { to: "/shop",          label: t('nav.shop', "Shop"),           icon: ShoppingBag, protected: true },
    { to: "/rewards",       label: t('nav.rewards', "Rewards"),        icon: Gift, protected: true },
    { to: "/best-bets",     label: t('nav.best_bets', "Best Bets"),      icon: Flame },
    { to: "/predict",       label: t('nav.predictor', "Predictor"),      icon: Zap },
    { to: "/standings",     label: t('nav.standings', "Standings"),       icon: Trophy },
    { to: "/players",       label: t('nav.players', "Player Search"),  icon: Search },
    { to: "/preferences",   label: t('nav.preferences', "Preferences"),  icon: SlidersHorizontal },
    { to: "/methodology",   label: "Methodology",    icon: ShieldCheck },
    { to: "/about",         label: "About",          icon: Info },
  ];

  const topNavLinks = [
    { to: "/",              label: t('nav.predictions', "Predictions") },
    { to: "/tournaments",   label: "Tournaments" },
    { to: "/screener",      label: t('nav.screener', "Screener") },
    { to: "/dropping-odds", label: t('nav.dropping_odds', "Dropping Odds") },
    { to: "/track-record",  label: t('nav.track_record', "Track Record") },
    { to: "/value-bets",    label: t('nav.value_bets', "Value Bets") },
    { to: "/live",          label: t('nav.live', "Live") },
    { to: "/accumulator",   label: t('nav.acca', "Acca") },
    { to: "/archive",       label: t('nav.archive', "Archive") },
  ];

  const visibleLinks = navLinks.filter(l => !l.protected || user);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-sm">PP</div>
              <span className="text-lg font-bold hidden sm:block">PredictPro</span>
            </Link>
            <RealtimeStatus />
          </div>

          {/* Desktop nav */}
          <nav className="hidden xl:flex items-center gap-2">
            {topNavLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors hover:text-primary ${location.pathname === to ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Unified Global Search Trigger */}
          <div className="hidden lg:flex items-center">
            <UnifiedSearchTrigger variant="full" className="w-48 xl:w-64" />
          </div>

          {/* Global Controls & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile / Tablet search icon button */}
            <div className="lg:hidden">
              <UnifiedSearchTrigger variant="icon" />
            </div>

            {/* Global Settings & Personalization Hub */}
            <GlobalSettingsModal triggerClassName="hidden xl:flex" />

            {/* Currency Selector */}
            <CurrencySelector variant="outline" className="hidden sm:flex" />

            {/* Global Language Selector */}
            <LanguageSwitcher />

            {/* Timezone Selector */}
            <TimezoneSelector />

            {/* Odds Format Selector */}
            <div className="hidden md:block">
              <OddsFormatSelector />
            </div>

            {/* Data Saver Mode Toggle */}
            <div className="hidden lg:block">
              <DataSaverToggle />
            </div>

            {/* Risk profile shortcut */}
            <Link to="/preferences" className="hidden 2xl:block">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold px-2.5 capitalize"
                aria-label={`Betting profile: ${preferences.riskProfile}. Click to customize.`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>{preferences.riskProfile}</span>
              </Button>
            </Link>

            {user ? (
              <>
                <CoinBalance />
                <NotificationBell />
                <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5 hidden sm:flex">
                  <LogOut className="h-4 w-4" />{t('nav.signout', 'Sign Out')}
                </Button>
              </>
            ) : (
              <Link to="/auth"><Button variant="default" size="sm">{t('nav.signin', 'Sign In')}</Button></Link>
            )}

            {/* Mobile / All links drawer */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto p-4 flex flex-col">
                <SheetHeader className="text-left pb-2 border-b">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-black">PP</div>
                    PredictPro Global
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Search Trigger */}
                <div className="mt-3">
                  <UnifiedSearchTrigger
                    variant="full"
                    placeholder="Search matches, leagues, teams..."
                    className="w-full max-w-none"
                  />
                </div>

                {/* Mobile Quick Global Settings */}
                <div className="bg-muted/40 p-3 rounded-xl border my-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Regional & Global Config</span>
                    <GlobalSettingsModal triggerClassName="h-6 px-2 text-[10px]" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Football Priority Region</span>
                    <GeoRegionSelector variant="compact" className="w-full justify-between bg-background border px-2.5 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Currency & Staking</span>
                    <CurrencySelector variant="outline" className="w-full justify-between bg-background border px-2.5 h-8" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Odds Format</span>
                      <OddsFormatSelector compact />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1">Data Saver</span>
                      <DataSaverToggle compact />
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
                  {visibleLinks.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === to
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  ))}
                  {user && (
                    <Button variant="ghost" size="sm" onClick={() => { signOut(); setOpen(false); }} className="justify-start gap-3 px-3 mt-2 text-muted-foreground">
                      <LogOut className="h-4 w-4" />{t('nav.signout', 'Sign Out')}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

