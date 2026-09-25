import { Link } from "react-router-dom";
import { Zap, Mail, SlidersHorizontal } from "lucide-react";

const LINKS = {
  Predictions: [
    { to: "/", label: "Today's Predictions" },
    { to: "/upcoming", label: "Upcoming Fixtures" },
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
    { to: "/streaks", label: "Streaks & Trends Radar" },
    { to: "/h2h", label: "H2H Matchup Simulator" },
    { to: "/dropping-odds", label: "Dropping Odds Radar" },
    { to: "/screener", label: "Match Screener" },
    { to: "/recommendations", label: "AI Recommended" },
    { to: "/track-record", label: "Verified Track Record" },
    { to: "/standings", label: "League Standings" },
    { to: "/bankroll", label: "Bankroll Manager" },
    { to: "/statistics", label: "H2H Statistics" },
    { to: "/players", label: "Player Search" },
    { to: "/news", label: "Football News & Intel" },
    { to: "/insights", label: "Tactical Match Insights" },
    { to: "/highlights", label: "Video Highlights & Clips" },
  ],
  "Strategy & Guides": [
    { to: "/blog", label: "Strategy Blog Hub" },
    { to: "/blog/how-to-read-football-predictions", label: "How to Read AI Odds" },
    { to: "/blog/value-betting-explained", label: "Value Betting (+EV) Guide" },
    { to: "/blog/bankroll-management-football", label: "Bankroll Staking Math" },
    { to: "/blog/premier-league-prediction-guide-2026", label: "Premier League Guide" },
    { to: "/blog/champions-league-group-stage-tips", label: "Champions League Tips" },
    { to: "/blog/btts-over-under-strategy", label: "BTTS & Goal Markets" },
    { to: "/blog/accumulator-building-strategy", label: "Accumulator 5-Fold Formula" },
    { to: "/blog/correct-score-prediction-tips", label: "Correct Score Prediction" },
    { to: "/blog/sportpesa-mega-jackpot-prediction-17-games", label: "17-Game Jackpot Tips" },
    { to: "/blog/us-soccer-betting-guide-mls-odds", label: "US Soccer & MLS Guide" },
    { to: "/blog/kpl-betting-guide-kenya", label: "KPL Kenya Betting Guide" },
  ],
  Platform: [
    { to: "/dashboard", label: "My Dashboard" },
    { to: "/shop", label: "Upgrade to Pro" },
    { to: "/rewards", label: "Rewards & Free Coins" },
    { to: "/tipsters", label: "Verified Tipsters" },
    { to: "/leaderboard", label: "Tipster Leaderboard" },
    { to: "/tournaments", label: "Global Tournaments" },
    { to: "/sports", label: "Multi-Sports" },
    { to: "/about", label: "About PredictPro" },
    { to: "/sitemap", label: "HTML Sitemap" },
    { to: "/seo-indexing", label: "Google Indexing Console" },
  ],
};

const FEATURED_MATCHES = [
  { slug: 'arsenal-vs-chelsea', label: 'Arsenal vs Chelsea' },
  { slug: 'liverpool-vs-manchester-city', label: 'Liverpool vs Man City' },
  { slug: 'real-madrid-vs-barcelona', label: 'Real Madrid vs Barcelona' },
  { slug: 'bayern-munich-vs-borussia-dortmund', label: 'Bayern vs Dortmund' },
  { slug: 'inter-milan-vs-ac-milan', label: 'Inter vs AC Milan' },
  { slug: 'manchester-united-vs-tottenham', label: 'Man United vs Tottenham' },
  { slug: 'psg-vs-marseille', label: 'PSG vs Marseille' },
  { slug: 'gor-mahia-vs-afc-leopards', label: 'Gor Mahia vs AFC Leopards' },
  { slug: 'juventus-vs-napoli', label: 'Juventus vs Napoli' },
  { slug: 'atletico-madrid-vs-sevilla', label: 'Atletico vs Sevilla' },
  { slug: 'la-galaxy-vs-lafc', label: 'LA Galaxy vs LAFC' },
  { slug: 'inter-miami-vs-new-york-red-bulls', label: 'Inter Miami vs NY Red Bulls' },
];

export const Footer = () => {
  const today = new Date().toISOString().split('T')[0];

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
              className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
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

      {/* Featured Match Deep Links for Crawlers and Users */}
      <div className="border-t border-border/60 pt-6 pb-6 mb-2">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="font-semibold text-xs text-foreground uppercase tracking-wider">
            Top Clash Intelligence & Head-to-Head Previews Today
          </p>
          <Link to="/upcoming" className="text-xs text-primary font-semibold hover:underline">
            View All Fixtures &rarr;
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {FEATURED_MATCHES.map(m => (
            <Link
              key={m.slug}
              to={`/predict/${m.slug}-${today}`}
              className="text-muted-foreground hover:text-primary transition-colors hover:underline"
            >
              {m.label} Prediction
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
        <p>© {new Date().getFullYear()} PredictPro. All rights reserved. <span className="mx-1">·</span> predictpro.guru</p>
        
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Link
            to="/preferences"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background hover:bg-primary/10 text-zinc-900 dark:text-zinc-100 hover:text-primary transition-colors text-xs font-semibold border border-border shadow-xs"
            title="Configure Language, Region, Currency and Timezone"
            aria-label="Open Preferences and Regional Settings"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Preferences & Regional Settings</span>
          </Link>
        </div>

        <p className="text-center md:text-right text-xs text-zinc-700 dark:text-zinc-300 font-medium">
          18+ only · Gamble responsibly
        </p>
      </div>
    </div>
  </footer>
  );
};
