import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, ShoppingBag, Gift, BarChart3, Trophy, Newspaper, Lightbulb, Info, Home, Shield } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CoinBalance } from "./CoinBalance";
import { RealtimeStatus } from "./RealtimeStatus";
import aiIcon from "@/assets/ai-prediction-icon.png";
import { motion, AnimatePresence } from "framer-motion";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { friendlyOAuthError, logOAuth } from "@/lib/oauthLogger";

const GoogleIconSmall = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);


const navLinks = [
  { to: "/", label: "Predictions", icon: Home },
  { to: "/performance", label: "Performance", icon: BarChart3 },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/news", label: "News", icon: Newspaper },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/about", label: "About", icon: Info },
];

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    logOAuth({
      level: 'info',
      provider: 'google',
      stage: 'start',
      message: 'Navbar Google OAuth initiated',
      context: { redirect_uri: window.location.origin },
    });
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) {
        logOAuth({ level: 'info', provider: 'google', stage: 'redirect', message: 'Browser redirecting to Google' });
        return;
      }
      navigate('/');
    } catch (error: any) {
      const raw = error?.message || String(error);
      const friendly = friendlyOAuthError(raw);
      logOAuth({
        level: 'error',
        provider: 'google',
        stage: 'error',
        message: friendly.title,
        context: { raw },
      });
      toast.error(friendly.title, {
        description: friendly.hint ? `${friendly.message} ${friendly.hint}` : friendly.message,
      });
      setGoogleLoading(false);
    }
  };

  const allLinks = isAdmin
    ? [...navLinks, { to: "/admin", label: "Admin", icon: Shield }]
    : navLinks;

  return (
    <>
      <nav aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <img src={aiIcon} alt="PredictPro" className="w-8 h-8 md:w-10 md:h-10" width="40" height="40" loading="eager" />
              <span className="text-lg md:text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                PredictPro
              </span>
              <RealtimeStatus />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Site pages">
              {allLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                    location.pathname === link.to
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <CoinBalance />
                  <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5 hidden sm:flex">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Sign Out</span>
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button size="sm" className="bg-gradient-hero text-primary-foreground hover:opacity-90">
                    Sign In
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="lg:hidden" 
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-[70] w-72 bg-card border-l border-border shadow-2xl lg:hidden flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-bold text-lg">Menu</span>
                <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {allLinks.map(link => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === link.to
                          ? 'text-primary bg-primary/10'
                          : 'text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
              {user && (
                <div className="p-4 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => { signOut(); setMobileOpen(false); }} className="w-full gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
