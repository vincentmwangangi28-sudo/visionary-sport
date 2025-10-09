import { Button } from "@/components/ui/button";
import { Trophy, Menu, Coins, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import aiIcon from "@/assets/ai-prediction-icon.png";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (user) {
      loadUserCoins();
    }
  }, [user]);

  const loadUserCoins = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      setCoins(data?.coins || 0);
    } catch (error) {
      console.error('Error loading coins:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={aiIcon} alt="PredictPro" className="w-10 h-10" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              PredictPro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Predictions
            </Link>
            <Link to="/leaderboard" className="text-sm font-medium hover:text-primary transition-colors">
              Leaderboard
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="outline" size="sm" className="gap-2">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="hidden sm:inline font-semibold">{coins}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="hero" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
