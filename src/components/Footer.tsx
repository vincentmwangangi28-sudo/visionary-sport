import { Link } from "react-router-dom";
import { Sparkles, Trophy, BarChart3, Newspaper, Shield, FileText, Heart } from "lucide-react";
import { FooterAd } from "./AdBanner";

export const Footer = () => {
  return (
    <footer className="relative bg-card/50 border-t border-border/60">
      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 pt-8">
        <FooterAd />
      </div>

      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center shadow-glow">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">PredictPro</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered sports predictions helping you make smarter betting decisions with 85%+ accuracy.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-foreground/70 hover:text-primary transition-colors flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" /> Predictions
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-foreground/70 hover:text-primary transition-colors flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5" /> Leaderboard
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-foreground/70 hover:text-primary transition-colors flex items-center gap-1.5">
                  <Newspaper className="h-3.5 w-3.5" /> News
                </Link>
              </li>
              <li>
                <Link to="/insights" className="text-foreground/70 hover:text-primary transition-colors">
                  Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-foreground/70 hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/performance" className="text-foreground/70 hover:text-primary transition-colors">Performance</Link></li>
              <li><Link to="/shop" className="text-foreground/70 hover:text-primary transition-colors">Shop</Link></li>
              <li><Link to="/rewards" className="text-foreground/70 hover:text-primary transition-colors">Rewards</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/responsible-gaming" className="text-foreground/70 hover:text-primary transition-colors flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Responsible Gaming
                </Link>
              </li>
              <li><Link to="/privacy-policy" className="text-foreground/70 hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-foreground/70 hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PredictPro. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-accent fill-accent" /> — Bet responsibly. 18+
          </p>
        </div>
      </div>
    </footer>
  );
};
