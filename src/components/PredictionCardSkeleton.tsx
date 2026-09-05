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

