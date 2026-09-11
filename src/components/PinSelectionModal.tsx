import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Pin,
  Search,
  Check,
  RotateCcw,
  Trophy,
  Shield,
  X,
  Sparkles,
} from 'lucide-react';
import { usePersonalizedDashboard } from '@/hooks/usePersonalizedDashboard';
import { TeamLogo } from '@/components/TeamLogo';

interface PinSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PinSelectionModal({ open, onOpenChange }: PinSelectionModalProps) {
  const {
    pinnedLeagues,
    pinnedTeams,
    togglePinLeague,
    togglePinTeam,
    isLeaguePinned,
    isTeamPinned,
    popularLeagues,
    popularClubs,
    resetPins,
  } = usePersonalizedDashboard();

  const [activeTab, setActiveTab] = useState<'teams' | 'leagues'>('teams');
  const [search, setSearch] = useState('');

  const filteredTeams = useMemo(() => {
    if (!search.trim()) return popularClubs;
    const q = search.toLowerCase();
    return popularClubs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.league.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q)
    );
  }, [popularClubs, search]);

  const filteredLeagues = useMemo(() => {
    if (!search.trim()) return popularLeagues;
    const q = search.toLowerCase();
    return popularLeagues.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q) ||
        (l.aliases && l.aliases.some((a) => a.toLowerCase().includes(q)))
    );
  }, [popularLeagues, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Pin className="h-5 w-5 fill-primary/20" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Customize Pinned Dashboard
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Select your favorite leagues and clubs for instant stats, tables, and AI alerts.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetPins}
              className="text-xs text-muted-foreground gap-1.5 h-8 hover:text-foreground"
              title="Reset to recommended default pins"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clubs (e.g., Arsenal, Real Madrid) or leagues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
              <Badge variant="outline" className="text-[11px] gap-1 px-2 py-1 bg-background">
                <Shield className="h-3 w-3 text-primary" />
                {pinnedTeams.length} Teams
              </Badge>
              <Badge variant="outline" className="text-[11px] gap-1 px-2 py-1 bg-background">
                <Trophy className="h-3 w-3 text-amber-500" />
                {pinnedLeagues.length} Leagues
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'teams' | 'leagues')}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-5 pt-3 pb-1 border-b bg-background">
            <TabsList className="grid grid-cols-2 h-9">
              <TabsTrigger value="teams" className="text-xs gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Clubs & Teams ({pinnedTeams.length} pinned)
              </TabsTrigger>
              <TabsTrigger value="leagues" className="text-xs gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                Leagues & Tournaments ({pinnedLeagues.length} pinned)
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TEAMS TAB */}
          <TabsContent value="teams" className="flex-1 overflow-y-auto p-4 m-0 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredTeams.map((club) => {
                const pinned = isTeamPinned(club.name);
                return (
                  <div
                    key={club.name}
                    onClick={() => togglePinTeam(club.name)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      pinned
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/60 hover:border-border hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TeamLogo
                        teamName={club.name}
                        className="w-8 h-8 rounded-full border bg-background p-0.5 object-contain flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">{club.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {club.shortName}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {club.league} • {club.country}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={pinned ? 'default' : 'outline'}
                      className={`h-7 px-2.5 text-[11px] gap-1 flex-shrink-0 ml-2 ${
                        pinned ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinTeam(club.name);
                      }}
                    >
                      {pinned ? (
                        <>
                          <Check className="h-3 w-3" /> Pinned
                        </>
                      ) : (
                        <>
                          <Pin className="h-3 w-3" /> Pin
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            {filteredTeams.length === 0 && (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Search className="h-8 w-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">No clubs found matching "{search}"</p>
              </div>
            )}
          </TabsContent>

          {/* LEAGUES TAB */}
          <TabsContent value="leagues" className="flex-1 overflow-y-auto p-4 m-0 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredLeagues.map((league) => {
                const pinned = isLeaguePinned(league.name);
                return (
                  <div
                    key={league.name}
                    onClick={() => togglePinLeague(league.name)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      pinned
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/60 hover:border-border hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl flex-shrink-0">{league.flag}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold truncate block">{league.name}</span>
                        <p className="text-[10px] text-muted-foreground truncate">{league.country}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={pinned ? 'default' : 'outline'}
                      className={`h-7 px-2.5 text-[11px] gap-1 flex-shrink-0 ml-2 ${
                        pinned ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinLeague(league.name);
                      }}
                    >
                      {pinned ? (
                        <>
                          <Check className="h-3 w-3" /> Pinned
                        </>
                      ) : (
                        <>
                          <Pin className="h-3 w-3" /> Pin
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>

            {filteredLeagues.length === 0 && (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Search className="h-8 w-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">No leagues found matching "{search}"</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="p-3 px-5 border-t bg-muted/20 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Changes take effect instantly on your personalized dashboard.
          </p>
          <Button size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
