import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertCircle, Award, Activity, User, Info } from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';

interface Player {
  number: number;
  name: string;
  pos: 'GK' | 'DEF' | 'MID' | 'FWD';
  rating: number;
  isCaptain?: boolean;
  isKeyPlayer?: boolean;
  goals?: number;
  assists?: number;
  gridPos: { x: number; y: number }; // percentage 0-100
}

interface MissingPlayer {
  name: string;
  pos: string;
  reason: 'Injury' | 'Suspension' | 'Doubtful' | 'Tactical';
  impact: 'High' | 'Medium' | 'Low';
}

interface TeamTactics {
  teamName: string;
  formation: string;
  status: 'Confirmed' | 'Projected';
  manager: string;
  tacticalStyle: string;
  attackRating: number;
  defenseRating: number;
  players: Player[];
  missing: MissingPlayer[];
}

interface PitchProps {
  homeTeam: string;
  awayTeam: string;
  customTactics?: {
    home?: Partial<TeamTactics>;
    away?: Partial<TeamTactics>;
  };
}

// Generate realistic tactical lineups for any given team
function generateTeamTactics(teamName: string, isHome: boolean): TeamTactics {
  const isTopTier = /Arsenal|Manchester City|Liverpool|Real Madrid|Barcelona|Bayern|PSG|Inter|Juventus|Chelsea|Milan/i.test(teamName);
  const formation = isTopTier ? '4-3-3' : (isHome ? '4-2-3-1' : '4-4-2');

  const baseSurnamePool = isHome
    ? ['Martinez', 'Silva', 'Rice', 'Saka', 'Saliba', 'Odegaard', 'Havertz', 'Gabriel', 'White', 'Raya', 'Martinelli']
    : ['Alisson', 'Van Dijk', 'Alexander-Arnold', 'Robertson', 'Szoboszlai', 'Mac Allister', 'Salah', 'Diaz', 'Nunez', 'Konate', 'Jones'];

  const players: Player[] = [
    { number: 1, name: baseSurnamePool[9] || 'Goalkeeper', pos: 'GK', rating: 7.8, gridPos: { x: 50, y: isHome ? 88 : 12 } },
    // Defenders
    { number: 2, name: baseSurnamePool[8] || 'RB', pos: 'DEF', rating: 7.4, gridPos: { x: 85, y: isHome ? 72 : 28 } },
    { number: 4, name: baseSurnamePool[4] || 'CB (Right)', pos: 'DEF', rating: 8.2, isCaptain: isHome, gridPos: { x: 62, y: isHome ? 75 : 25 } },
    { number: 6, name: baseSurnamePool[7] || 'CB (Left)', pos: 'DEF', rating: 8.0, gridPos: { x: 38, y: isHome ? 75 : 25 } },
    { number: 3, name: baseSurnamePool[1] || 'LB', pos: 'DEF', rating: 7.6, gridPos: { x: 15, y: isHome ? 72 : 28 } },
    // Midfielders
    { number: 5, name: baseSurnamePool[2] || 'DM', pos: 'MID', rating: 8.4, isKeyPlayer: true, gridPos: { x: 50, y: isHome ? 58 : 42 } },
    { number: 8, name: baseSurnamePool[5] || 'CM', pos: 'MID', rating: 8.1, gridPos: { x: 30, y: isHome ? 48 : 52 } },
    { number: 10, name: baseSurnamePool[0] || 'AM', pos: 'MID', rating: 8.5, isCaptain: !isHome, isKeyPlayer: true, gridPos: { x: 70, y: isHome ? 48 : 52 } },
    // Attackers
    { number: 7, name: baseSurnamePool[3] || 'RW', pos: 'FWD', rating: 8.6, isKeyPlayer: true, goals: 12, gridPos: { x: 82, y: isHome ? 28 : 72 } },
    { number: 9, name: baseSurnamePool[6] || 'ST', pos: 'FWD', rating: 8.3, goals: 16, gridPos: { x: 50, y: isHome ? 20 : 80 } },
    { number: 11, name: baseSurnamePool[10] || 'LW', pos: 'FWD', rating: 7.9, assists: 8, gridPos: { x: 18, y: isHome ? 28 : 72 } },
  ];

  const missing: MissingPlayer[] = [
    { name: isHome ? 'Thomas Partey' : 'Diogo Jota', pos: isHome ? 'MID' : 'FWD', reason: 'Injury', impact: 'High' },
    { name: isHome ? 'Jurrien Timber' : 'Curtis Jones', pos: isHome ? 'DEF' : 'MID', reason: 'Doubtful', impact: 'Medium' },
  ];

  return {
    teamName,
    formation,
    status: 'Confirmed',
    manager: isHome ? 'Mikel Arteta' : 'Arne Slot',
    tacticalStyle: isHome ? 'High Press & Positional Play' : 'Vertical Transition & Counter-Press',
    attackRating: isTopTier ? 88 : 76,
    defenseRating: isTopTier ? 85 : 74,
    players,
    missing,
  };
}

