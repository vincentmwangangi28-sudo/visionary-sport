import { Button } from "@/components/ui/button";
import { Coins, LogIn, Menu, Trophy } from "lucide-react";
import aiIcon from "@/assets/ai-prediction-icon.png";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src={aiIcon} alt="PredictPro" className="w-10 h-10" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              PredictPro
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#predictions" className="text-sm font-medium hover:text-primary transition-colors">
              Predictions
            </a>
            <a href="#leaderboard" className="text-sm font-medium hover:text-primary transition-colors">
              Leaderboard
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <Coins className="w-4 h-4" />
              <span>0 Coins</span>
            </Button>
            <Button variant="outline" size="sm">
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
            <Button variant="premium" size="sm" className="hidden sm:flex">
              <Trophy className="w-4 h-4" />
              Go Premium
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
