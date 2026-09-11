import React, { useRef } from 'react';
import { Calendar, Flame, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type DateFilterType = 'all' | 'today' | 'tomorrow' | 'weekend';

export interface LeagueDateFilterBarProps {
  selectedFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType) => void;
  counts?: {
    all?: number;
    today?: number;
    tomorrow?: number;
    weekend?: number;
  };
  className?: string;
}

interface FilterChip {
  id: DateFilterType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  gradient?: string;
}

const CHIPS: FilterChip[] = [
  {
    id: 'all',
    label: 'All Fixtures',
    icon: Calendar,
  },
  {
    id: 'today',
    label: 'Today',
    icon: Flame,
    tag: 'Live / Prime',
    gradient: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    id: 'tomorrow',
    label: 'Tomorrow',
    icon: Clock,
    tag: 'Early Lines',
    gradient: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  },
  {
    id: 'weekend',
    label: 'Weekend',
    icon: Sparkles,
    tag: 'Big Matchdays',
    gradient: 'from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  },
];

export const LeagueDateFilterBar: React.FC<LeagueDateFilterBarProps> = ({
  selectedFilter,
  onFilterChange,
  counts,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Swipeable Container with touch-action and no scrollbars */}
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="Filter matches by timeframe"
        className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-none no-scrollbar touch-pan-x snap-x snap-mandatory"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {CHIPS.map((chip) => {
          const isSelected = selectedFilter === chip.id;
          const Icon = chip.icon;
          const count = counts?.[chip.id];

          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              id={`league-filter-${chip.id}`}
              onClick={() => onFilterChange(chip.id)}
              className={`group relative shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 snap-start select-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02] border-transparent'
                  : 'bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border/70 hover:border-border'
              }`}
            >
              {/* Icon */}
              <Icon
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isSelected
                    ? 'text-primary-foreground scale-110'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}
              />

              {/* Label */}
              <span className="whitespace-nowrap font-black tracking-tight">{chip.label}</span>

              {/* Optional dynamic count badge */}
              {typeof count === 'number' && (
                <span
                  className={`inline-flex items-center justify-center text-[10px] font-mono px-1.5 py-0.2 rounded-full min-w-[18px] transition-colors ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground font-extrabold'
                      : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                  }`}
                >
                  {count}
                </span>
              )}

              {/* Micro tag for Today / Tomorrow / Weekend */}
              {chip.tag && !isSelected && (
                <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground/80">
                  {chip.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
