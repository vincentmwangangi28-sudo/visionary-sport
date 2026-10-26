import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import { FooterFAQ } from "@/components/FooterFAQ";

const LINKS: Record<string, Array<{ to: string; label: string }>> = {
  Matches: [
    { to: "/", label: "Today's Fixtures & Previews" },
    { to: "/live", label: "Live Scores & In-Play Stats" },
    { to: "/live-multiview", label: "4-Match Multi-View TV" },
    { to: "/pitch-telemetry", label: "2D Pitch Shot Map & XIs" },
    { to: "/xpts-standings", label: "xPTS Justice Standings" },
    { to: "/bracket-simulator", label: "Knockout Bracket Simulator" },
    { to: "/tomorrow-predictions", label: "Tomorrow's Fixtures" },
    { to: "/weekend-predictions", label: "Weekend Match Schedule" },
    { to: "/archive", label: "Results Archive" },
    { to: "/standings", label: "League Tables & Form" },
    { to: "/players", label: "Player Ratings & Stats" },
    { to: "/teams", label: "Club Profiles & xG" },
    { to: "/h2h", label: "Head-to-Head Records" },
    { to: "/news", label: "Team News & Lineups" },
  ],
  Competitions: [
    { to: "/premier-league-predictions", label: "Premier League" },
    { to: "/champions-league-predictions", label: "UEFA Champions League" },
    { to: "/europa-league-predictions", label: "UEFA Europa League" },
    { to: "/la-liga-predictions", label: "LaLiga" },
    { to: "/serie-a-predictions", label: "Serie A" },
    { to: "/bundesliga-predictions", label: "Bundesliga" },
    { to: "/ligue-1-predictions", label: "Ligue 1" },
    { to: "/eredivisie-predictions", label: "Eredivisie" },
    { to: "/kpl-predictions", label: "FKF Premier League" },
    { to: "/mls-predictions", label: "Major League Soccer" },
    { to: "/brazilian-serie-a-predictions", label: "Brasileirão Série A" },
    { to: "/saudi-pro-league-predictions", label: "Saudi Pro League" },
  ],
  Markets: [
    { to: "/sure-win-predictions", label: "High Probability Picks" },
    { to: "/over-under-predictions", label: "Over / Under 2.5 Goals" },
    { to: "/btts", label: "Both Teams to Score" },
    { to: "/correct-score", label: "Correct Score" },
    { to: "/draw-no-bet-predictions", label: "Draw No Bet" },
    { to: "/asian-handicap-predictions", label: "Asian Handicap" },
    { to: "/corners-predictions", label: "Corners Statistics" },
    { to: "/cards-predictions", label: "Cards & Bookings" },
    { to: "/jackpot-predictions", label: "Weekend Jackpot" },
    { to: "/accumulator", label: "Accumulator Builder" },
  ],
  "Tools & Calculators": [
    { to: "/in-play-edge", label: "In-Play Live Edge & 75'+ Radar" },
    { to: "/social-card-studio", label: "9:16 Story & Social Studio" },
    { to: "/tournament-simulator", label: "Group & Tournament Simulator" },
    { to: "/bet-tracker", label: "Auto-Settled ROI Bet Tracker" },
    { to: "/closing-line-value", label: "Closing Line Value (CLV) Scanner" },
    { to: "/sgp-builder", label: "Correlated SGP Copula Builder" },
    { to: "/slip-generator", label: "AI Slip & Code Converter" },
    { to: "/booking-codes", label: "Daily Booking Codes" },
    { to: "/code-converter", label: "Universal Code Converter" },
    { to: "/poisson-calculator", label: "Poisson 6x6 Score Matrix" },
    { to: "/screener", label: "Match Screener" },
    { to: "/dropping-odds", label: "Odds Movement" },
    { to: "/streaks", label: "Form & Streaks" },
    { to: "/value-bet-calculator", label: "Value Calculator" },
    { to: "/kelly-criterion-calculator", label: "Staking Calculator" },
    { to: "/dutching-calculator", label: "Dutching Calculator" },
    { to: "/track-record", label: "Historical Performance" },
  ],
  Guides: [
    { to: "/blog", label: "Editorial Articles" },
    { to: "/blog/bivariate-poisson-dixon-coles-score-matrix-guide", label: "Poisson & Dixon-Coles Guide" },
    { to: "/blog/universal-bet-code-converter-sportybet-1xbet-bet9ja", label: "Bet Code Converter Guide" },
    { to: "/blog/2-score-correct-score-dutching-strategy", label: "2-Score Dutching Strategy" },
    { to: "/blog/referee-cards-corners-prop-modeling", label: "Cards & Corners Modeling" },
    { to: "/blog/expected-goals-xg-betting-model-explained", label: "Understanding Expected Goals (xG)" },
    { to: "/methodology", label: "Statistical Methodology" },
    { to: "/about", label: "About PredictPro" },
    { to: "/contact", label: "Contact Support" },
    { to: "/sitemap", label: "Sitemap & Feeds" },
  ],
};

const FEATURED_MATCHES = [
  { slug: 'arsenal-vs-chelsea', label: 'Arsenal vs Chelsea' },
  { slug: 'liverpool-vs-manchester-city', label: 'Liverpool vs Man City' },
  { slug: 'real-madrid-vs-barcelona', label: 'Real Madrid vs Barcelona' },
  { slug: 'bayern-munich-vs-borussia-dortmund', label: 'Bayern vs Dortmund' },
  { slug: 'inter-milan-vs-ac-milan', label: 'Inter vs AC Milan' },
  { slug: 'celtic-vs-rangers', label: 'Celtic vs Rangers' },
  { slug: 'boca-juniors-vs-river-plate', label: 'Boca Juniors vs River Plate' },
  { slug: 'al-ahly-vs-zamalek', label: 'Al Ahly vs Zamalek' },
  { slug: 'kaizer-chiefs-vs-orlando-pirates', label: 'Kaizer Chiefs vs Pirates' },
  { slug: 'gor-mahia-vs-afc-leopards', label: 'Gor Mahia vs AFC Leopards' },
  { slug: 'al-hilal-vs-al-nassr', label: 'Al-Hilal vs Al-Nassr' },
  { slug: 'flamengo-vs-palmeiras', label: 'Flamengo vs Palmeiras' },
];

