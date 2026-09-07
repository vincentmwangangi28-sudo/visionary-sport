import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * High-fidelity Skeleton matching PredictionCard's default 'card' layout.
 * Includes league pill, clock, home/away team badges, outcome chip, and action bar.
 */
export const PredictionCardSkeleton = () => (
  <Card className="overflow-hidden border bg-card">
    <CardHeader className="pb-2 pt-3.5 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3 px-4 pb-4">
      {/* Teams display */}
      <div className="flex items-center justify-between gap-3 py-1">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-4 w-6 rounded-full" />
        <div className="flex items-center gap-2.5 flex-1 justify-end min-w-0">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        </div>
      </div>

      {/* Outcome and confidence */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
        <Skeleton className="h-6 w-28 rounded-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-10 rounded-md" />
        </div>
      </div>

      {/* Probability meter */}
      <div className="space-y-1">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Community consensus line */}
      <div className="pt-2 border-t border-border/40 space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
        <Skeleton className="h-8 w-24 rounded-md" />
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Compact row skeleton matching PredictionCard's 'compact' view mode.
 */
export const PredictionCompactSkeleton = () => (
  <div className="p-3 rounded-xl border bg-card flex items-center justify-between gap-3">
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-4" />
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  </div>
);

/**
 * List skeleton responding to both card and compact layout modes.
 */
export const PredictionListSkeleton = ({
  count = 6,
  viewMode = 'card',
}: {
  count?: number;
  viewMode?: 'card' | 'compact';
}) => {
  if (viewMode === 'compact') {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: count }).map((_, i) => (
          <PredictionCompactSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PredictionCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Content-aware skeleton for the Live Scores match list.
 */
export const LiveMatchCardSkeleton = () => (
  <Card className="border bg-card overflow-hidden">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>

      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-3 py-2">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="px-3 py-1 bg-muted/40 rounded-lg flex items-center gap-2">
          <Skeleton className="h-5 w-4" />
          <span className="text-muted-foreground font-mono">-</span>
          <Skeleton className="h-5 w-4" />
        </div>
        <div className="flex items-center gap-2.5 justify-end">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3.5 w-20" />
      </div>
    </CardContent>
  </Card>
);

export const LiveMatchListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <LiveMatchCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Content-aware skeleton for Value Bets with edge percentages and bookmaker odds.
 */
export const ValueBetCardSkeleton = () => (
  <Card className="border-l-4 border-l-muted">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-3.5 w-28" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="flex items-center gap-2 my-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-28" />
        <span className="text-muted-foreground text-xs">vs</span>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

export const ValueBetListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <ValueBetCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Content-aware skeleton for BTTS / Over-Under cards.
 */
export const BTTSCardSkeleton = () => (
  <Card className="border bg-card">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-44" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
    </CardContent>
  </Card>
);

export const BTTSListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <BTTSCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Content-aware skeleton for the Tipsters feed.
 */
export const TipsterPostSkeleton = () => (
  <Card className="border bg-card">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-4/5" />
      <div className="flex gap-3 pt-2 border-t border-border/40">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
    </CardContent>
  </Card>
);

export const TipsterFeedSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <TipsterPostSkeleton key={i} />
    ))}
  </div>
);

/**
 * Content-aware skeleton for Leaderboard rankings.
 */
export const LeaderboardSkeleton = () => (
  <div className="p-4 space-y-3">
    <div className="flex items-center justify-between border-b pb-2 px-2">
      <Skeleton className="h-4 w-8" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-12 hidden sm:block" />
      <Skeleton className="h-4 w-12 hidden sm:block" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16 hidden md:block" />
    </div>
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between py-2 px-2 border-b border-border/30">
        <Skeleton className="h-5 w-6 rounded-full" />
        <div className="flex items-center gap-2.5 flex-1 max-w-[200px] ml-3">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-10 hidden sm:block" />
        <Skeleton className="h-4 w-10 hidden sm:block" />
        <Skeleton className="h-4 w-12 font-bold" />
        <Skeleton className="h-4 w-12 hidden md:block" />
      </div>
    ))}
  </div>
);

/**
 * Content-aware skeleton for Highlights & Video cards.
 */
export const VideoHighlightSkeleton = () => (
  <Card className="overflow-hidden border bg-card">
    <Skeleton className="h-44 w-full rounded-t-lg" />
    <CardContent className="p-3.5 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </CardContent>
  </Card>
);

export const VideoHighlightListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <VideoHighlightSkeleton key={i} />
    ))}
  </div>
);

/**
 * Content-aware skeleton for Football News cards.
 */
export const NewsCardSkeleton = () => (
  <Card className="border bg-card overflow-hidden">
    <CardContent className="p-4 space-y-2.5">
      <Skeleton className="h-36 w-full rounded-lg" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-3.5 w-20 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-5/6 font-bold" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </CardContent>
  </Card>
);

