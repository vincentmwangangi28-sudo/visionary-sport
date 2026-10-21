import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

const EDITORIAL_GUIDES = [
  {
    to: '/sure-win-predictions',
    title: 'High-Probability Match Previews',
    desc: 'Fixtures featuring strong home or away form, expected goals advantage, and consistent head-to-head records.',
  },
  {
    to: '/over-under-predictions',
    title: 'Goals & Expected Goals (xG) Trends',
    desc: 'Over/Under 2.5 goals analysis based on shot creation volume, box entries, and defensive concession rates.',
  },
  {
    to: '/btts',
    title: 'Both Teams to Score (BTTS) Form',
    desc: 'Clubs with high scoring consistency and open transition profiles across domestic and European leagues.',
  },
  {
    to: '/standings',
    title: 'League Tables & Form Guide',
    desc: 'Updated league standings, goal difference, points per game, and recent five-match form trajectories.',
  },
];

export const SEOAuthorityHub: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      aria-label="Competition Guides and Methodology"
      className="border-t border-border bg-card mt-8"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Football Statistical Guides &amp; Competition Directory
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Expected goals (xG) methodology, league form tables, and fixture breakdowns across 40+ competitions.
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
          <div className="mt-5 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
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
        )}
      </div>
    </section>
  );
};
