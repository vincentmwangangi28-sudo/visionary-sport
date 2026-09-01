import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Film, 
  Search, 
  BookOpen, 
  CheckCircle2, 
  SlidersHorizontal, 
  ShieldCheck, 
  Layers 
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { CoinBalance } from "./CoinBalance";
import { NotificationBell } from "./NotificationBell";
import { RealtimeStatus } from "./RealtimeStatus";

const navLinks = [
  { to: "/",              label: "Predictions",    icon: Zap },
  { to: "/screener",      label: "Match Screener", icon: SlidersHorizontal },
  { to: "/dropping-odds", label: "Dropping Odds",  icon: TrendingDown },
  { to: "/track-record",  label: "Track Record",   icon: ShieldCheck },
  { to: "/value-bets",    label: "Value Bets",     icon: TrendingUp },
  { to: "/archive",       label: "Results Archive",icon: CheckCircle2 },
  { to: "/live",          label: "Live Scores",    icon: Activity },
  { to: "/accumulator",   label: "Acca Builder",   icon: Calculator },
  { to: "/correct-score", label: "Correct Score",  icon: Layers },
  { to: "/btts",          label: "BTTS (GG)",      icon: Flame },
  { to: "/tipsters",      label: "Tipsters",       icon: Users },
  { to: "/bankroll",      label: "Bankroll",       icon: Wallet },
  { to: "/leaderboard",   label: "Leaderboard",    icon: Trophy },
  { to: "/news",          label: "News",           icon: Newspaper },
  { to: "/insights",      label: "Insights",       icon: BarChart2 },
  { to: "/performance",   label: "Performance",    icon: BarChart2, protected: true },
  { to: "/shop",          label: "Shop",           icon: ShoppingBag, protected: true },
  { to: "/rewards",       label: "Rewards",        icon: Gift, protected: true },
  { to: "/best-bets",     label: "Best Bets",      icon: Flame },
  { to: "/predict",       label: "Predictor",      icon: Zap },
  { to: "/standings",     label: "Standings",       icon: Trophy },
  { to: "/players",       label: "Player Search",  icon: Search },
  { to: "/methodology",   label: "Methodology",    icon: ShieldCheck },
  { to: "/about",         label: "About",          icon: Info },
];

const topNavLinks = [
  { to: "/",              label: "Predictions" },
  { to: "/screener",      label: "Screener" },
  { to: "/dropping-odds", label: "Dropping Odds" },
  { to: "/track-record",  label: "Track Record" },
  { to: "/value-bets",    label: "Value Bets" },
  { to: "/live",          label: "Live" },
  { to: "/accumulator",   label: "Acca" },
  { to: "/archive",       label: "Archive" },
];

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { preferences } = useUserPreferences();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const visibleLinks = navLinks.filter(l => !l.protected || user);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-sm">PP</div>
            <span className="text-lg font-bold hidden sm:block">PredictPro</span>
            <RealtimeStatus />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-4">
            {topNavLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors hover:text-primary ${location.pathname === to ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/preferences" className="hidden sm:block">
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
                  <LogOut className="h-4 w-4" />Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth"><Button variant="default" size="sm">Sign In</Button></Link>
            )}

            {/* Mobile / All links drawer */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 overflow-y-auto">
                <div className="flex flex-col gap-1 mt-6">
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
                      <LogOut className="h-4 w-4" />Sign Out
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
