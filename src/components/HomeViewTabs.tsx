import React from 'react';
import { Trophy, Zap, Layers, Newspaper, Archive, LayoutList } from 'lucide-react';

export type HomeViewMode = 'predictions' | 'live' | 'slips' | 'news' | 'archive' | 'all';

interface HomeViewTabsProps {
  activeMode: HomeViewMode;
  onModeChange: (mode: HomeViewMode) => void;
  matchesCount?: number;
  liveCount?: number;
}

export const HomeViewTabs: React.FC<HomeViewTabsProps> = ({
  activeMode,
  onModeChange,
  matchesCount = 24,
  liveCount = 0,
}) => {
  const tabs: Array<{
    id: HomeViewMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badgeText?: string;
  }> = [
    { id: 'predictions', label: 'Predictions Feed', icon: Trophy, count: matchesCount },
    { id: 'live', label: 'Live & In-Play', icon: Zap, badgeText: liveCount > 0 ? `${liveCount} Live` : 'Live' },
    { id: 'slips', label: 'Smart Slips & Accas', icon: Layers, badgeText: 'AI Slip' },
    { id: 'news', label: 'News & Lineups', icon: Newspaper },
    { id: 'archive', label: 'Results & Archive', icon: Archive },
    { id: 'all', label: 'All Modules', icon: LayoutList, badgeText: 'Full' },
  ];

  return (
    <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-md border-b border-border/80 shadow-xs py-2 px-2 sm:px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-2">
          {/* Scrollable Tabs on Mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeMode === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onModeChange(tab.id)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {tab.badgeText && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {tab.badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
