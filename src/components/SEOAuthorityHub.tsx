import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

const EDITORIAL_GUIDES = [
  {
    to: '/sure-win-predictions',
    title: 'Today Sure Win & Banker Predictions (80%+)',
    desc: 'High-probability fixtures featuring strong home/away form, Expected Goals (xG) advantage, and SportyBet/Betika booking codes.',
  },
  {
    to: '/jackpot-predictions',
    title: '17-Game Mega & Midweek Jackpot Analysis',
    desc: 'Mathematical Poisson combinations, double-chance safety hedges, and fixture-by-fixture breakdowns for major jackpots.',
  },
  {
    to: '/over-under-predictions',
    title: 'Over 2.5 & Over 1.5 Goals xG Trends',
    desc: 'Goal totals modeled from shot creation volume, penalty-box entries, and defensive concession rates across 40+ leagues.',
  },
  {
    to: '/btts',
    title: 'Both Teams to Score (BTTS / GG) Form',
    desc: 'Clubs with high scoring consistency and open transition profiles across European, African, and Americas competitions.',
  },
];

const QUICK_SEARCH_CLUSTERS = [
  { label: 'Today Football Predictions', to: '/today-predictions' },
  { label: 'Tomorrow Fixtures & Tips', to: '/tomorrow-predictions' },
  { label: 'Weekend Accumulator Tips', to: '/weekend-predictions' },
  { label: 'Daily 2.00+ Rollover Odds', to: '/daily-2-odds' },
  { label: '5.00+ Odds Smart Acca', to: '/5-odds-predictions' },
  { label: 'Exact Correct Score Tips', to: '/correct-score' },
  { label: 'Draw No Bet (DNB)', to: '/draw-no-bet-predictions' },
  { label: 'Double Chance (1X / X2)', to: '/double-chance-predictions' },
  { label: 'Halftime / Fulltime (HT/FT)', to: '/ht-ft-predictions' },
  { label: 'Premier League Hub', to: '/premier-league-predictions' },
  { label: 'UEFA Champions League', to: '/champions-league-predictions' },
  { label: 'LaLiga Match Previews', to: '/la-liga-predictions' },
  { label: 'Serie A Tactical xG', to: '/serie-a-predictions' },
  { label: 'Bundesliga Goals Hub', to: '/bundesliga-predictions' },
  { label: 'FKF Premier League (Kenya)', to: '/kpl-predictions' },
  { label: 'Tanzania NBC League', to: '/tanzania-premier-league-predictions' },
  { label: 'Nigeria NPFL Hub', to: '/nigerian-npfl-predictions' },
  { label: 'South Africa PSL', to: '/south-africa-psl-predictions' },
  { label: 'Ghana Premier League', to: '/ghana-premier-league-predictions' },
  { label: 'Morocco Botola Pro', to: '/morocco-botola-pro-predictions' },
  { label: 'CAF Champions League', to: '/caf-champions-league-predictions' },
  { label: 'Uganda Premier League', to: '/uganda-premier-league-predictions' },
  { label: 'Korea K League 1', to: '/k-league-predictions' },
  { label: 'Player Prop Simulator', to: '/player-props' },
  { label: 'Player Ratings & Radar', to: '/players' },
  { label: 'Booking Code Converter', to: '/booking-code-converter' },
  { label: '17-Game Jackpot Generator', to: '/jackpot-generator' },
  { label: 'Live In-Play Goal Radar', to: '/in-play-predictions' },
  { label: 'Penalty & Set-Piece Takers', to: '/set-piece-specialists' },
  { label: 'Sharp Money & RLM Splits', to: '/sharp-money-splits' },
  { label: 'Lineup & Injury xG Impact', to: '/injury-lineup-impact' },
  { label: 'Altitude & Weather xG Hub', to: '/stadium-altitude-weather' },
  { label: 'Tactical Mismatch Matrix', to: '/tactical-mismatch-matrix' },
  { label: 'Referee Card & VAR Stats', to: '/referee-stats-predictions' },
  { label: 'Club xG & FDR Hub', to: '/teams' },
  { label: 'Dropping Odds Radar', to: '/dropping-odds' },
];

export const SEOAuthorityHub: React.FC = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <section
      aria-label="Competition Guides and Methodology"
      className="border-t border-border bg-card mt-8"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Football Statistical Guides, Booking Codes &amp; Competition Directory
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Expected goals (xG) methodology, league form tables, jackpot combinations, and fixture breakdowns across 40+ competitions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 min-h-[28px] py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>{expanded ? 'Hide Directory' : 'Read More'}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-5 pt-5 border-t border-border space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {EDITORIAL_GUIDES.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="p-3.5 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors block space-y-1"
                >
                  <h3 className="text-xs font-semibold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </Link>
              ))}
            </div>

            <nav aria-label="Popular Football Prediction Markets and Competitions" className="pt-3 border-t border-border/60">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SEARCH_CLUSTERS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted/50 hover:text-primary text-xs font-medium text-muted-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </div>
    </section>
  );
};

