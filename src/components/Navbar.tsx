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
  Sparkles,
  Settings,
  Pin,
  ChevronDown,
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Map
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { LEAGUE_HUBS } from "@/data/leagueHubs";
import { CoinBalance } from "./CoinBalance";
import { NotificationBell } from "./NotificationBell";
import { UnifiedSearchTrigger } from "./UnifiedSearchTrigger";
import { PWAInstallButton } from "./PWAInstallButton";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { t } = useUserPreferences();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navLinks = [
    ...(isAdmin ? [{ to: "/admin", label: "Admin Operations", icon: ShieldCheck, protected: true }] : []),
    { to: "/",              label: t('nav.predictions', "Predictions"),    icon: Zap },
    { to: "/upcoming",      label: "Upcoming Fixtures",                   icon: Calendar },
    { to: "/dashboard",     label: "My Dashboard",                        icon: Pin },
    { to: "/recommendations", label: "AI Recommended",                    icon: Sparkles },
    { to: "/tournaments",   label: "Global Tournaments",                  icon: Globe },
    { to: "/screener",      label: t('nav.screener', "Match Screener"), icon: SlidersHorizontal },
    { to: "/dropping-odds", label: t('nav.dropping_odds', "Dropping Odds"),  icon: TrendingDown },
    { to: "/track-record",  label: t('nav.track_record', "Track Record"),   icon: ShieldCheck },
    { to: "/value-bets",    label: t('nav.value_bets', "Value Bets"),     icon: TrendingUp },
    { to: "/streaks",       label: "Streaks & Trends Radar",              icon: Flame },
    { to: "/h2h",           label: "H2H Matchup Simulator",               icon: ArrowLeftRight },
    { to: "/archive",       label: t('nav.archive', "Results Archive"),icon: CheckCircle2 },
    { to: "/live",          label: t('nav.live', "Live Scores"),    icon: Activity },
    { to: "/accumulator",   label: t('nav.acca', "Acca Builder"),   icon: Calculator },
    { to: "/correct-score", label: t('nav.correct_score', "Correct Score"),  icon: Layers },
    { to: "/btts",          label: t('nav.btts', "BTTS (GG)"),      icon: Flame },
    { to: "/blog",          label: "Strategy Blog Hub",                   icon: BookOpen },
    { to: "/premier-league-predictions", label: "Premier League Tips",     icon: Trophy },
    { to: "/champions-league-predictions", label: "Champions League",      icon: Trophy },
    { to: "/la-liga-predictions", label: "La Liga Predictions",           icon: Trophy },
    { to: "/bundesliga-predictions", label: "Bundesliga Analysis",        icon: Trophy },
    { to: "/serie-a-predictions", label: "Serie A Predictions",           icon: Trophy },
    { to: "/kpl-predictions", label: "Kenya Premier League",              icon: Trophy },
    { to: "/jackpot-predictions", label: "Mega Jackpot Picks",            icon: Trophy },
    { to: "/us-soccer-predictions", label: "US Soccer & MLS",             icon: Trophy },
    { to: "/world-cup-predictions", label: "FIFA World Cup",              icon: Globe },
    { to: "/afcon-predictions", label: "AFCON Predictions",               icon: Globe },
    { to: "/tipsters",      label: t('nav.tipsters', "Tipsters"),       icon: Users },
    { to: "/bankroll",      label: t('nav.bankroll', "Bankroll"),       icon: Wallet },
    { to: "/leaderboard",   label: t('nav.leaderboard', "Leaderboard"),    icon: Trophy },
    { to: "/news",          label: t('nav.news', "News"),           icon: Newspaper },
    { to: "/insights",      label: t('nav.insights', "Insights"),       icon: BarChart2 },
    { to: "/statistics",    label: "H2H Statistics",                     icon: BarChart2 },
    { to: "/highlights",    label: "Video Highlights",                   icon: Activity },
    { to: "/sports",        label: "Multi-Sports",                       icon: Globe },
    { to: "/performance",   label: t('nav.performance', "Performance"),    icon: BarChart2, protected: true },
    { to: "/shop",          label: t('nav.shop', "Shop"),           icon: ShoppingBag, protected: true },
    { to: "/rewards",       label: t('nav.rewards', "Rewards"),        icon: Gift, protected: true },
    { to: "/best-bets",     label: t('nav.best_bets', "Best Bets"),      icon: Flame },
    { to: "/predict",       label: t('nav.predictor', "Predictor"),      icon: Zap },
    { to: "/standings",     label: t('nav.standings', "Standings"),       icon: Trophy },
    { to: "/players",       label: t('nav.players', "Player Search"),  icon: Search },
    { to: "/sitemap",       label: "HTML Sitemap",                       icon: Map },
    { to: "/preferences",   label: t('nav.preferences', "Preferences"),  icon: SlidersHorizontal },
    { to: "/methodology",   label: "Methodology",    icon: ShieldCheck },
    { to: "/about",         label: "About",          icon: Info },
  ];

  const primaryDesktopLinks = [
    { to: "/",              label: t('nav.predictions', "Predictions") },
    { to: "/upcoming",      label: "Upcoming" },
    { to: "/recommendations", label: "AI Picks" },
    { to: "/value-bets",    label: t('nav.value_bets', "Value Bets") },
    { to: "/live",          label: t('nav.live', "Live"), isLive: true },
    { to: "/accumulator",   label: t('nav.acca', "Acca Builder") },
  ];

  const extendedDesktopLinks = [
    { to: "/streaks",       label: "Streaks Radar" },
    { to: "/dropping-odds", label: t('nav.dropping_odds', "Dropping Odds") },
    { to: "/tournaments",   label: "Tournaments" },
    { to: "/track-record",  label: t('nav.track_record', "Track Record") },
  ];

  const visibleLinks = navLinks.filter(l => !l.protected || user);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-sm group-hover:scale-105 transition-transform">PP</div>
              <span className="text-lg font-bold hidden sm:block tracking-tight">PredictPro</span>
            </Link>
          </div>

          {/* Desktop nav (responsive for both tablets/laptops md: and wide desktops xl:) */}
          <nav className="hidden md:flex items-center gap-1 xl:gap-1.5" aria-label="Main Navigation">
            {primaryDesktopLinks.map(({ to, label, isLive }) => (
              <Link
                key={to}
                to={to}
                className={`relative text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:text-primary ${
                  location.pathname === to
                    ? 'text-primary bg-primary/10 font-bold'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {label}
                  {isLive && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </span>
              </Link>
            ))}

            {/* Extended links visible on large desktop viewports */}
            {extendedDesktopLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`hidden xl:inline-flex text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:text-primary ${
                  location.pathname === to
                    ? 'text-primary bg-primary/10 font-bold'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Desktop Leagues Hub Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="League Prediction Hubs"
                >
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span>Leagues</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-1.5 shadow-xl bg-popover/95 backdrop-blur-md">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  League Prediction Hubs
                </DropdownMenuLabel>
                {LEAGUE_HUBS.map((league) => (
                  <DropdownMenuItem key={league.to} asChild>
                    <Link to={league.to} className="flex items-center gap-2.5 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                      <span className="text-sm">{league.flag}</span>
                      <span className="font-medium">{league.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop Quick Directory Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="More navigation links"
                >
                  <span>More</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60 p-1.5 shadow-xl bg-popover/95 backdrop-blur-md">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  Markets & Radar
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/screener" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-purple-500" />
                    <span>Match Screener</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/streaks" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    <span>Streaks &amp; Trends Radar</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/h2h" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-sky-500" />
                    <span>H2H Matchup Simulator</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/btts" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    <span>BTTS (Both Teams Score)</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/correct-score" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <Layers className="h-3.5 w-3.5 text-blue-500" />
                    <span>Correct Score Matrices</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dropping-odds" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    <span>Dropping Odds Radar</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tournaments" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <Globe className="h-3.5 w-3.5 text-amber-500" />
                    <span>Global Tournaments</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                  Strategy & Insights
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/blog" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer font-semibold text-primary">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span>Strategy Blog &amp; Guides</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/track-record" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Verified Track Record</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/standings" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                    <span>League Standings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/statistics" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <BarChart2 className="h-3.5 w-3.5 text-cyan-500" />
                    <span>H2H Statistics</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/players" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <Search className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Player Search</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/highlights" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <Activity className="h-3.5 w-3.5 text-rose-500" />
                    <span>Video Highlights</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tipsters" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <Users className="h-3.5 w-3.5 text-green-500" />
                    <span>Verified Tipsters</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/archive" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Results Archive</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/methodology" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span>Mathematical Methodology</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/sitemap" className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md cursor-pointer">
                    <Map className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>HTML Sitemap</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

            {/* PWA In-App Install Button */}
            <div className="hidden sm:flex items-center">
              <PWAInstallButton variant="outline" size="sm" />
            </div>

            {/* Quick My Dashboard Shortcut */}
            <Link to="/dashboard" title="Personalized Match Dashboard & Pinned Stats">
              <Button
                variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 gap-1.5 text-xs font-semibold px-2.5 ${
                  location.pathname === '/dashboard'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Open Personalized Dashboard"
              >
                <Pin className="h-3.5 w-3.5 fill-current" />
                <span className="hidden md:inline">My Dashboard</span>
              </Button>
            </Link>

            {/* Quick Preferences Shortcut */}
            <Link to="/preferences" title="Customize Strategy, Region, Odds & Currency">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Open Preferences and Regional Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>

            {/* Quick Admin Shortcut if user has admin privileges */}
            {isAdmin && (
              <Link to="/admin" title="PredictPro Admin Operations Hub">
                <Button
                  variant={location.pathname === '/admin' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-8 gap-1.5 text-xs font-semibold px-2.5 ${
                    location.pathname === '/admin'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                      : 'text-emerald-500 hover:text-emerald-600 border-emerald-500/30 bg-emerald-500/5'
                  }`}
                  aria-label="Open Admin Dashboard"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Admin</span>
                </Button>
              </Link>
            )}

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

                {/* Mobile Dashboard & Preferences Shortcuts */}
                <div className="my-3 space-y-2">
                  <div className="w-full">
                    <PWAInstallButton className="w-full justify-center" size="sm" variant="outline" />
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors text-xs font-semibold text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Pin className="h-4 w-4 text-primary fill-primary/30" />
                      My Pinned Dashboard
                    </span>
                    <span className="text-[10px] text-primary font-bold">Open &rarr;</span>
                  </Link>
                  <Link
                    to="/preferences"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors text-xs font-semibold text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      Preferences & Regional Settings
                    </span>
                    <span className="text-[10px] text-muted-foreground">Configure</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 transition-colors text-xs font-semibold text-foreground"
                    >
                      <span className="flex items-center gap-2 text-emerald-500">
                        <ShieldCheck className="h-4 w-4" />
                        Admin Operations Hub
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold">Open &rarr;</span>
                    </Link>
                  )}
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