const FEATURED_CLUB_HUBS = [
  { slug: 'arsenal', label: 'Arsenal xG & FDR' },
  { slug: 'manchester-city', label: 'Man City xG & FDR' },
  { slug: 'liverpool', label: 'Liverpool xG & FDR' },
  { slug: 'real-madrid', label: 'Real Madrid xG & FDR' },
  { slug: 'barcelona', label: 'Barcelona xG & FDR' },
  { slug: 'bayern-munich', label: 'Bayern Munich xG & FDR' },
  { slug: 'inter-milan', label: 'Inter Milan xG & FDR' },
  { slug: 'psg', label: 'PSG xG & FDR' },
  { slug: 'al-ahly', label: 'Al Ahly xG & FDR' },
  { slug: 'mamelodi-sundowns', label: 'Sundowns xG & FDR' },
  { slug: 'gor-mahia', label: 'Gor Mahia xG & FDR' },
];

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border pb-20 md:pb-0">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <Link to="/" className="inline-block mb-2.5">
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                PredictPro
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Football fixtures, live scores, expected goals (xG) statistics, and match previews across 40+ global leagues.
            </p>
            <div className="flex flex-col gap-1">
              <a
                href="mailto:vincentmwangangiz@gmail.com"
                aria-label="Contact PredictPro Support via Email"
                className="inline-flex items-center gap-1.5 min-h-[24px] py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors break-all"
              >
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>vincentmwangangiz@gmail.com</span>
              </a>
              <a
                href="tel:+254721418238"
                aria-label="Call PredictPro Support Desk"
                className="inline-flex items-center gap-1.5 min-h-[24px] py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>+254721418238</span>
              </a>
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(LINKS).map(([group, links]) => (
            <nav key={group} aria-label={group} className="flex flex-col gap-1">
              <p className="font-semibold text-xs text-foreground mb-1.5">{group}</p>
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="inline-flex items-center min-h-[24px] py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <FooterFAQ />

        {/* Featured Match Links & Club xG Hubs */}
        <div className="border-t border-border pt-5 pb-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="font-semibold text-xs text-foreground">
                Featured Match Previews &amp; Global Derbies
              </p>
              <Link
                to="/upcoming"
                className="inline-flex items-center min-h-[24px] py-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                All Upcoming Fixtures →
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              {FEATURED_MATCHES.map((m) => (
                <Link
                  key={m.slug}
                  to={`/predict/${m.slug}`}
                  className="inline-flex items-center min-h-[24px] py-0.5 text-muted-foreground hover:text-foreground transition-colors hover:underline"
                >
                  {m.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <p className="font-semibold text-xs text-foreground">
                Club Expected Goals (xG) &amp; Fixture Difficulty (FDR) Hubs
              </p>
              <Link
                to="/teams"
                className="inline-flex items-center min-h-[24px] py-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                All 24 Club Analytics Hubs →
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              {FEATURED_CLUB_HUBS.map((c) => (
                <Link
                  key={c.slug}
                  to={`/teams/${c.slug}`}
                  className="inline-flex items-center min-h-[24px] py-0.5 text-muted-foreground hover:text-foreground transition-colors hover:underline"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* AdSense & Publisher Policy Compliance Disclosure */}
        <div className="border-t border-border pt-5 pb-5">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-[11px] text-muted-foreground leading-relaxed space-y-1">
            <p className="font-bold text-foreground">
              Independent Sports Statistics &amp; Editorial Publishing Disclosure (18+)
            </p>
            <p>
              <strong>PredictPro (predictpro.guru)</strong> is an independent quantitative football statistics, Expected Goals (xG) telemetry, and mathematical match modeling publication. PredictPro is <strong>not</strong> a bookmaker, sportsbook, or gambling operator, and does not accept or facilitate real-money wagers of any kind. All statistical probabilities, Bivariate Poisson scoreline distributions, and tactical match previews are published strictly for informational, journalistic, and analytical purposes. Please consult our{' '}
              <Link to="/methodology" className="text-primary underline hover:text-primary/80 font-medium">
                Statistical Methodology
              </Link>
              ,{' '}
              <Link to="/about" className="text-primary underline hover:text-primary/80 font-medium">
                Editorial Team &amp; About Us
              </Link>
              , and{' '}
              <Link to="/responsible-gaming" className="text-primary underline hover:text-primary/80 font-medium">
                18+ Responsible Gaming Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PredictPro Sports Analytics · predictpro.guru · Informational Only (18+)</p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link to="/about" className="inline-flex items-center min-h-[24px] py-1 hover:text-foreground transition-colors">
              About Us
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/contact" className="inline-flex items-center min-h-[24px] py-1 hover:text-foreground transition-colors">
              Contact
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/privacy" className="inline-flex items-center min-h-[24px] py-1 hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="inline-flex items-center min-h-[24px] py-1 hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/cookies" className="inline-flex items-center min-h-[24px] py-1 hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/responsible-gaming" className="inline-flex items-center min-h-[24px] py-1 hover:text-foreground transition-colors">
              Responsible Gaming
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
