import React, { useState, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, Flame, Activity, TrendingUp, Calculator, Users, Wallet, Newspaper, BarChart2, BarChart, Trophy, ShoppingBag, Gift, Zap, Info, LayoutDashboard, Film, Search, BookOpen, Target } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CoinBalance } from "./CoinBalance";
import { NotificationBell } from "./NotificationBell";
import { RealtimeStatus } from "./RealtimeStatus";

const navLinks = [
  { to: "/",           label: "Predictions",  icon: Zap },
  { to: "/live",       label: "Live",         icon: Activity },
  { to: "/news",       label: "News",         icon: Newspaper },
  { to: "/value-bets", label: "Value Bets",   icon: TrendingUp },
  { to: "/accumulator",label: "Acca Builder", icon: Calculator },
  { to: "/tipsters",   label: "Tipsters",     icon: Users },
  { to: "/bankroll",   label: "Bankroll",     icon: Wallet },
  { to: "/leaderboard",label: "Leaderboard",  icon: Trophy },
  { to: "/insights",   label: "Insights",     icon: BarChart2 },
  { to: "/performance",label: "Performance",  icon: BarChart2,  protected: true },
  { to: "/shop",       label: "Shop",         icon: ShoppingBag,protected: true },
  { to: "/rewards",    label: "Rewards",      icon: Gift,       protected: true },
  { to: "/best-bets",  label: "Best Bets",    icon: Flame },
  { to: "/predict",    label: "Predictor",    icon: Zap },
  { to: "/sports",     label: "More Sports",   icon: Zap },
  { to: "/highlights", label: "Highlights",    icon: Film },
  { to: "/statistics", label: "Statistics",    icon: BarChart2 },
  { to: "/standings",  label: "Standings",     icon: Trophy },
  { to: "/players",    label: "Player Search", icon: Search },
  { to: "/blog",       label: "Blog",          icon: BookOpen },
  { to: "/about",      label: "About",        icon: Info },
];

const topNavLinks = [
  { to: "/",            label: "Predictions" },
  { to: "/live",        label: "Live" },
  { to: "/best-bets",   label: "Best Bets" },
  { to: "/predict",     label: "Predictor" },
  { to: "/value-bets",  label: "Value Bets" },
  { to: "/news",        label: "News" },
];

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const visibleLinks = navLinks.filter(l => !l.protected || user);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">PP</div>
            <span className="text-lg font-bold hidden sm:block">PredictPro</span>
            <RealtimeStatus />
          </Link>

          {/* Desktop nav - top links only */}
          <nav className="hidden lg:flex items-center gap-5">
            {topNavLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === to ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <CoinBalance />
                <NotificationBell />
                <Button variant="outline" size="sm" onClick={() => { void signOut(); }} className="gap-1.5 hidden sm:flex">
                  <LogOut className="h-4 w-4" />Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth"><Button variant="default" size="sm">Sign In</Button></Link>
            )}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 overflow-y-auto">
                <div className="flex flex-col gap-0.5 mt-6">
                  {visibleLinks.map(({ to, label, icon: Icon }) => (
                    <Link key={to} to={to}
                      onPointerDown={() => startTransition(() => setOpen(false))}
                      onClick={() => startTransition(() => setOpen(false))}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted ${location.pathname === to ? 'bg-muted text-primary' : ''}`}>
                      <Icon className="h-4 w-4 flex-shrink-0" />{label}
                    </Link>
                  ))}
                  {user && (
                    <>
                      <Link to="/admin"
                        onPointerDown={() => startTransition(() => setOpen(false))}
                        onClick={() => startTransition(() => setOpen(false))}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted">
                        <LayoutDashboard className="h-4 w-4" />Admin
                      </Link>
                      <div className="border-t mt-2 pt-2">
                        <button onClick={() => { startTransition(() => setOpen(false)); void signOut(); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full">
                          <LogOut className="h-4 w-4" />Sign Out
                        </button>
                      </div>
                    </>
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
