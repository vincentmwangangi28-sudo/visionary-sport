import { Link } from "react-router-dom";
import { Zap, Globe, Twitter, Youtube, Mail } from "lucide-react";

const LINKS = {
  Predictions: [
    { to: "/", label: "Today's Predictions" },
    { to: "/best-bets", label: "Best Bets" },
    { to: "/predict", label: "Match Predictor" },
    { to: "/correct-score", label: "Correct Score" },
    { to: "/btts", label: "BTTS / Over-Under" },
    { to: "/value-bets", label: "Value Bets" },
  ],
  Tools: [
    { to: "/accumulator", label: "Acca Builder" },
    { to: "/bankroll", label: "Bankroll Manager" },
    { to: "/statistics", label: "Statistics" },
    { to: "/standings", label: "Standings" },
    { to: "/players", label: "Player Search" },
    { to: "/highlights", label: "Highlights" },
  ],
  Community: [
    { to: "/tipsters", label: "Community Tips" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/live", label: "Live Scores" },
    { to: "/news", label: "Football News" },
    { to: "/sports", label: "More Sports" },
    { to: "/insights", label: "Insights" },
  ],
  Account: [
    { to: "/shop", label: "Upgrade to Pro" },
    { to: "/rewards", label: "Rewards" },
    { to: "/performance", label: "My Performance" },
    { to: "/auth", label: "Sign In / Register" },
    { to: "/about", label: "About PredictPro" },
  ],
};

export const Footer = () => (
  <footer className="bg-muted/20 border-t border-border mt-16 pb-20 md:pb-0">
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">PP</div>
            <span className="font-bold text-lg">PredictPro</span>
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            AI-powered football predictions covering 40+ leagues worldwide. Powered by Google Gemini AI.
          </p>
          <div className="flex gap-2">
            <a href="https://twitter.com/PredictProAI" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="mailto:support@predictpro.guru"
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Link groups */}
        {Object.entries(LINKS).map(([group, links]) => (
          <div key={group}>
            <p className="font-semibold text-sm mb-3">{group}</p>
            <ul className="space-y-2">
              {links.map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} PredictPro. All rights reserved. <span className="mx-1">·</span> predictpro.guru</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Available worldwide</span>
          <span>|</span>
          <span>⚽ 40+ leagues</span>
          <span>|</span>
          <span>🤖 AI-powered</span>
        </div>
        <p className="text-center md:text-right">Gamble responsibly · 18+ only · For entertainment purposes</p>
      </div>
    </div>
  </footer>
);
