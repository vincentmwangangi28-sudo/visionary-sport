import { TeamLogo } from '@/components/TeamLogo';

interface H2HResult { home: string; away: string; score: string; date: string; }
interface Props { h2h: H2HResult[]; homeTeam: string; awayTeam: string; }

export const H2HWidget = ({ h2h, homeTeam, awayTeam }: Props) => {
  if (!h2h?.length) return null;
  const homeWins = h2h.filter(m => {
    const [hs, as] = m.score.split('-').map(Number);
    return (m.home === homeTeam && hs > as) || (m.away === homeTeam && as > hs);
  }).length;
  const awayWins = h2h.filter(m => {
    const [hs, as] = m.score.split('-').map(Number);
    return (m.home === awayTeam && hs > as) || (m.away === awayTeam && as > hs);
  }).length;
  const draws = h2h.length - homeWins - awayWins;

  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold">Head to Head (last {h2h.length})</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center justify-end gap-1.5 text-right text-sm font-medium min-w-0">
          <span className="truncate">{homeTeam}</span>
          <TeamLogo team={homeTeam} size="xs" />
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">{homeWins}W</span>
          <span className="px-2 py-1 bg-amber-400 text-white text-xs font-bold rounded">{draws}D</span>
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">{awayWins}W</span>
        </div>
        <div className="flex-1 flex items-center gap-1.5 text-sm font-medium min-w-0">
          <TeamLogo team={awayTeam} size="xs" />
          <span className="truncate">{awayTeam}</span>
        </div>
      </div>
      <div className="space-y-1.5 pt-1">
        {h2h.slice(0, 4).map((m, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 p-1.5 rounded-lg border border-border/40">
            <div className="flex items-center gap-1.5 truncate max-w-[38%]">
              <TeamLogo team={m.home} size="xs" />
              <span className="truncate">{m.home}</span>
            </div>
            <span className="font-bold text-foreground px-2 py-0.5 bg-muted rounded flex-shrink-0">{m.score}</span>
            <div className="flex items-center justify-end gap-1.5 truncate max-w-[38%] text-right">
              <span className="truncate">{m.away}</span>
              <TeamLogo team={m.away} size="xs" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

