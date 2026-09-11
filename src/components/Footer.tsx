import { Link } from "react-router-dom";
import { Zap, Mail, SlidersHorizontal } from "lucide-react";

const LINKS = {
  Predictions: [
    { to: "/", label: "Today's Predictions" },
    { to: "/best-bets", label: "Best Banker Bets" },
    { to: "/predict", label: "Match Predictor" },
    { to: "/btts", label: "BTTS (Both Teams Score)" },
    { to: "/value-bets", label: "Value Bets" },
    { to: "/correct-score", label: "Correct Score" },
    { to: "/accumulator", label: "Acca Builder" },
    { to: "/archive", label: "Results Archive" },
    { to: "/methodology", label: "Mathematical Methodology" },
  ],
  "Leagues & Hubs": [
    { to: "/premier-league-predictions", label: "Premier League Tips" },
    { to: "/champions-league-predictions", label: "Champions League" },
    { to: "/la-liga-predictions", label: "La Liga Predictions" },
    { to: "/bundesliga-predictions", label: "Bundesliga Analysis" },
    { to: "/serie-a-predictions", label: "Serie A Predictions" },
    { to: "/kpl-predictions", label: "Kenya Premier League" },
    { to: "/jackpot-predictions", label: "Mega Jackpot Picks (SportPesa/Betika)" },
    { to: "/us-soccer-predictions", label: "US Soccer & MLS Moneyline" },
    { to: "/world-cup-predictions", label: "FIFA World Cup" },
    { to: "/afcon-predictions", label: "AFCON Predictions" },
  ],
  Tools: [
    { to: "/live", label: "Live Scores & Odds" },
    { to: "/dropping-odds", label: "Dropping Odds Radar" },
    { to: "/screener", label: "Match Screener" },
    { to: "/recommendations", label: "AI Recommended" },
    { to: "/track-record", label: "Verified Track Record" },
    { to: "/standings", label: "League Standings" },
    { to: "/bankroll", label: "Bankroll Manager" },
    { to: "/statistics", label: "H2H Statistics" },
  ],
  Insights: [
    { to: "/blog", label: "Betting Strategy Blog" },
    { to: "/news", label: "Football News" },
    { to: "/insights", label: "Match Insights" },
    { to: "/highlights", label: "Video Highlights" },
    { to: "/tournaments", label: "Global Tournaments" },
    { to: "/sports", label: "Multi-Sports" },
    { to: "/leaderboard", label: "Tipster Leaderboard" },
  ],
  Platform: [
    { to: "/shop", label: "Upgrade to Pro" },
    { to: "/rewards", label: "Rewards & Coins" },
    { to: "/about", label: "About PredictPro" },
    { to: "/sitemap", label: "HTML Sitemap" },
    { to: "/seo-indexing", label: "Google Indexing Console" },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-muted/20 border-t border-border mt-16 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 mb-10">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-3 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm">PP</div>
            <span className="font-bold text-lg">PredictPro</span>
          </Link>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
            AI-powered football predictions covering 40+ leagues worldwide. Powered by Google Gemini AI.
          </p>
          <div className="flex gap-2">
            <a 
              href="mailto:support@predictpro.guru"
              aria-label="Contact PredictPro Support via Email"
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Mail className="h-4 w-4" aria-hidden="true" />
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
        
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Link
            to="/preferences"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 hover:bg-primary/10 hover:text-primary transition-colors text-[11px] font-medium border border-border/70"
            title="Configure Language, Region, Currency and Timezone"
          >
            <SlidersHorizontal className="h-3 w-3 opacity-70" />
            <span>Preferences & Regional Settings</span>
          </Link>
        </div>

        <p className="text-center md:text-right text-[11px]">
          18+ only · Gamble responsibly
        </p>
      </div>
    </div>
  </footer>
  );
};
