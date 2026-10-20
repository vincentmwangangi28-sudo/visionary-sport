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
}) => {
  const tabs: Array<{
    id: HomeViewMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'predictions', label: 'Fixtures & Odds', icon: Trophy },
    { id: 'live', label: 'In-Play & TV', icon: Zap },
    { id: 'slips', label: 'Acca Builder', icon: Layers },
    { id: 'news', label: 'Lineups & News', icon: Newspaper },
    { id: 'archive', label: 'Results', icon: Archive },
    { id: 'all', label: 'All Views', icon: LayoutList },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-4">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Workspace view modes">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onModeChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 shrink-0 ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
