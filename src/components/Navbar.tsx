import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LogOut,
  SlidersHorizontal,
  Shield,
  Ticket,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useBetSlip } from "@/hooks/useBetSlip";
import { useUserPreferences, OddsFormat } from "@/hooks/useUserPreferences";
import { UnifiedSearchTrigger } from "@/components/UnifiedSearchTrigger";
import { GeoRegionSelector } from "@/components/GeoRegionSelector";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CORE_LINKS = [
  { to: "/", label: "Matches" },
  { to: "/live", label: "Live Scores", isLive: true },
  { to: "/standings", label: "Standings" },
  { to: "/tournaments", label: "Leagues" },
  { to: "/screener", label: "Stats Screener" },
  { to: "/accumulator", label: "Acca Builder" },
];

const MORE_CATEGORIES = [
  {
    heading: "Top Competitions",
    items: [
      { to: "/premier-league-predictions", label: "Premier League" },
      { to: "/champions-league-predictions", label: "UEFA Champions League" },
      { to: "/la-liga-predictions", label: "Spanish LaLiga" },
      { to: "/serie-a-predictions", label: "Italian Serie A" },
      { to: "/bundesliga-predictions", label: "German Bundesliga" },
      { to: "/ligue-1-predictions", label: "French Ligue 1" },
      { to: "/kpl-predictions", label: "FKF Premier League" },
      { to: "/mls-predictions", label: "Major League Soccer" },
    ],
  },
  {
    heading: "Statistical Markets",
    items: [
      { to: "/sure-win-predictions", label: "High Probability (80%+)" },
      { to: "/both-teams-to-score-and-win-predictions", label: "BTTS & Win" },
      { to: "/over-under-predictions", label: "Over / Under 2.5 Goals" },
      { to: "/correct-score", label: "Exact Correct Score" },
      { to: "/draw-no-bet-predictions", label: "Draw No Bet (DNB)" },
      { to: "/asian-handicap-predictions", label: "Asian Handicap" },
      { to: "/jackpot-predictions", label: "17-Game Mega Jackpot" },
    ],
  },
  {
    heading: "Pro Tools & Data",
    items: [
      { to: "/h2h", label: "Head-to-Head Simulator" },
      { to: "/players", label: "Player 10.0 Ratings" },
      { to: "/teams", label: "Club xG & Form Hub" },
      { to: "/streaks", label: "Winning Streaks Radar" },
      { to: "/dropping-odds", label: "Dropping Odds Movement" },
      { to: "/value-bet-calculator", label: "Value (+EV) Calculator" },
      { to: "/archive", label: "Settled Results Archive" },
    ],
  },
];

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { selections, setIsOpen: setSlipOpen } = useBetSlip();
  const { preferences, setOddsFormat } = useUserPreferences();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    if (nextDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setIsDark(nextDark);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/");

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 gap-5">
          {/* ZONE 1: Broadcast Brand Wordmark */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <span className="h-7 w-7 rounded-md bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center tracking-tighter">
              PP
            </span>
            <span className="font-extrabold text-lg tracking-tight text-white">
              Predict<span className="text-emerald-400">Pro</span>
            </span>
          </Link>

          {/* ZONE 2: Primary Broadcast Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-1 flex-1"
          >
            {CORE_LINKS.map(({ to, label, isLive }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-1.5 rounded-md text-[13px] transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800 font-medium"
                  }`}
                >
                  {isLive && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-slate-950" : "bg-emerald-400 animate-pulse"
                      }`}
                    />
                  )}
                  <span>{label}</span>
                </Link>
              );
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md text-[13px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <span>More</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[560px] p-4 grid grid-cols-3 gap-4">
                {MORE_CATEGORIES.map((cat) => (
                  <div key={cat.heading} className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary px-2">
                      {cat.heading}
                    </p>
                    <div className="space-y-0.5">
                      {cat.items.map((item) => (
                        <DropdownMenuItem key={item.to} asChild className="cursor-pointer py-1.5 px-2 text-xs">
                          <Link
                            to={item.to}
                            className={`w-full ${
                              isActive(item.to) ? "font-bold text-primary" : "text-foreground/85"
                            }`}
                          >
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* ZONE 3: Search, Slip & Settings */}
          <div className="flex items-center gap-2 shrink-0">
            <Suspense fallback={null}>
              <UnifiedSearchTrigger variant="pill" />
            </Suspense>

            {/* Match Slip Trigger */}
            <button
              type="button"
              onClick={() => setSlipOpen(true)}
              title={`Open Match Slip (${selections.length} selections)`}
              className={`h-8 px-3 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                selections.length > 0
                  ? "bg-amber-400 text-slate-950 border-amber-400 font-bold"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
            >
              <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Slip</span>
              <span className="font-mono tabular-nums text-[11px]">({selections.length})</span>
            </button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Display Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Odds format and regional settings"
                  className="hidden sm:inline-flex h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-3 space-y-3">
                <DropdownMenuLabel className="p-0 text-xs font-semibold text-foreground">
                  Display Preferences
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Odds Format
                  </span>
                  <div className="grid grid-cols-4 gap-1 bg-muted p-1 rounded-md">
                    {(
                      [
                        { id: "decimal", label: "1.85" },
                        { id: "probabilities", label: "%" },
                        { id: "fractional", label: "5/6" },
                        { id: "american", label: "+120" },
                      ] as { id: OddsFormat; label: string }[]
                    ).map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setOddsFormat(fmt.id)}
                        className={`py-1 rounded text-[11px] font-mono tabular-nums font-medium transition-colors ${
                          preferences.oddsFormat === fmt.id
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Region
                  </span>
                  <GeoRegionSelector variant="compact" />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Auth Control */}
            <div className="hidden md:flex items-center gap-1.5">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                        <Shield className="h-3.5 w-3.5" /> Admin
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button size="sm" className="h-8 px-3 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Drawer Trigger */}
            <div className="lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open navigation menu" className="h-8 w-8 text-slate-200 hover:text-white hover:bg-slate-800">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[340px] overflow-y-auto p-5">
                  <SheetHeader className="text-left pb-4 border-b border-border">
                    <SheetTitle className="text-base font-extrabold">
                      Predict<span className="text-primary">Pro</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="py-4 space-y-5">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground px-2 mb-1">
                        Navigation
                      </p>
                      {CORE_LINKS.map(({ to, label }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setOpen(false)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive(to)
                              ? "bg-primary text-primary-foreground font-bold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <span>{label}</span>
                        </Link>
                      ))}
                    </div>

                    {MORE_CATEGORIES.map((cat) => (
                      <div key={cat.heading} className="space-y-1">
                        <p className="text-xs font-semibold text-primary px-2 mb-1">
                          {cat.heading}
                        </p>
                        <div className="grid grid-cols-1 gap-0.5">
                          {cat.items.map(({ to, label }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setOpen(false)}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                isActive(to)
                                  ? "bg-primary/10 text-primary font-bold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              }`}
                            >
                              {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t border-border">
                      {user ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOpen(false);
                            handleSignOut();
                          }}
                          className="w-full justify-center gap-2 text-xs"
                        >
                          <LogOut className="h-3.5 w-3.5" /> Sign Out
                        </Button>
                      ) : (
                        <Link to="/auth" onClick={() => setOpen(false)}>
                          <Button size="sm" className="w-full text-xs font-bold">
                            Sign In
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
