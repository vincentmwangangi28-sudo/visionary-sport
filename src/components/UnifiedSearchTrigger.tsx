import React from 'react';
import { Search } from 'lucide-react';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface UnifiedSearchTriggerProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
  placeholder?: string;
}

export const UnifiedSearchTrigger: React.FC<UnifiedSearchTriggerProps> = ({
  variant = 'full',
  className,
  placeholder = 'Search matches, leagues, teams, blog...',
}) => {
  const { openSearch } = useUnifiedSearch();

  if (variant === 'icon') {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => openSearch()}
        className={cn('h-9 w-9 shrink-0 relative border-border/80 hover:bg-muted/70', className)}
        title="Search (⌘K)"
        aria-label="Open Unified Search"
      >
        <Search className="h-4 w-4 text-foreground/80" />
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => openSearch()}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/70 bg-muted/40 hover:bg-muted/80 text-xs text-muted-foreground transition-all',
          className
        )}
        title="Search (⌘K or /)"
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">Search...</span>
        <kbd className="hidden sm:inline-flex h-4.5 select-none items-center gap-0.5 rounded border bg-background px-1 font-mono text-[9px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openSearch()}
      className={cn(
        'group flex items-center justify-between gap-3 w-full max-w-xs md:max-w-sm lg:max-w-md px-3 py-1.5 h-9 rounded-lg border border-border/70 bg-muted/30 hover:bg-muted/60 hover:border-primary/40 text-xs text-muted-foreground transition-all shadow-xs',
        className
      )}
      title="Search matches, leagues, teams, blog (⌘K or /)"
    >
      <div className="flex items-center gap-2 truncate">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="truncate text-left text-foreground/75 group-hover:text-foreground">
          {placeholder}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/60 bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-2xs">
          <span className="text-[11px]">⌘</span>K
        </kbd>
      </div>
    </button>
  );
};
