import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { SEOInternalLinkMesh } from '@/components/SEOInternalLinkMesh';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-16 pb-20 md:pb-8">
      <div className="container mx-auto max-w-7xl px-4 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-2xs">
                <Activity className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                Predict<span className="text-primary">Pro</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Independent football statistics, live scores, Expected Goals (xG) telemetry, bivariate Poisson match models, and league standings across 40+ global competitions.
            </p>
            <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1">
              <p className="font-semibold text-foreground">Editorial &amp; Data Desk</p>
              <p>
                Email:{' '}
                <a href="mailto:vincentmwangangiz@gmail.com" className="text-primary hover:underline">
                  vincentmwangangiz@gmail.com
                </a>
              </p>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
            <div className="space-y-2.5">
              <h2 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Betting &amp; Tools
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/best-bets" className="hover:text-foreground transition-colors font-semibold text-emerald-600 dark:text-emerald-400">Today&apos;s Banker Picks</Link></li>
                <li><Link to="/today-predictions" className="hover:text-foreground transition-colors">Today&apos;s Match Predictions</Link></li>
                <li><Link to="/tomorrow-predictions" className="hover:text-foreground transition-colors">Tomorrow&apos;s Early Lines</Link></li>
                <li><Link to="/weekend-predictions" className="hover:text-foreground transition-colors">Weekend Global Slate</Link></li>
                <li><Link to="/cashout-calculator" className="hover:text-foreground transition-colors">Acca Cash-Out &amp; Hedge Calc</Link></li>
                <li><Link to="/arbitrage-finder" className="hover:text-foreground transition-colors">Arbitrage &amp; Surebet Matrix</Link></li>
                <li><Link to="/code-converter" className="hover:text-foreground transition-colors">Universal Code Converter</Link></li>
                <li><Link to="/tipsters" className="hover:text-foreground transition-colors">Verified Tipster Yield Hub</Link></li>
                <li><Link to="/player-props" className="hover:text-foreground transition-colors">Player Shots &amp; Cards Model</Link></li>
                <li><Link to="/community-slips" className="hover:text-foreground transition-colors">Community Copy-Bet Feed</Link></li>
                <li><Link to="/pick-em-challenge" className="hover:text-foreground transition-colors">Daily 5-Match Pick&apos;em</Link></li>
                <li><Link to="/alert-center" className="hover:text-foreground transition-colors">Telegram &amp; Push Alerts</Link></li>
                <li><Link to="/referrals" className="hover:text-foreground transition-colors">Invite &amp; Earn VIP Coins</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Competitions &amp; Markets
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/premier-league-predictions" className="hover:text-foreground transition-colors">Premier League (EPL)</Link></li>
                <li><Link to="/champions-league-predictions" className="hover:text-foreground transition-colors">UEFA Champions League</Link></li>
                <li><Link to="/la-liga-predictions" className="hover:text-foreground transition-colors">Spanish LaLiga</Link></li>
                <li><Link to="/serie-a-predictions" className="hover:text-foreground transition-colors">Italian Serie A</Link></li>
                <li><Link to="/bundesliga-predictions" className="hover:text-foreground transition-colors">German Bundesliga</Link></li>
                <li><Link to="/kpl-predictions" className="hover:text-foreground transition-colors">FKF Premier League</Link></li>
                <li><Link to="/btts" className="hover:text-foreground transition-colors">BTTS &amp; Over 2.5 Goals</Link></li>
                <li><Link to="/correct-score" className="hover:text-foreground transition-colors">Exact Correct Score 6×6</Link></li>
                <li><Link to="/jackpot-predictions" className="hover:text-foreground transition-colors">17-Game Mega Jackpot</Link></li>
                <li><Link to="/tournaments" className="hover:text-foreground transition-colors font-semibold text-primary">All 40+ Competitions →</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Pro Tools &amp; Bet Tracking
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/bet-tracker" className="hover:text-foreground transition-colors font-semibold text-primary">Personal Bet Tracker &amp; ROI</Link></li>
                <li><Link to="/in-play-edge" className="hover:text-foreground transition-colors">In-Play Late-Goal Radar</Link></li>
                <li><Link to="/social-card-studio" className="hover:text-foreground transition-colors">Social Slip Card Studio</Link></li>
                <li><Link to="/tournament-simulator" className="hover:text-foreground transition-colors">Tournament Group Simulator</Link></li>
                <li><Link to="/live-multiview" className="hover:text-foreground transition-colors">Live 4-Match Multi-View</Link></li>
                <li><Link to="/closing-line-value" className="hover:text-foreground transition-colors">CLV &amp; Steam Scanner</Link></li>
                <li><Link to="/sgp-builder" className="hover:text-foreground transition-colors">Correlated SGP Builder</Link></li>
                <li><Link to="/pitch-telemetry" className="hover:text-foreground transition-colors">2D Pitch Shot Map &amp; xT</Link></li>
                <li><Link to="/xpts-standings" className="hover:text-foreground transition-colors">xPTS Justice Standings</Link></li>
                <li><Link to="/rollover-challenge" className="hover:text-foreground transition-colors">Compound Rollover Ladder</Link></li>
                <li><Link to="/asian-handicap-calculator" className="hover:text-foreground transition-colors">Quarter-Ball Asian Matrix</Link></li>
                <li><Link to="/syndicate-pools" className="hover:text-foreground transition-colors">Jackpot Syndicate Pools</Link></li>
                <li><Link to="/corner-stats-scanner" className="hover:text-foreground transition-colors">Corner Tempo &amp; Poisson Scanner</Link></li>
                <li><Link to="/cash-out-calculator" className="hover:text-foreground transition-colors">Cash-Out Equity Auditor</Link></li>
                <li><Link to="/referee-stats-scanner" className="hover:text-foreground transition-colors">Referee Discipline &amp; Cards</Link></li>
                <li><Link to="/player-props-lab" className="hover:text-foreground transition-colors">Player SoT &amp; Goal Prop Lab</Link></li>
                <li><Link to="/trixie-yankee-calculator" className="hover:text-foreground transition-colors">System Bet Permutation Calc</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                Publisher &amp; Legal
              </h2>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About PredictPro</Link></li>
                <li><Link to="/methodology" className="hover:text-foreground transition-colors">Statistical Methodology</Link></li>
                <li><Link to="/track-record" className="hover:text-foreground transition-colors">Audited Track Record</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">20 Strategy Guides</Link></li>
                <li><Link to="/teams" className="hover:text-foreground transition-colors">24-Club xG &amp; FDR Hub</Link></li>
                <li><Link to="/players" className="hover:text-foreground transition-colors">Player 10.0 Ratings</Link></li>
                <li><Link to="/responsible-gaming" className="hover:text-foreground transition-colors">Responsible Gaming (18+)</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/sitemap" className="hover:text-foreground transition-colors font-semibold text-primary">HTML Sitemap &amp; SEO Directory</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Universal Contextual Internal Link Mesh & Complete 6-Cluster Page Directory */}
        <SEOInternalLinkMesh />

        {/* Publisher Compliance & Informational Disclaimer */}
        <div className="pt-6 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="leading-relaxed max-w-3xl">
            <strong className="text-foreground">Editorial Disclaimer:</strong> PredictPro (predictpro.guru) is an independent sports statistics, live score, and quantitative football analytics publication. We do not operate as a bookmaker, accept wagers, or facilitate gambling transactions. All statistical models and match previews are provided strictly for informational and analytical purposes (18+).
          </p>
          <p className="shrink-0 font-mono text-[11px]">
            © {new Date().getFullYear()} PredictPro Analytics. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
