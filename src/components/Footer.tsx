import { Link } from "react-router-dom";
import { Zap, Globe, Twitter, Youtube, Mail, SlidersHorizontal } from "lucide-react";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useGeoRegion } from "@/hooks/useGeoRegion";
import { useCurrency } from "@/hooks/useCurrency";

const LINKS = {
  Predictions: [
    { to: "/", label: "Today's Predictions" },
    { to: "/archive", label: "Results Archive (Ledger)" },
    { to: "/methodology", label: "Mathematical Methodology" },
    { to: "/best-bets", label: "Best Bets" },
    { to: "/predict", label: "Match Predictor" },
    { to: "/correct-score", label: "Correct Score" },
    { to: "/btts", label: "BTTS / Over-Under" },
    { to: "/value-bets", label: "Value Bets" },
    { to: "/blog", label: "Betting Strategy Blog" },
  ],
  Tools: [
    { to: "/preferences", label: "Strategy & Risk Feeds" },
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
    { to: "/sitemap", label: "Sitemap & Index" },
  ],
};

export const Footer = () => {
  const { preferences } = useUserPreferences();
  const { region } = useGeoRegion();
  const { currencyConfig, responsibleGambling } = useCurrency();

  return (
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
            <a 
              href="https://twitter.com/PredictProAI" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Follow PredictPro on Twitter / X"
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
              <Twitter className="h-4 w-4" aria-hidden="true" />
            </a>
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/80 hover:bg-primary/10 hover:text-primary transition-colors text-[11px] font-medium border border-border/70"
            title="Configure Language, Region, Currency and Timezone"
          >
            <span>{region.flag} {region.name}</span>
            <span>·</span>
            <span>{currencyConfig.code} ({currencyConfig.symbol})</span>
            <span>·</span>
            <span>{preferences.timezone === 'auto' ? 'Local Time' : preferences.timezone.split('/')[1]?.replace('_', ' ') || preferences.timezone}</span>
            <SlidersHorizontal className="h-3 w-3 ml-0.5 opacity-60" />
          </Link>
        </div>

        <p className="text-center md:text-right text-[11px]">
          {responsibleGambling?.helpline ? `${responsibleGambling.helpline} · ` : ''}18+ only · Gamble responsibly
        </p>
      </div>
    </div>
  </footer>
  );
};
