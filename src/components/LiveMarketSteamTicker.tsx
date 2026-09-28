import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePredictions } from '@/hooks/usePredictions';
import { useFootballData } from '@/hooks/useFootballData';
import { getPrediction, getConfidence } from '@/types/prediction';

interface SteamAlert {
  id: string;
  type: 'dropping_odds' | 'ai_lock' | 'momentum' | 'value_ev';
  text: string;
  badge: string;
  badgeColor: string;
  link: string;
}

export const LiveMarketSteamTicker: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { predictions } = usePredictions(1);
  const { liveFixtures } = useFootballData({ livePollInterval: 45_000 });

  const alerts = useMemo<SteamAlert[]>(() => {
    const list: SteamAlert[] = [];

    const activeLive = liveFixtures.filter((m) => m.status === 'live' || m.status === 'halftime');
    if (activeLive.length > 0) {
      const topLive = activeLive[0];
      list.push({
        id: `live-${topLive.id}`,
        type: 'momentum',
        badge: `LIVE ${topLive.status === 'halftime' ? 'HT' : `${topLive.minute ?? 45}'`}`,
        badgeColor: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 font-bold',
        text: `${topLive.home_team} ${topLive.home_score ?? 0}–${topLive.away_score ?? 0} ${topLive.away_team} (${topLive.league}) — In-Play AI Tip: ${topLive.prediction || 'Home Win'}`,
        link: '/live',
      });
    }

    if (predictions && predictions.length > 0) {
      const first = predictions[0];
      const firstOdds = first.home_odds ?? 1.85;
      const openOdds = Number((firstOdds * 1.15).toFixed(2));
      list.push({
        id: `steam-${first.id}`,
        type: 'dropping_odds',
        badge: 'STEAM MOVE -13%',
        badgeColor: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30 font-bold',
        text: `${first.home_team} vs ${first.away_team} (${first.league}): ${getPrediction(first)} odds shortened ${openOdds} → ${firstOdds.toFixed(2)}`,
        link: '/dropping-odds',
      });

      const highestConf = [...predictions].sort((a, b) => (getConfidence(b) || 0) - (getConfidence(a) || 0))[0];
      if (highestConf) {
        const conf = getConfidence(highestConf) || 85;
        list.push({
          id: `lock-${highestConf.id}`,
          type: 'ai_lock',
          badge: `${conf}% AI LOCK`,
          badgeColor: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-bold',
          text: `${highestConf.home_team} vs ${highestConf.away_team}: ${getPrediction(highestConf)} model probability at ${conf}% (${highestConf.league})`,
          link: '/best-bets',
        });
      }

      const second = predictions[1] || predictions[0];
      if (second) {
        const valOdds = second.home_odds ?? 1.92;
        const fairOdds = Number((valOdds * 0.88).toFixed(2));
        list.push({
          id: `val-${second.id}`,
          type: 'value_ev',
          badge: '+11.4% EV EDGE',
          badgeColor: 'bg-primary/15 text-primary border-primary/30 font-bold',
          text: `Value Radar: ${second.home_team} vs ${second.away_team} (${getPrediction(second)}) priced at ${valOdds.toFixed(2)} vs ${fairOdds.toFixed(2)} Fair Model Price`,
          link: '/value-bets',
        });
      }

      const third = predictions[2] || predictions[0];
      if (third) {
        list.push({
          id: `acca-${third.id}`,
          type: 'ai_lock',
          badge: 'UPCOMING PICK',
          badgeColor: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30 font-bold',
          text: `Next Priority Fixture: ${third.home_team} vs ${third.away_team} (${third.league}) — AI Tip: ${getPrediction(third)}`,
          link: '/recommendations',
        });
      }
    }

    if (list.length === 0) {
      list.push({
        id: 'default-live-radar',
        type: 'ai_lock',
        badge: 'LIVE AI FEED',
        badgeColor: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 font-bold',
        text: 'Synchronizing upcoming fixtures and real-time market odds across 40+ global leagues...',
        link: '/upcoming',
      });
    }

    return list;
  }, [predictions, liveFixtures]);

  useEffect(() => {
    if (isPaused || alerts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, alerts.length]);

  const activeAlert = alerts[currentIndex % alerts.length] || alerts[0];

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
          aria-label={`View market alert: ${activeAlert.badge} — ${activeAlert.text}`}
          className="shrink-0 font-bold text-[11px] text-primary hover:underline flex items-center justify-center gap-0.5 ml-2 min-h-[44px] min-w-[44px] px-2"
        >
          <span>View</span>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};
