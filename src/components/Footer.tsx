import { Link } from "react-router-dom";
import { Zap, Mail, SlidersHorizontal } from "lucide-react";

const LINKS = {
  Predictions: [
    { to: "/", label: "AI Football Predictions Hub" },
    { to: "/upcoming", label: "Upcoming Football Fixtures & Kickoffs" },
    { to: "/best-bets", label: "Today's Best Banker Football Bets" },
    { to: "/predict", label: "Interactive AI Match Outcome Predictor" },
    { to: "/btts", label: "Both Teams to Score (BTTS) Tips" },
    { to: "/value-bets", label: "Mathematical Value Bets (+EV Edge)" },
    { to: "/correct-score", label: "Exact Correct Score Poisson Models" },
    { to: "/accumulator", label: "Smart Football Accumulator Builder" },
    { to: "/archive", label: "Audited Historical Results Archive" },
    { to: "/methodology", label: "Expected Goals (xG) & AI Methodology" },
  ],
  "Leagues & Hubs": [
    { to: "/premier-league-predictions", label: "English Premier League AI Predictions" },
    { to: "/champions-league-predictions", label: "UEFA Champions League Match Tips" },
    { to: "/la-liga-predictions", label: "Spanish La Liga Betting Forecasts" },
    { to: "/bundesliga-predictions", label: "German Bundesliga xG Analysis" },
    { to: "/serie-a-predictions", label: "Italian Serie A Tactical Predictions" },
    { to: "/kpl-predictions", label: "Kenya Premier League (FKF) Tips" },
    { to: "/jackpot-predictions", label: "17-Game Mega Jackpot Banker Picks" },
    { to: "/us-soccer-predictions", label: "MLS & US Soccer Moneyline Picks" },
    { to: "/world-cup-predictions", label: "2026 FIFA World Cup Qualifiers & Tips" },
    { to: "/afcon-predictions", label: "AFCON & African Football Predictions" },
  ],
  Tools: [
    { to: "/live", label: "Live Football Scores & In-Play Odds" },
    { to: "/streaks", label: "Team Winning Streaks & Trends Radar" },
    { to: "/h2h", label: "Head-to-Head (H2H) Matchup Simulator" },
    { to: "/dropping-odds", label: "Dropping Odds & Sharp Money Radar" },
    { to: "/screener", label: "Quantitative Football Match Screener" },
    { to: "/recommendations", label: "Personalized AI Bet Recommendations" },
    { to: "/track-record", label: "Verified Closing Line Value Track Record" },
    { to: "/standings", label: "Live League Tables & Form Standings" },
    { to: "/bankroll", label: "Kelly Criterion Bankroll Manager" },
    { to: "/statistics", label: "Team & League Statistical Analytics" },
    { to: "/players", label: "Football Player xG & Form Search" },
    { to: "/news", label: "Breaking Football News & Injury Intel" },
    { to: "/insights", label: "Deep Tactical Matchday Insights" },
    { to: "/highlights", label: "Official Match Video Highlights" },
  ],
  "Strategy & Guides": [
    { to: "/blog", label: "Football Betting Strategy Blog Hub" },
    { to: "/blog/how-to-read-football-predictions", label: "How to Read AI Implied Probabilities" },
    { to: "/blog/value-betting-explained", label: "Expected Value (+EV) Betting Guide" },
    { to: "/blog/bankroll-management-football", label: "Kelly Staking & Bankroll Math" },
    { to: "/blog/premier-league-prediction-guide-2026", label: "2026/27 Premier League Betting Guide" },
    { to: "/blog/champions-league-group-stage-tips", label: "Champions League Knockout Strategy" },
    { to: "/blog/btts-over-under-strategy", label: "BTTS & Over 2.5 Goals Strategy" },
    { to: "/blog/accumulator-building-strategy", label: "5-Fold Smart Accumulator Formula" },
    { to: "/blog/correct-score-prediction-tips", label: "Poisson Distribution Correct Score Guide" },
    { to: "/blog/sportpesa-mega-jackpot-prediction-17-games", label: "17-Game Mega Jackpot Strategy" },
    { to: "/blog/us-soccer-betting-guide-mls-odds", label: "MLS & US Soccer Betting Guide" },
    { to: "/blog/kpl-betting-guide-kenya", label: "FKF Kenya Premier League Betting Guide" },
  ],
  Platform: [
    { to: "/dashboard", label: "Personalized Betting Dashboard" },
    { to: "/shop", label: "Upgrade to PredictPro VIP" },
    { to: "/rewards", label: "Daily Rewards & Prediction Coins" },
    { to: "/tipsters", label: "Verified Football Tipster Directory" },
    { to: "/leaderboard", label: "Global ROI Tipster Leaderboard" },
    { to: "/tournaments", label: "International Football Tournaments" },
    { to: "/sports", label: "Multi-Sport AI Predictions" },
    { to: "/about", label: "About PredictPro AI Intelligence" },
    { to: "/sitemap", label: "Complete HTML Sitemap Directory" },
    { to: "/seo-indexing", label: "Search Engine Indexing Monitor" },
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
            Browse All Upcoming Football Fixtures &amp; AI Match Previews &rarr;
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          {FEATURED_MATCHES.map(m => (
            <Link
              key={m.slug}
              to={`/predict/${m.slug}-${today}`}
              className="text-muted-foreground hover:text-primary transition-colors hover:underline"
            >
              {m.label} AI Match Prediction &amp; Odds
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
