import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  getInPlayMomentumSignals,
  saveInPlayMomentumSignals,
  DEFAULT_IN_PLAY_SIGNALS,
  type InPlayMomentumSignal,
  type InPlayAlertType,
} from '@/services/phase11AnalyticsService';
import { toast } from 'sonner';
import { Plus, RotateCcw, ExternalLink, Activity, Smartphone } from 'lucide-react';

export const AdminSocialStoryStudioTab: React.FC = () => {
  const [signals, setSignals] = useState<InPlayMomentumSignal[]>(() =>
    getInPlayMomentumSignals()
  );
  const [homeTeam, setHomeTeam] = useState('Liverpool');
  const [awayTeam, setAwayTeam] = useState('Arsenal');
  const [league, setLeague] = useState('Premier League');
  const [minute, setMinute] = useState('77');
  const [market, setMarket] = useState('Over 2.5 Match Goals (In-Play)');
  const [bookieOdds, setBookieOdds] = useState('1.58');
  const [alertType, setAlertType] = useState<InPlayAlertType>('LATE_GOAL_75_PLUS');

  const handlePinInPlayAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim()) return;
    const minNum = Math.min(90, Math.max(10, Number(minute) || 75));
    const oddsNum = Math.max(1.15, Number(bookieOdds) || 1.58);
    const fairOdds = Number((oddsNum * 0.84).toFixed(2));
    const edgePct = Number((((oddsNum - fairOdds) / fairOdds) * 100).toFixed(1));

    const newSig: InPlayMomentumSignal = {
      id: `admin-ip-${Date.now()}`,
      homeTeam: homeTeam.trim(),
      awayTeam: awayTeam.trim(),
      league: league.trim() || 'Premier League',
      minute: minNum,
      homeScore: 1,
      awayScore: 1,
      liveXgHome: 2.12,
      liveXgAway: 1.24,
      last15MinShots: 7,
      last15MinCorners: 4,
      attackingTiltPct: 76,
      alertType,
      recommendedMarket: market.trim() || 'Over 2.5 Match Goals',
      nextGoalModelProbPct: Number(((1 / fairOdds) * 100).toFixed(1)),
      fairNextGoalOdds: fairOdds,
      bookieInPlayOdds: oddsNum,
      inPlayEdgePct: edgePct,
      tacticalSummary: `Admin-pinned live momentum alert at ${minNum}': high box-entry pressure and +${edgePct}% live edge.`,
    };

    const next = [newSig, ...signals];
    setSignals(next);
    saveInPlayMomentumSignals(next);
    toast.success(`Pinned live in-play alert: ${homeTeam} vs ${awayTeam}`);
  };

  const handleResetDefaults = () => {
    setSignals(DEFAULT_IN_PLAY_SIGNALS);
    saveInPlayMomentumSignals(DEFAULT_IN_PLAY_SIGNALS);
    toast.info('Reset in-play momentum alerts to default feed');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-foreground">
            In-Play Momentum Seeder &amp; 9:16 Social Story Studio
          </h3>
          <p className="text-xs text-muted-foreground">
            Pin custom 75&apos;+ Late-Goal alerts to `/in-play-edge` and launch the 1080p WhatsApp Status &amp; Telegram Graphic Studio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link to="/in-play-edge">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              <span>Open In-Play Radar</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
          <Link to="/social-card-studio">
            <Button size="sm" className="text-xs font-bold gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              <span>Open 9:16 Story Studio</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pin New In-Play Signal Form */}
        <form
          onSubmit={handlePinInPlayAlert}
          className="lg:col-span-5 p-4 rounded-xl border border-border bg-card space-y-3"
        >
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Pin Custom In-Play Momentum Alert
            </h4>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Home Team</label>
              <input
                type="text"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-border bg-background text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Away Team</label>
              <input
                type="text"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-border bg-background text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">League</label>
              <input
                type="text"
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-border bg-background text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Match Minute</label>
              <input
                type="number"
                min={10}
                max={90}
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-border bg-background font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">Alert Type</label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as InPlayAlertType)}
                className="w-full h-8 px-2 rounded border border-border bg-background text-xs"
              >
                <option value="LATE_GOAL_75_PLUS">75&apos;+ Late Goal</option>
                <option value="FAVORITE_TRAILING_PRESSURE">Trailing Favorite</option>
                <option value="HALF_TIME_SPIKE">1st Half Goal Spike</option>
                <option value="CORNER_SIEGE">Corner Siege</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">In-Play Odds</label>
              <input
                type="number"
                step="0.01"
                value={bookieOdds}
                onChange={(e) => setBookieOdds(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-border bg-background font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">
              Recommended In-Play Market
            </label>
            <input
              type="text"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="w-full h-8 px-2.5 rounded border border-border bg-background text-xs"
            />
          </div>

          <Button type="submit" size="sm" className="w-full gap-1.5 text-xs font-bold cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            <span>Pin Live Momentum Alert</span>
          </Button>
        </form>

        {/* Active Signals List */}
        <div className="lg:col-span-7 p-4 rounded-xl border border-border bg-card space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Active In-Play Momentum Feed ({signals.length})
          </h4>
          <div className="divide-y divide-border/50">
            {signals.map((s) => (
              <div key={s.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div>
                  <p className="font-bold text-foreground">
                    {s.homeTeam} vs {s.awayTeam} ({s.minute}&apos;)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.recommendedMarket} · Fair {s.fairNextGoalOdds.toFixed(2)} vs Bookie{' '}
                    {s.bookieInPlayOdds.toFixed(2)}
                  </p>
                </div>
                <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                  +{s.inPlayEdgePct.toFixed(1)}% Edge
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSocialStoryStudioTab;