export const NewsGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <NewsCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Content-aware skeleton for Correct Score cards showing score pills and probabilities.
 */
export const CorrectScoreCardSkeleton = () => (
  <Card className="border bg-card">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-44" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <div className="space-y-1 text-right">
          <Skeleton className="h-4 w-12 ml-auto" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="pt-2 border-t border-border/40 flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </CardContent>
  </Card>
);

export const CorrectScoreListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <CorrectScoreCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Content-aware skeleton for the Full Match Prediction detail page (/predict/:id or /prediction/:id).
 * Matches the hero match banner, score/odds, AI prediction badge, win probability,
 * tab navigation, and analytics panels.
 */
export const PredictionDetailSkeleton = () => (
  <div className="space-y-6 animate-pulse" aria-label="Loading match prediction details">
    {/* Breadcrumbs */}
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-16" />
      <span className="text-muted-foreground text-xs">/</span>
      <Skeleton className="h-4 w-28" />
      <span className="text-muted-foreground text-xs">/</span>
      <Skeleton className="h-4 w-40" />
    </div>

    {/* Hero Match Banner */}
    <Card className="overflow-hidden border bg-card/70 shadow-sm">
      <div className="p-5 sm:p-7 space-y-6 bg-gradient-to-b from-muted/30 to-background">
        {/* Top bar: League, kickoff time, share/notify */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-5 w-36 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        {/* Teams Matchup Header */}
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4 py-2">
          {/* Home team */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 sm:w-40" />
              <div className="flex gap-1 justify-center sm:justify-start">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4 rounded" />
                ))}
              </div>
            </div>
          </div>

          {/* Center VS / Clock */}
          <div className="flex flex-col items-center justify-center px-2 sm:px-6">
            <Skeleton className="h-8 w-14 rounded-full mb-1.5" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Away team */}
          <div className="flex flex-col sm:flex-row-reverse items-center gap-3 text-center sm:text-right">
            <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 sm:w-40 ml-auto" />
              <div className="flex gap-1 justify-center sm:justify-end">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Highlight Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-7 w-36 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          {/* Probability Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        </div>

        {/* 1X2 Odds Comparison Grid */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3.5 rounded-xl border bg-card/60 text-center space-y-1.5">
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-6 w-12 mx-auto rounded-md" />
              <Skeleton className="h-2.5 w-10 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </Card>

    {/* Analytics Tabs Navigation Bar */}
    <div className="flex gap-2 border-b pb-2 overflow-x-auto">
      {['Overview', 'xG & Markets', 'H2H & Timeline', 'Pitch Lineup', 'Form Trends'].map((tab) => (
        <Skeleton key={tab} className="h-9 w-28 rounded-lg shrink-0" />
      ))}
    </div>

    {/* Analytics Body Panel Skeleton */}
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border p-5 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-20" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="border p-5 space-y-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </Card>
    </div>
  </div>
);

/**
 * Skeleton for UpcomingMatches section cards.
 */
export const UpcomingMatchCardSkeleton = () => (
  <Card className="border bg-card overflow-hidden">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
      <div className="space-y-2 py-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
    </CardContent>
  </Card>
);

export const UpcomingMatchListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <UpcomingMatchCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for LiveMatches section cards on home page.
 */
export const LiveMatchGridSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} className="border bg-card p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
        <div className="flex items-center justify-between py-1">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-12 rounded-lg" />
        </div>
        <div className="pt-2 border-t border-border/40 flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      </Card>
    ))}
  </div>
);

/**
 * Skeleton for AccumulatorBuilder fixture list.
 */
export const AccaFixtureCardSkeleton = () => (
  <Card className="border bg-card">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-12 flex-1 rounded-lg" />
        <Skeleton className="h-12 flex-1 rounded-lg" />
        <Skeleton className="h-12 flex-1 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

export const AccaFixtureListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <AccaFixtureCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for PastResultsArchive cards.
 */
export const PastResultsCardSkeleton = () => (
  <Card className="border-border/60 bg-card">
    <CardContent className="p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-4 w-36 font-semibold" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-4 w-10 rounded" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full mt-2" />
    </CardContent>
  </Card>
);

export const PastResultsGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <PastResultsCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for MatchScreener filtered match cards.
 */
export const ScreenerMatchCardSkeleton = () => (
  <Card className="border bg-card">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
      <div className="space-y-1.5 py-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

export const ScreenerMatchGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <ScreenerMatchCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for DroppingOddsRadar cards.
 */
export const DroppingOddsCardSkeleton = () => (
  <Card className="border bg-card">
    <CardContent className="p-5 space-y-3.5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-full" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 py-1">
        <div className="flex items-center gap-2 flex-1">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <span className="text-xs text-muted-foreground">vs</span>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </CardContent>
  </Card>
);

export const DroppingOddsGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <DroppingOddsCardSkeleton key={i} />
    ))}
  </div>
);


