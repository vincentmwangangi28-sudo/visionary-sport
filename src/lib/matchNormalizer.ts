export interface NormalizedMatch {
  id: string;
  home_team: string;
  away_team: string;
  competition?: string;
  match_date: string; // ISO UTC
  status: 'live' | 'halftime' | 'finished' | 'upcoming' | 'postponed' | 'cancelled' | 'unknown';
  minute?: number | null;
  home_score?: number | null;
  away_score?: number | null;
  home_logo?: string | null;
  away_logo?: string | null;
  prediction?: string | null;
  confidence?: number | null;
}

export function toIsoUtc(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime()) && dateStr.includes('T')) return d.toISOString();
  } catch (e) {
    // fallthrough
  }
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const t = timeStr && timeStr.length > 0 ? timeStr : '00:00:00';
    return new Date(dateStr + 'T' + t + 'Z').toISOString();
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function normalizeStatus(raw?: string): NormalizedMatch['status'] {
  if (!raw) return 'unknown';
  const s = String(raw).toLowerCase();
  if (s.includes('live') || s === 'in-play' || s === '1h' || s === '2h') return 'live';
  if (s === 'ht' || s === 'halftime') return 'halftime';
  if (s === 'ft' || s.includes('full') || s.includes('finished')) return 'finished';
  if (s.includes('post') || s.includes('postponed')) return 'postponed';
  if (s.includes('canc') || s.includes('cancel')) return 'cancelled';
  if (s === 'ns' || s === 'scheduled' || s === 'not started' || s === 'upcoming') return 'upcoming';
  return 'unknown';
}

export function normalizeIncomingMatch(raw: any): NormalizedMatch {
  const match_date = raw.match_date
    ? toIsoUtc(raw.match_date)
    : raw.date && raw.time
      ? toIsoUtc(raw.date, raw.time)
      : raw.date
        ? toIsoUtc(raw.date)
        : raw.fixture?.date
          ? toIsoUtc(raw.fixture.date)
          : new Date().toISOString();

  const status = normalizeStatus(raw.status ?? raw.statusLong ?? raw.fixture?.status?.short ?? raw.fixture?.status?.long ?? undefined);
  const minute = raw.minute ?? raw.time ?? raw.fixture?.status?.elapsed ?? null;

  return {
    id: String(raw.id ?? raw.match_id ?? raw.fixture?.id ?? `${raw.homeTeam ?? raw.home_team}-${raw.awayTeam ?? raw.away_team}`),
    home_team: raw.home_team ?? raw.homeTeam ?? raw.teams?.home?.name ?? raw.strHomeTeam ?? 'Unknown',
    away_team: raw.away_team ?? raw.awayTeam ?? raw.teams?.away?.name ?? raw.strAwayTeam ?? 'Unknown',
    competition: raw.competition ?? raw.league ?? raw.league?.name ?? raw.strLeague ?? undefined,
    match_date,
    status,
    minute: typeof minute === 'number' ? minute : (typeof minute === 'string' ? parseInt(minute.replace(/[^0-9]/g, ''), 10) || null : null),
    home_score: raw.home_score ?? raw.homeScore ?? raw.goals?.home ?? null,
    away_score: raw.away_score ?? raw.awayScore ?? raw.goals?.away ?? null,
    home_logo: raw.home_logo ?? raw.homeLogo ?? raw.teams?.home?.logo ?? null,
    away_logo: raw.away_logo ?? raw.awayLogo ?? raw.teams?.away?.logo ?? null,
    prediction: raw.prediction ?? raw.ai_prediction ?? raw.predicted_outcome ?? null,
    confidence: raw.confidence ?? raw.confidence_score ?? null,
  };
}
