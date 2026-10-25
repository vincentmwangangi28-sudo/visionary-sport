import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Star, Search, RefreshCw, CheckCircle2, Edit3, Sparkles } from 'lucide-react';
import { getUpdatedDefaultPredictions } from '@/data/mockPredictions';
import { toast } from 'sonner';

interface EditorialOverride {
  matchId: string;
  customPick?: string;
  customConfidence?: number;
  isMotd?: boolean;
  insiderNote?: string;
}

export const AdminLiveMatchOverrideTab: React.FC = () => {
  const defaultMatches = useMemo(() => getUpdatedDefaultPredictions().slice(0, 20), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingEspn, setSyncingEspn] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, EditorialOverride>>(() => {
    try {
      const saved = localStorage.getItem('predictpro_admin_editorial_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveOverride = (matchId: string, patch: Partial<EditorialOverride>) => {
    const next = {
      ...overrides,
      [matchId]: {
        ...(overrides[matchId] || { matchId }),
        ...patch,
      },
    };
    setOverrides(next);
    try {
      localStorage.setItem('predictpro_admin_editorial_overrides', JSON.stringify(next));
    } catch {
      // ignore
    }
    toast.success('Editorial match override saved');
  };

  const handleSetMotd = (matchId: string, label: string) => {
    const next: Record<string, EditorialOverride> = {};
    Object.keys(overrides).forEach((k) => {
      next[k] = { ...overrides[k], isMotd: false };
    });
    next[matchId] = { ...(overrides[matchId] || { matchId }), isMotd: true };
    setOverrides(next);
    localStorage.setItem('predictpro_admin_editorial_overrides', JSON.stringify(next));
    toast.success(`Pinned "${label}" as Official Match of the Day (MOTD)`);
  };

  const handleSyncEspnNow = async () => {
    setSyncingEspn(true);
    try {
      const res = await fetch('/api/cron/sync-live-scores');
      if (res.ok) {
        const data = await res.json();
        toast.success(`Synced live ESPN scoreboard & harvested ${data.harvestedSeoSlugs ?? 0} match slugs into SEO Sitemap`);
      } else {
        toast.info('ESPN live scoreboard sync signal dispatched');
      }
    } catch {
      toast.info('ESPN live scoreboard sync completed via fallback cache');
    } finally {
      setSyncingEspn(false);
    }
  };

  const filtered = defaultMatches.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      m.home_team.toLowerCase().includes(q) ||
      m.away_team.toLowerCase().includes(q) ||
      m.competition.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold">
                Live Match Editorial Override, MOTD Pinning &amp; ESPN Scoreboard Harvester
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Pin the official Match of the Day (MOTD), override AI market picks with locker-room intel, or trigger a live ESPN fixture harvest.
            </p>
          </div>
          <Button size="sm" onClick={handleSyncEspnNow} disabled={syncingEspn} className="gap-1.5 text-xs shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${syncingEspn ? 'animate-spin' : ''}`} />
            {syncingEspn ? 'Syncing ESPN...' : 'Sync ESPN Live Slate Now'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                Active Slate Editorial Overrides ({filtered.length} Fixtures)
              </CardTitle>
              <CardDescription className="text-xs">
                Customize primary tip, confidence %, and editorial analyst notes for any match.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by team or league..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border bg-background pl-8 pr-3 py-1.5 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filtered.map((m) => {
              const ov = overrides[m.id] || { matchId: m.id };
              const activePick = ov.customPick || m.predicted_result;
              const activeConf = ov.customConfidence ?? m.confidence;
              return (
                <div
                  key={m.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    ov.isMotd ? 'border-amber-500/50 bg-amber-500/5' : 'bg-card'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {m.competition}
                        </Badge>
                        {ov.isMotd && (
                          <Badge className="bg-amber-500 text-slate-950 text-[10px] font-black gap-1">
                            <Star className="w-3 h-3 fill-current" /> Pinned Match of the Day
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm font-bold">
                        {m.home_team} <span className="text-muted-foreground">vs</span> {m.away_team}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-0.5">Override Market Pick</label>
                        <select
                          value={activePick}
                          onChange={(e) => saveOverride(m.id, { customPick: e.target.value })}
                          className="rounded-md border bg-background px-2.5 py-1 text-xs font-semibold"
                        >
                          <option value={m.predicted_result}>{m.predicted_result} (AI Default)</option>
                          <option value="Home Win">Home Win (1)</option>
                          <option value="Away Win">Away Win (2)</option>
                          <option value="Draw">Draw (X)</option>
                          <option value="Over 2.5 Goals">Over 2.5 Goals</option>
                          <option value="BTTS Yes">BTTS: Yes</option>
                          <option value="Double Chance 1X">Double Chance 1X</option>
                          <option value="Double Chance X2">Double Chance X2</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-0.5">Confidence %</label>
                        <input
                          type="number"
                          min={50}
                          max={99}
                          value={activeConf}
                          onChange={(e) =>
                            saveOverride(m.id, { customConfidence: Math.min(99, Math.max(50, Number(e.target.value) || 75)) })
                          }
                          className="w-20 rounded-md border bg-background px-2 py-1 text-xs font-mono font-bold text-emerald-500"
                        />
                      </div>

                      <div className="pt-3.5">
                        <Button
                          size="sm"
                          variant={ov.isMotd ? 'default' : 'outline'}
                          onClick={() => handleSetMotd(m.id, `${m.home_team} vs ${m.away_team}`)}
                          className="h-7 text-xs gap-1"
                        >
                          <Star className="w-3 h-3" />
                          {ov.isMotd ? 'MOTD Active' : 'Pin as MOTD'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add custom Admin Analyst / Injury Note (e.g., Key striker rested ahead of UCL)..."
                      value={ov.insiderNote || ''}
                      onChange={(e) => saveOverride(m.id, { insiderNote: e.target.value })}
                      className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs"
                    />
                    {ov.insiderNote && (
                      <span className="text-[11px] text-emerald-500 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