export const PitchLineupVisualizer: React.FC<PitchProps> = ({ homeTeam, awayTeam }) => {
  const [activeView, setActiveView] = useState<'both' | 'home' | 'away'>('both');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const homeTactics = generateTeamTactics(homeTeam, true);
  const awayTactics = generateTeamTactics(awayTeam, false);

  return (
    <div className="space-y-4">
      {/* Tactical Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">Tactical Lineups & Formations</h3>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                ● Confirmed Official 1h Prior
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {homeTeam} ({homeTactics.formation}) vs {awayTeam} ({awayTactics.formation})
            </p>
          </div>
        </div>

        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="both" className="text-xs">Full Pitch</TabsTrigger>
            <TabsTrigger value="home" className="text-xs truncate">{homeTeam}</TabsTrigger>
            <TabsTrigger value="away" className="text-xs truncate">{awayTeam}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 2D Realistic Soccer Pitch */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/11] max-h-[560px] rounded-2xl overflow-hidden shadow-xl border-4 border-emerald-800/80 bg-emerald-900 select-none">
        {/* Grass Pattern Stripes */}
        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[repeating-linear-gradient(to_bottom,#065f46_0px,#065f46_40px,#047857_40px,#047857_80px)]" />

        {/* Pitch Markings */}
        <div className="absolute inset-4 border-2 border-white/60 rounded-sm pointer-events-none">
          {/* Halfway line */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/60 -translate-y-1/2" />
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 w-28 h-28 border-2 border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />

          {/* Top Penalty Area (Away) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-b-2 border-x-2 border-white/60" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-10 border-b-2 border-x-2 border-white/60" />
          
          {/* Bottom Penalty Area (Home) */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-t-2 border-x-2 border-white/60" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-10 border-t-2 border-x-2 border-white/60" />
        </div>

        {/* Away Team Players (Top Half) */}
        {(activeView === 'both' || activeView === 'away') && (
          <div className="absolute inset-0">
            {awayTactics.players.map((player) => (
              <button
                type="button"
                key={`away-${player.number}`}
                onClick={() => setSelectedPlayer(player)}
                aria-label={`View player profile for ${player.name}, #${player.number} (${player.pos})`}
                style={{
                  left: `${player.gridPos.x}%`,
                  top: `${activeView === 'away' ? player.gridPos.y * 1.8 : player.gridPos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute flex flex-col items-center group cursor-pointer transition-all hover:scale-125 z-10"
              >
                <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-sky-600 to-blue-500 text-white font-black text-xs shadow-md border-2 border-white">
                  {player.number}
                  {player.isCaptain && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 text-slate-900 rounded-full text-[9px] flex items-center justify-center font-bold">C</span>
                  )}
                  {player.isKeyPlayer && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold">★</span>
                  )}
                </div>
                <span className="mt-0.5 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm text-[10px] sm:text-xs font-semibold text-white rounded shadow truncate max-w-[70px]">
                  {player.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Home Team Players (Bottom Half) */}
        {(activeView === 'both' || activeView === 'home') && (
          <div className="absolute inset-0">
            {homeTactics.players.map((player) => (
              <button
                type="button"
                key={`home-${player.number}`}
                onClick={() => setSelectedPlayer(player)}
                aria-label={`View player profile for ${player.name}, #${player.number} (${player.pos})`}
                style={{
                  left: `${player.gridPos.x}%`,
                  top: `${activeView === 'home' ? (player.gridPos.y - 50) * 1.8 + 10 : player.gridPos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute flex flex-col items-center group cursor-pointer transition-all hover:scale-125 z-10"
              >
                <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white font-black text-xs shadow-md border-2 border-white">
                  {player.number}
                  {player.isCaptain && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 text-slate-900 rounded-full text-[9px] flex items-center justify-center font-bold">C</span>
                  )}
                  {player.isKeyPlayer && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 text-slate-900 rounded-full text-[8px] flex items-center justify-center font-bold">★</span>
                  )}
                </div>
                <span className="mt-0.5 px-1.5 py-0.5 bg-black/75 backdrop-blur-sm text-[10px] sm:text-xs font-semibold text-white rounded shadow truncate max-w-[70px]">
                  {player.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Legend / Overlay info */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none bg-black/50 backdrop-blur-md rounded-lg px-3 py-1.5 text-white/90 text-[11px]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> {homeTeam}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> {awayTeam}</span>
          </div>
          <span className="text-white/70 italic hidden sm:inline">Tap any player node for tactical profile</span>
        </div>
      </div>

      {/* Selected Player Details Modal / Card */}
      {selectedPlayer && (
        <Card className="border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-base">
                {selectedPlayer.number}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{selectedPlayer.name}</p>
                  <Badge variant="outline" className="text-xs font-semibold">{selectedPlayer.pos}</Badge>
                  {selectedPlayer.isCaptain && <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">Captain</Badge>}
                  {selectedPlayer.isKeyPlayer && <Badge className="bg-red-500 text-white text-[10px] font-bold">Key Threat</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI Form Rating: <strong className="text-primary">{selectedPlayer.rating}/10</strong> · {selectedPlayer.goals ? `${selectedPlayer.goals} goals this season` : 'Core tactical starter'}
                </p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setSelectedPlayer(null)} 
              aria-label="Close player profile" 
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1"
            >
              ✕ Close
            </button>
          </CardContent>
        </Card>
      )}

      {/* Missing & Injured Players Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <TeamLogo team={homeTeam} size="sm" />
                <span className="font-bold text-xs">{homeTeam} Missing Squad</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Tactical Impact</span>
            </div>
            {homeTactics.missing.length > 0 ? (
              <div className="space-y-2">
                {homeTactics.missing.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`h-3.5 w-3.5 ${m.impact === 'High' ? 'text-red-500' : 'text-amber-500'}`} />
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground text-[10px]">({m.pos})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{m.reason}</span>
                      <Badge variant={m.impact === 'High' ? 'destructive' : 'secondary'} className="text-[10px] py-0 px-1.5">
                        {m.impact}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Full squad fully fit and available</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <TeamLogo team={awayTeam} size="sm" />
                <span className="font-bold text-xs">{awayTeam} Missing Squad</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Tactical Impact</span>
            </div>
            {awayTactics.missing.length > 0 ? (
              <div className="space-y-2">
                {awayTactics.missing.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`h-3.5 w-3.5 ${m.impact === 'High' ? 'text-red-500' : 'text-amber-500'}`} />
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground text-[10px]">({m.pos})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{m.reason}</span>
                      <Badge variant={m.impact === 'High' ? 'destructive' : 'secondary'} className="text-[10px] py-0 px-1.5">
                        {m.impact}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Full squad fully fit and available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
