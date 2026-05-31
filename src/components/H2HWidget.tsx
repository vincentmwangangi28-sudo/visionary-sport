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
        <div className="flex-1 text-right text-sm font-medium truncate">{homeTeam}</div>
        <div className="flex gap-1.5">
          <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">{homeWins}W</span>
          <span className="px-2 py-1 bg-amber-400 text-white text-xs font-bold rounded">{draws}D</span>
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">{awayWins}W</span>
        </div>
        <div className="flex-1 text-sm font-medium truncate">{awayTeam}</div>
      </div>
      <div className="space-y-1">
        {h2h.slice(0, 4).map((m, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate max-w-[35%]">{m.home}</span>
            <span className="font-bold text-foreground px-2 py-0.5 bg-muted rounded">{m.score}</span>
            <span className="truncate max-w-[35%] text-right">{m.away}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
