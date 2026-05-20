import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Trophy, Menu, LogOut, ShoppingBag, Gift, BarChart2, Zap, Info, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CoinBalance } from "./CoinBalance";
import { RealtimeStatus } from "./RealtimeStatus";
import aiIcon from "@/assets/ai-prediction-icon.png";

const navLinks = [
  { to: "/", label: "Predictions", icon: Zap },
  { to: "/performance", label: "Performance", icon: BarChart2, protected: true },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/shop", label: "Shop", icon: ShoppingBag, protected: true },
  { to: "/rewards", label: "Rewards", icon: Gift, protected: true },
  { to: "/insights", label: "Insights", icon: BarChart2 },
  { to: "/about", label: "About", icon: Info },
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
          <Link to="/" className="flex items-center gap-3">
            <img src={aiIcon} alt="PredictPro" className="w-10 h-10" width="40" height="40" loading="eager" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">PredictPro</span>
            <RealtimeStatus />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {visibleLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === to ? "text-primary" : ""}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <CoinBalance />
                <Button variant="outline" size="sm" onClick={signOut} className="gap-2 hover:scale-105 transition-transform hidden sm:flex">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="hero" size="sm">Sign In</Button>
              </Link>
            )}

            {/* Mobile hamburger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-1 mt-8">
                  {visibleLinks.map(({ to, label, icon: Icon }) => (
                    <Link key={to} to={to} onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted ${location.pathname === to ? "bg-muted text-primary" : ""}`}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  ))}
                  {user && (
                    <>
                      <Link to="/admin" onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted">
                        <LayoutDashboard className="h-4 w-4" />
                        Admin
                      </Link>
                      <div className="border-t mt-2 pt-2">
                        <button onClick={() => { signOut(); setOpen(false); }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors">
                          <LogOut className="h-4 w-4" />
                          Sign Out
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
