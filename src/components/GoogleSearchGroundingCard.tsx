import React, { useState } from 'react';
import { GroundingMetadata } from '@/services/geminiTasksService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe,
  Sparkles,
} from 'lucide-react';

interface Props {
  metadata?: GroundingMetadata | null;
  newsSummary?: string;
  variant?: 'card' | 'compact' | 'inline';
  className?: string;
}

export const GoogleSearchGroundingCard: React.FC<Props> = ({
  metadata,
  newsSummary,
  variant = 'card',
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!metadata || !metadata.groundedWithGoogleSearch) {
    return null;
  }

  const queries = metadata.webSearchQueries || [];
  const sources = metadata.sources || [];
  const hasSources = sources.length > 0;
  const hasQueries = queries.length > 0;

  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 ${className}`}>
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <Search className="h-2.5 w-2.5" />
        <span>Grounded via Google Search (gemini-3.5-flash)</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Google Search Grounding
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono text-muted-foreground">
              gemini-3.5-flash
            </Badge>
          </div>
          {hasSources && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 px-2 text-[11px] font-medium text-primary hover:text-primary"
            >
              {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {sources.length} sources
            </Button>
          )}
        </div>

        {newsSummary && (
          <p className="mt-1.5 text-muted-foreground text-[11px] leading-relaxed">
            {newsSummary}
          </p>
        )}

        {expanded && (
          <div className="mt-2.5 pt-2 border-t border-border/50 space-y-2">
            {hasQueries && (
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                  Live Search Queries:
                </span>
                <div className="flex flex-wrap gap-1">
                  {queries.map((q, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background/80 border text-[11px] text-muted-foreground"
                    >
                      <Search className="h-2.5 w-2.5 text-primary" />
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {hasSources && (
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                  Verified Sources:
                </span>
                <div className="space-y-1">
                  {sources.slice(0, 4).map((s, idx) => (
                    <a
                      key={idx}
                      href={s.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-1.5 rounded hover:bg-background/80 transition-colors text-[11px] text-foreground border border-transparent hover:border-border"
                    >
                      <span className="truncate max-w-[240px] font-medium flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                        {s.title}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-4 shadow-sm ${className}`}>
      {/* Header Banner */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-foreground">Grounded with Google Search</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by <span className="font-semibold text-foreground">gemini-3.5-flash</span> with real-time web verification
            </p>
          </div>
        </div>

        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold gap-1 py-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Verified Squad Data
        </Badge>
      </div>

      {newsSummary && (
        <div className="mt-3 p-3 rounded-lg bg-background/80 border border-border/60 text-xs text-foreground leading-relaxed">
          <span className="font-semibold text-primary block mb-0.5">Latest Confirmed News:</span>
          {newsSummary}
        </div>
      )}

      {/* Real-time Queries Executed */}
      {hasQueries && (
        <div className="mt-3">
          <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block mb-1.5">
            Google Search Queries Executed:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {queries.map((q, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border text-xs font-medium text-foreground"
              >
                <Search className="h-3 w-3 text-primary shrink-0" />
                {q}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Verified Web Citations / Sources */}
      {hasSources && (
        <div className="mt-3.5 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
              Web Intelligence Citations ({sources.length}):
            </span>
            <span className="text-[11px] text-muted-foreground">Click to inspect official reports</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sources.map((s, idx) => (
              <a
                key={idx}
                href={s.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-card/80 border hover:border-primary/40 hover:bg-muted/40 transition-colors group text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                  <span className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                    {s.title}
                  </span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
