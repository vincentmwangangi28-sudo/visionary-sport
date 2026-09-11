import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingDown, 
  Sparkles, 
  Activity, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  Flame
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SteamAlert {
  id: string;
  type: 'dropping_odds' | 'ai_lock' | 'momentum' | 'value_ev';
  text: string;
  badge: string;
  badgeColor: string;
  link: string;
}

const STEAM_ALERTS: SteamAlert[] = [
  {
    id: '1',
    type: 'dropping_odds',
    badge: 'STEAM MOVE -14%',
    badgeColor: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
    text: 'Arsenal vs Chelsea: Arsenal Home Win odds shortened 1.95 → 1.68 (Heavy Sharp Volume)',
    link: '/dropping-odds',
  },
  {
    id: '2',
    type: 'ai_lock',
    badge: '88% AI LOCK',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    text: 'Real Madrid vs Barcelona: Over 2.5 Goals model probability at 88.4% (xG combined 3.42)',
    link: '/best-bets',
  },
  {
    id: '3',
    type: 'momentum',
    badge: 'LIVE PRESSURE 86%',
    badgeColor: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    text: 'In-Play Momentum Radar: Man City attacking third dominance hitting peak pressure index',
    link: '/live',
  },
  {
    id: '4',
    type: 'value_ev',
    badge: '+11.2% EV EDGE',
    badgeColor: 'bg-primary/15 text-primary border-primary/30',
    text: 'Value Radar: Bayern Munich vs Dortmund BTTS priced at 1.80 vs 1.54 True Model Price',
    link: '/value-bets',
  },
  {
    id: '5',
    type: 'ai_lock',
    badge: 'BANKER ACCA',
    badgeColor: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    text: 'Weekend AI Mega Parlay: 5 Legs combined odds 5.85 with 82.1% composite strike rate',
    link: '/recommendations',
  },
];

export const LiveMarketSteamTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % STEAM_ALERTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const activeAlert = STEAM_ALERTS[currentIndex];

  return (
    <div 
      className="bg-card/90 backdrop-blur-md border-b border-border/60 py-2 px-3 text-xs overflow-hidden select-none transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Live Market Steam & AI Signals Ticker"
    >
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-3">
        {/* Left Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-extrabold uppercase tracking-wider text-[11px] text-muted-foreground hidden sm:inline flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-primary" /> Market Radar
          </span>
        </div>

        {/* Central Sliding Alert */}
        <div className="flex-1 flex items-center gap-2 overflow-hidden truncate">
          <Badge 
            variant="outline" 
            className={`text-[10px] font-black uppercase px-2 py-0.5 shrink-0 transition-all ${activeAlert.badgeColor}`}
          >
            {activeAlert.badge}
          </Badge>

          <span className="text-foreground font-medium truncate text-[11px] sm:text-xs">
            {activeAlert.text}
          </span>
        </div>

        {/* Action Link */}
        <Link 
          to={activeAlert.link} 
          className="shrink-0 font-bold text-[11px] text-primary hover:underline flex items-center gap-0.5 ml-2"
        >
          <span>View</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
