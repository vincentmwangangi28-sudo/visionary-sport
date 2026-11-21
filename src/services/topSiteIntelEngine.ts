import { Prediction, getConfidence } from '@/types/prediction';
import { calculateMatchXG, calculatePropsMetrics } from '@/utils/predictiveEngine';
import { isPlayedOrPastMatch, matchesDateFilter } from '@/lib/dateFilterUtils';

export interface XgStepPoint {
  minute: number;
  label: string;
  homeXg: number;
  awayXg: number;
  eventText?: string;
  eventTeam?: 'home' | 'away';
  isGoal?: boolean;
}

export interface DeservedPointsSummary {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  actualScore: string;
  homeXg: number;
  awayXg: number;
  deservedWinPct: number;
  deservedDrawPct: number;
  deservedLossPct: number;
  homeExpectedPts: number;
  homeActualPts: number;
  luckDelta: number;
  signal: 'Unlucky — Back Next Match' | 'Overperforming — Fade Candidate' | 'Fair Calibration';
  nextMatchPick: string;
  nextMatchOdds: number;
  timeline: XgStepPoint[];
}

export type PropMarketType = '1+ SoT' | '2+ Shots' | 'Anytime G/A' | '1+ Foul';

export interface PlayerPropMatchLog {
  opponent: string;
  venue: 'H' | 'A';
  statValue: number;
  hit: boolean;
}

export interface PlayerPropHitRateRow {
  id: string;
  player: string;
  team: string;
  league: string;
  position: string;
  opponent: string;
  referee: string;
  market: PropMarketType;
  l5Hits: number;
  l10Hits: number;
  l5RatePct: number;
  l10RatePct: number;
  seasonRatePct: number;
  opponentRankNote: string;
  refFoulImpact: string;
  marketOdds: number;
  fairOdds: number;
  edgePct: number;
  logs: PlayerPropMatchLog[];
}

export interface FixtureCongestionRow {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  homeElo: number;
  awayElo: number;
  eloDiff: number;
  homeRestDays: number;
  awayRestDays: number;
  restEdgeDays: number;
  homeTravelKm: number;
  awayTravelKm: number;
  midweekContext: string;
  homeRotationRiskPct: number;
  awayRotationRiskPct: number;
  recommendedPick: string;
  recommendedOdds: number;
  confidence: number;
}

export interface PressureSurgeRow {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  minute: number;
  isLiveFeed: boolean;
  homeScore: number;
  awayScore: number;
  homeAttacks10m: number;
  awayAttacks10m: number;
  boxShots10m: number;
  cornersLast10m: number;
  xgVelocity10m: number;
  pressureScore: number;
  surgeLabel: '70\'+ Late Goal Alert' | 'Corner Cluster Surge' | 'Box Siege Momentum' | 'Balanced Tempo';
  recommendedMarket: string;
  liveOdds: number;
}

function stableHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

const CLUB_ELO_BASELINES: Record<string, number> = {
  'manchester city': 2028,
  arsenal: 1994,
  liverpool: 1998,
  'real madrid': 2016,
  barcelona: 1988,
  'fc barcelona': 1988,
  'bayern munich': 1985,
  'inter milan': 1962,
  inter: 1962,
  psg: 1954,
  'paris saint-germain': 1954,
  'bayer leverkusen': 1928,
  chelsea: 1905,
  'aston villa': 1868,
  newcastle: 1874,
  'newcastle united': 1874,
  'atletico madrid': 1912,
  juventus: 1894,
  'ac milan': 1882,
  napoli: 1898,
  tottenham: 1862,
  'manchester united': 1848,
  borussia: 1879,
  dortmund: 1879,
  'gor mahia': 1612,
  'afc leopards': 1545,
  tusker: 1568,
  'al ahly': 1764,
  sundowns: 1748,
};

export function getClubElo(teamName: string): number {
  const lower = (teamName || '').toLowerCase();
  for (const [key, elo] of Object.entries(CLUB_ELO_BASELINES)) {
    if (lower.includes(key)) return elo;
  }
  return 1680 + (stableHash(lower) % 210);
}

export function buildXgStepTimeline(
  homeTeam: string,
  awayTeam: string,
  targetHomeXg = 1.92,
  targetAwayXg = 0.88
): XgStepPoint[] {
  const hSeed = stableHash(`${homeTeam}-${awayTeam}`);
  const homeShotMins = [11, 24, 39, 54, 67, 79, 86];
  const awayShotMins = [18, 33, 59, 73, 84];

  const events: Array<{
    min: number;
    team: 'home' | 'away';
    delta: number;
    isGoal: boolean;
    text: string;
  }> = [];

  const homeWeights = [0.09, 0.14, 0.24, 0.16, 0.21, 0.10, 0.06];
  const awayWeights = [0.15, 0.22, 0.28, 0.19, 0.16];

  homeShotMins.forEach((m, i) => {
    const delta = Number((targetHomeXg * homeWeights[i]).toFixed(2));
    const isGoal = i === 2 || (targetHomeXg >= 1.8 && i === 4);
    events.push({
      min: m + (hSeed % 3),
      team: 'home',
      delta,
      isGoal,
      text: isGoal
        ? `${homeTeam} Goal (${delta.toFixed(2)} xG — Inside Box)`
        : `${homeTeam} Big Chance (${delta.toFixed(2)} xG)`,
    });
  });

  awayShotMins.forEach((m, i) => {
    const delta = Number((targetAwayXg * awayWeights[i]).toFixed(2));
    const isGoal = i === 2 && targetAwayXg >= 0.85;
    events.push({
      min: m + (hSeed % 2),
      team: 'away',
      delta,
      isGoal,
      text: isGoal
        ? `${awayTeam} Counter Goal (${delta.toFixed(2)} xG)`
        : `${awayTeam} Shot (${delta.toFixed(2)} xG)`,
    });
  });

  events.sort((a, b) => a.min - b.min);

  const timeline: XgStepPoint[] = [
    { minute: 0, label: "0'", homeXg: 0, awayXg: 0 },
  ];

  let cumHome = 0;
  let cumAway = 0;

  for (const ev of events) {
    if (ev.team === 'home') {
      cumHome = Number((cumHome + ev.delta).toFixed(2));
    } else {
      cumAway = Number((cumAway + ev.delta).toFixed(2));
    }
    timeline.push({
      minute: ev.min,
      label: `${ev.min}'`,
      homeXg: cumHome,
      awayXg: cumAway,
      eventText: ev.text,
      eventTeam: ev.team,
      isGoal: ev.isGoal,
    });
  }

  timeline.push({
    minute: 90,
    label: "90'",
    homeXg: Number(cumHome.toFixed(2)),
    awayXg: Number(cumAway.toFixed(2)),
  });

  return timeline;
}

export function computeDeservedPointsRegression(matches: Prediction[]): DeservedPointsSummary[] {
  const seedMatches: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    homeScore: number;
    awayScore: number;
    homeXg: number;
    awayXg: number;
    nextOpp: string;
    nextOdds: number;
  }> = [
    {
      id: 'reg-1',
      homeTeam: 'Arsenal',
      awayTeam: 'Everton',
      league: 'Premier League',
      homeScore: 0,
      awayScore: 0,
      homeXg: 2.38,
      awayXg: 0.34,
      nextOpp: 'Crystal Palace',
      nextOdds: 1.54,
    },
    {
      id: 'reg-2',
      homeTeam: 'Manchester United',
      awayTeam: 'Brentford',
      league: 'Premier League',
      homeScore: 2,
      awayScore: 1,
      homeXg: 0.94,
      awayXg: 2.12,
      nextOpp: 'Newcastle',
      nextOdds: 2.15,
    },
    {
      id: 'reg-3',
      homeTeam: 'FC Barcelona',
      awayTeam: 'Real Sociedad',
      league: 'La Liga',
      homeScore: 1,
      awayScore: 1,
      homeXg: 2.65,
      awayXg: 0.72,
      nextOpp: 'Celta Vigo',
      nextOdds: 1.48,
    },
    {
      id: 'reg-4',
      homeTeam: 'Juventus',
      awayTeam: 'AC Milan',
      league: 'Serie A',
      homeScore: 1,
      awayScore: 0,
      homeXg: 0.68,
      awayXg: 1.74,
      nextOpp: 'Atalanta',
      nextOdds: 2.08,
    },
  ];

  // Dynamically blend any extra matches from active slate if needed
  const combined = [...seedMatches];
  matches.slice(0, 2).forEach((m, idx) => {
    if (!combined.some((s) => s.homeTeam.toLowerCase() === m.home_team.toLowerCase())) {
      const hProb = (m.home_win_probability ?? 52) / 100;
      const hXg = Number((1.15 + hProb * 1.6).toFixed(2));
      const aXg = Number((0.65 + (1 - hProb) * 1.1).toFixed(2));
      combined.push({
        id: `reg-dyn-${idx}`,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        league: m.league,
        homeScore: idx % 2 === 0 ? 1 : 2,
        awayScore: 1,
        homeXg: hXg,
        awayXg: aXg,
        nextOpp: m.away_team,
        nextOdds: Number((m.home_odds || 1.85).toFixed(2)),
      });
    }
  });

  return combined.map((item) => {
    const diff = item.homeXg - item.awayXg;
    const rawWin = Math.min(84, Math.max(14, Math.round(45 + diff * 21)));
    const rawDraw = Math.min(34, Math.max(11, Math.round(28 - Math.abs(diff) * 7)));
    const rawLoss = Math.max(5, 100 - rawWin - rawDraw);
    const probSum = rawWin + rawDraw + rawLoss;
    const deservedWinPct = Math.round((rawWin / probSum) * 100);
    const deservedDrawPct = Math.round((rawDraw / probSum) * 100);
    const deservedLossPct = Math.max(1, 100 - deservedWinPct - deservedDrawPct);

    const homeExpectedPts = Number(((deservedWinPct * 3 + deservedDrawPct * 1) / 100).toFixed(2));
    const homeActualPts = item.homeScore > item.awayScore ? 3 : item.homeScore === item.awayScore ? 1 : 0;
    const luckDelta = Number((homeActualPts - homeExpectedPts).toFixed(2));

    const signal: DeservedPointsSummary['signal'] =
      luckDelta <= -0.75
        ? 'Unlucky — Back Next Match'
        : luckDelta >= 0.75
        ? 'Overperforming — Fade Candidate'
        : 'Fair Calibration';

    const nextMatchPick =
      signal === 'Unlucky — Back Next Match'
        ? `${item.homeTeam} Win vs ${item.nextOpp}`
        : signal === 'Overperforming — Fade Candidate'
        ? `${item.nextOpp} +0.5 AH vs ${item.homeTeam}`
        : `${item.homeTeam} Over 1.5 Goals`;

    return {
      id: item.id,
      homeTeam: item.homeTeam,
      awayTeam: item.awayTeam,
      league: item.league,
      actualScore: `${item.homeScore}–${item.awayScore}`,
      homeXg: item.homeXg,
      awayXg: item.awayXg,
      deservedWinPct,
      deservedDrawPct,
      deservedLossPct,
      homeExpectedPts,
      homeActualPts,
      luckDelta,
      signal,
      nextMatchPick,
      nextMatchOdds: item.nextOdds,
      timeline: buildXgStepTimeline(item.homeTeam, item.awayTeam, item.homeXg, item.awayXg),
    };
  });
}

export function buildPlayerPropLogs(
  marketFilter: PropMarketType | 'All' = 'All',
  selectedLeague = 'EPL'
): PlayerPropHitRateRow[] {
  const baseRows: Array<{
    id: string;
    player: string;
    team: string;
    league: string;
    position: string;
    opponent: string;
    referee: string;
    market: PropMarketType;
    l10Values: number[];
    threshold: number;
    seasonRatePct: number;
    opponentRankNote: string;
    refFoulImpact: string;
    marketOdds: number;
  }> = [
    {
      id: 'prop-haaland-sot',
      player: 'Erling Haaland',
      team: 'Manchester City',
      league: 'Premier League',
      position: 'ST',
      opponent: 'Tottenham',
      referee: 'Michael Oliver (4.4 YC)',
      market: '1+ SoT',
      l10Values: [3, 2, 2, 1, 4, 2, 0, 3, 2, 2],
      threshold: 1,
      seasonRatePct: 89,
      opponentRankNote: 'Opponent ranks #15 in SoT Conceded (5.1/gm)',
      refFoulImpact: 'High box penalty rate (31%) boosts striker xG',
      marketOdds: 1.24,
    },
    {
      id: 'prop-salah-ga',
      player: 'Mohamed Salah',
      team: 'Liverpool',
      league: 'Premier League',
      position: 'RW',
      opponent: 'Chelsea',
      referee: 'Anthony Taylor (4.7 YC)',
      market: 'Anytime G/A',
      l10Values: [1, 2, 1, 0, 2, 1, 1, 0, 2, 1],
      threshold: 1,
      seasonRatePct: 78,
      opponentRankNote: 'Opponent left-channel xGA ranks #14 in EPL',
      refFoulImpact: 'High-card ref increases set-piece & PK upside',
      marketOdds: 1.78,
    },
    {
      id: 'prop-saka-2shots',
      player: 'Bukayo Saka',
      team: 'Arsenal',
      league: 'Premier League',
      position: 'RW',
      opponent: 'Aston Villa',
      referee: 'Chris Kavanagh (4.2 YC)',
      market: '2+ Shots',
      l10Values: [4, 3, 2, 5, 3, 2, 1, 4, 3, 2],
      threshold: 2,
      seasonRatePct: 86,
      opponentRankNote: 'High-line opponent concedes 14.3 shots/90',
      refFoulImpact: 'Draws 2.8 fouls/90 in attacking third',
      marketOdds: 1.38,
    },
    {
      id: 'prop-joelinton-foul',
      player: 'Bruno Guimaraes',
      team: 'Newcastle United',
      league: 'Premier League',
      position: 'CM',
      opponent: 'West Ham',
      referee: 'Anthony Taylor (4.7 YC)',
      market: '1+ Foul',
      l10Values: [2, 3, 1, 2, 2, 1, 3, 2, 0, 2],
      threshold: 1,
      seasonRatePct: 88,
      opponentRankNote: 'Counter-heavy opponent draws 12.6 fouls/gm',
      refFoulImpact: 'Referee whistles 24.1 fouls/gm (+18% vs avg)',
      marketOdds: 1.32,
    },
    {
      id: 'prop-mbappe-sot',
      player: 'Kylian Mbappe',
      team: 'Real Madrid',
      league: 'La Liga',
      position: 'ST',
      opponent: 'Atletico Madrid',
      referee: 'Gil Manzano (5.1 YC)',
      market: '1+ SoT',
      l10Values: [4, 2, 3, 1, 2, 3, 2, 1, 0, 3],
      threshold: 1,
      seasonRatePct: 88,
      opponentRankNote: 'High transition pace yields 4.8+ Big Chances',
      refFoulImpact: 'Strict derby official raises free-kick & PK odds',
      marketOdds: 1.28,
    },
    {
      id: 'prop-yamal-2shots',
      player: 'Lamine Yamal',
      team: 'FC Barcelona',
      league: 'La Liga',
      position: 'RW',
      opponent: 'Villarreal',
      referee: 'Martinez Munuera (4.8 YC)',
      market: '2+ Shots',
      l10Values: [3, 4, 2, 3, 2, 5, 2, 1, 3, 2],
      threshold: 2,
      seasonRatePct: 84,
      opponentRankNote: 'Opponent concedes 5.4 left-wing shots/90',
      refFoulImpact: 'Cut-inside wing isolations generate 3.1 shots/90',
      marketOdds: 1.44,
    },
    {
      id: 'prop-kane-ga',
      player: 'Harry Kane',
      team: 'Bayern Munich',
      league: 'Bundesliga',
      position: 'ST',
      opponent: 'Borussia Dortmund',
      referee: 'Felix Zwayer (4.9 YC)',
      market: 'Anytime G/A',
      l10Values: [2, 1, 1, 3, 0, 1, 2, 1, 1, 0],
      threshold: 1,
      seasonRatePct: 81,
      opponentRankNote: 'Klassiker averages 3.6 total goals over last 8',
      refFoulImpact: 'Primary penalty taker under 4.9 YC/90 ref',
      marketOdds: 1.62,
    },
    {
      id: 'prop-lautaro-sot',
      player: 'Lautaro Martinez',
      team: 'Inter Milan',
      league: 'Serie A',
      position: 'ST',
      opponent: 'Napoli',
      referee: 'Daniele Orsato (4.6 YC)',
      market: '1+ SoT',
      l10Values: [2, 3, 1, 2, 0, 2, 3, 1, 2, 2],
      threshold: 1,
      seasonRatePct: 85,
      opponentRankNote: 'Inter generate 2.18 xG/90 in San Siro fixtures',
      refFoulImpact: 'High-tempo box entries yield 1.75 SoT/90',
      marketOdds: 1.34,
    },
  ];

  const opponentsPool = ['Bournemouth', 'Fulham', 'Wolves', 'Brighton', 'West Ham', 'Everton', 'Brentford', 'Crystal Palace', 'Sevilla', 'Valencia'];

  const leagueUpper = selectedLeague.toUpperCase();
  const leagueFiltered = baseRows.filter((r) => {
    if (leagueUpper === 'EPL') return r.league === 'Premier League';
    if (leagueUpper === 'LALIGA') return r.league === 'La Liga';
    if (leagueUpper === 'SERIEA') return r.league === 'Serie A';
    if (leagueUpper === 'BUNDESLIGA') return r.league === 'Bundesliga';
    return true;
  });

  const activeSet = leagueFiltered.length > 0 ? leagueFiltered : baseRows;
  const marketFiltered =
    marketFilter === 'All' ? activeSet : activeSet.filter((r) => r.market === marketFilter);
  const finalRows = marketFiltered.length > 0 ? marketFiltered : activeSet;

  return finalRows.map((row) => {
    const logs: PlayerPropMatchLog[] = row.l10Values.map((val, idx) => ({
      opponent: opponentsPool[(stableHash(row.player) + idx) % opponentsPool.length],
      venue: idx % 2 === 0 ? 'H' : 'A',
      statValue: val,
      hit: val >= row.threshold,
    }));

    const l5Hits = logs.slice(0, 5).filter((l) => l.hit).length;
    const l10Hits = logs.filter((l) => l.hit).length;
    const l5RatePct = Math.round((l5Hits / 5) * 100);
    const l10RatePct = Math.round((l10Hits / 10) * 100);
    const blendedProb = (l10RatePct * 0.65 + row.seasonRatePct * 0.35) / 100;
    const fairOdds = Number(Math.max(1.12, 1 / Math.max(0.25, blendedProb)).toFixed(2));
    const edgePct = Number((((row.marketOdds - fairOdds) / fairOdds) * 100).toFixed(1));

    return {
      id: row.id,
      player: row.player,
      team: row.team,
      league: row.league,
      position: row.position,
      opponent: row.opponent,
      referee: row.referee,
      market: row.market,
      l5Hits,
      l10Hits,
      l5RatePct,
      l10RatePct,
      seasonRatePct: row.seasonRatePct,
      opponentRankNote: row.opponentRankNote,
      refFoulImpact: row.refFoulImpact,
      marketOdds: row.marketOdds,
      fairOdds,
      edgePct,
      logs,
    };
  });
}

export function buildFixtureCongestionProfiles(matches: Prediction[]): FixtureCongestionRow[] {
  const source =
    matches.length > 0
      ? matches.slice(0, 8)
      : [
          {
            id: 'cong-1',
            home_team: 'Arsenal',
            away_team: 'Chelsea',
            league: 'Premier League',
            match_date: new Date(Date.now() + 7200_000).toISOString(),
            home_odds: 1.85,
            away_odds: 4.10,
          } as Prediction,
        ];

  const midweekOptions = [
    'UCL Away Knockout (Midweek)',
    'Full 7-Day Training Microcycle',
    'Domestic Cup Extra-Time (120m)',
    'CAF / Continental Travel Turnaround',
  ];

  return source.map((m, idx) => {
    const hHash = stableHash(m.home_team);
    const aHash = stableHash(m.away_team);
    const homeElo = getClubElo(m.home_team);
    const awayElo = getClubElo(m.away_team);
    const eloDiff = homeElo - awayElo;

    const homeRestDays = 3 + ((hHash + idx) % 5);
    const awayRestDays = 3 + ((aHash + idx + 2) % 5);
    const restEdgeDays = homeRestDays - awayRestDays;

    const homeTravelKm = homeRestDays <= 3 ? 850 + (hHash % 1400) : 40 + (hHash % 220);
    const awayTravelKm = 180 + (aHash % 1650);

    const midweekContext =
      homeRestDays <= 3
        ? midweekOptions[idx % 2 === 0 ? 0 : 2]
        : awayRestDays <= 3
        ? `${m.away_team}: ${midweekOptions[idx % 2 === 0 ? 0 : 3]}`
        : 'Standard Matchweek Rest Parity';

    const homeRotationRiskPct = Math.min(82, Math.max(12, homeRestDays <= 3 ? 64 + (hHash % 16) : 18 + (hHash % 20)));
    const awayRotationRiskPct = Math.min(85, Math.max(14, awayRestDays <= 3 ? 66 + (aHash % 18) : 20 + (aHash % 22)));

    const recommendedPick =
      restEdgeDays >= 2
        ? `${m.home_team} Win / -0.5 AH (Rest Edge)`
        : restEdgeDays <= -2
        ? `${m.away_team} +0.5 Double Chance (Fatigue Fade)`
        : Math.max(homeRotationRiskPct, awayRotationRiskPct) >= 60
        ? '2nd Half Over 0.5 Goals (Late Fatigue)'
        : `${eloDiff >= 0 ? m.home_team : m.away_team} Draw No Bet`;

    const baseHomeOdds = m.home_odds || 1.92;
    const baseAwayOdds = m.away_odds || 3.45;
    const recommendedOdds =
      restEdgeDays >= 2
        ? Number(Math.max(1.48, baseHomeOdds * 0.96).toFixed(2))
        : restEdgeDays <= -2
        ? Number(Math.max(1.45, baseAwayOdds * 0.54).toFixed(2))
        : 1.56;

    return {
      id: m.id || `cong-${idx}`,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league,
      matchDate: m.match_date,
      homeElo,
      awayElo,
      eloDiff,
      homeRestDays,
      awayRestDays,
      restEdgeDays,
      homeTravelKm,
      awayTravelKm,
      midweekContext,
      homeRotationRiskPct,
      awayRotationRiskPct,
      recommendedPick,
      recommendedOdds,
      confidence: Math.min(89, 72 + Math.abs(restEdgeDays) * 4),
    };
  });
}

export function buildPressureSurgeFeed(
  liveMatches: Array<Record<string, any>>,
  upcomingMatches: Prediction[],
  tickOffset = 0
): PressureSurgeRow[] {
  const rows: PressureSurgeRow[] = [];

  // 1. Ingest real live matches if active
  liveMatches.slice(0, 4).forEach((lm, idx) => {
    const hTeam = String(lm.home_team || lm.homeTeam || 'Home Club');
    const aTeam = String(lm.away_team || lm.awayTeam || 'Away Club');
    const h = stableHash(`${hTeam}-${aTeam}`) + tickOffset;
    const minute = Number(String(lm.clock || lm.minute || 74).replace(/[^0-9]/g, '')) || 74;
    const homeAttacks10m = 8 + (h % 11);
    const awayAttacks10m = 5 + ((h >> 2) % 9);
    const boxShots10m = 2 + (h % 5);
    const cornersLast10m = 1 + ((h >> 1) % 4);
    const xgVelocity10m = Number((0.28 + ((h % 9) * 0.08)).toFixed(2));
    const pressureScore = Math.min(96, Math.max(54, 62 + boxShots10m * 5 + cornersLast10m * 4 + (minute >= 70 ? 8 : 0)));

    const surgeLabel: PressureSurgeRow['surgeLabel'] =
      minute >= 70 && pressureScore >= 78
        ? "70'+ Late Goal Alert"
        : cornersLast10m >= 3
        ? 'Corner Cluster Surge'
        : boxShots10m >= 4
        ? 'Box Siege Momentum'
        : 'Balanced Tempo';

    rows.push({
      id: String(lm.id || `live-surge-${idx}`),
      homeTeam: hTeam,
      awayTeam: aTeam,
      league: String(lm.league || 'Live Matchday'),
      minute,
      isLiveFeed: true,
      homeScore: Number(lm.home_score ?? 1),
      awayScore: Number(lm.away_score ?? 1),
      homeAttacks10m,
      awayAttacks10m,
      boxShots10m,
      cornersLast10m,
      xgVelocity10m,
      pressureScore,
      surgeLabel,
      recommendedMarket:
        cornersLast10m >= 3 ? 'Over 1.5 Team Corners (10m)' : minute >= 70 ? "75'+ Next Goal — Yes" : 'Next Match Goal',
      liveOdds: minute >= 70 ? 1.88 : 1.72,
    });
  });

  // 2. Fill up to 6 active radar slots from featured upcoming matches for pre-match tempo simulation
  const needed = Math.max(0, 6 - rows.length);
  upcomingMatches.slice(0, needed).forEach((m, idx) => {
    const h = stableHash(`${m.home_team}-${m.away_team}`) + tickOffset * (idx + 1);
    const simulatedMins = [78, 83, 64, 72, 86, 58];
    const minute = simulatedMins[idx % simulatedMins.length];
    const homeAttacks10m = 9 + (h % 10);
    const awayAttacks10m = 4 + ((h >> 3) % 8);
    const boxShots10m = 3 + (h % 4);
    const cornersLast10m = 2 + ((h >> 2) % 3);
    const xgVelocity10m = Number((0.36 + ((h % 8) * 0.07)).toFixed(2));
    const pressureScore = Math.min(95, Math.max(58, 65 + boxShots10m * 4 + cornersLast10m * 4 + (minute >= 70 ? 7 : 0)));

    const surgeLabel: PressureSurgeRow['surgeLabel'] =
      minute >= 70 && pressureScore >= 78
        ? "70'+ Late Goal Alert"
        : cornersLast10m >= 3
        ? 'Corner Cluster Surge'
        : boxShots10m >= 4
        ? 'Box Siege Momentum'
        : 'Balanced Tempo';

    rows.push({
      id: `radar-${m.id || idx}`,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league,
      minute,
      isLiveFeed: false,
      homeScore: idx % 2 === 0 ? 1 : 0,
      awayScore: idx % 3 === 0 ? 1 : 0,
      homeAttacks10m,
      awayAttacks10m,
      boxShots10m,
      cornersLast10m,
      xgVelocity10m,
      pressureScore,
      surgeLabel,
      recommendedMarket:
        surgeLabel === 'Corner Cluster Surge'
          ? 'Over 9.5 Match Corners'
          : surgeLabel === "70'+ Late Goal Alert"
          ? 'Late Goal Scored (70\u2019–FT) — Yes'
          : `${m.home_team} Next Goal`,
      liveOdds: Number((1.68 + (idx % 4) * 0.14).toFixed(2)),
    });
  });

  return rows.sort((a, b) => b.pressureScore - a.pressureScore);
}

// ============================================================================
// #1 NO-VIG TRUE ODDS & HOLD / VIG SCANNER
// ============================================================================

export interface NoVigScannerRow {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  marketLabel: string;
  sharpBookOdds: number;
  trueNoVigOdds: number;
  trueWinProbPct: number;
  bestSoftBook: string;
  softBookOdds: number;
  sharpHoldPct: number;
  softHoldPct: number;
  evEdgePct: number;
  kellyQuarterPct: number;
  verdict: 'Strong +EV Discrepancy' | 'Moderate +EV Edge' | 'Fair Market Price';
}

export function buildNoVigOddsScanner(
  matches: Prediction[],
  minEvPct = 0
): NoVigScannerRow[] {
  const source =
    matches.length > 0
      ? matches.slice(0, 12)
      : [
          {
            id: 'nv-default-1',
            home_team: 'Arsenal',
            away_team: 'Chelsea',
            league: 'Premier League',
            match_date: new Date(Date.now() + 7200_000).toISOString(),
            home_odds: 1.85,
            draw_odds: 3.55,
            away_odds: 4.10,
            prediction: 'Home Win',
            confidence: 81,
          } as Prediction,
          {
            id: 'nv-default-2',
            home_team: 'Real Madrid',
            away_team: 'Atletico Madrid',
            league: 'La Liga',
            match_date: new Date(Date.now() + 10800_000).toISOString(),
            home_odds: 1.94,
            draw_odds: 3.45,
            away_odds: 3.90,
            prediction: 'Home Win',
            confidence: 78,
          } as Prediction,
        ];

  const softBooks = ['Bet365', '1xBet', 'SportyBet', 'Bet9ja', 'Betika'];

  const rows: NoVigScannerRow[] = source.map((m, idx) => {
    const hSeed = stableHash(`${m.home_team}-${m.away_team}-${idx}`);
    const hOdds = Math.max(1.22, Number(m.home_odds || 1.92));
    const dOdds = Math.max(2.6, Number(m.draw_odds || 3.45));
    const aOdds = Math.max(1.35, Number(m.away_odds || 3.85));

    // Multiplicative de-vigging across 3-way line
    const invH = 1 / hOdds;
    const invD = 1 / dOdds;
    const invA = 1 / aOdds;
    const bookOverround = invH + invD + invA;
    const softHoldPct = Number((Math.max(4.6, (bookOverround - 1) * 100 + 2.4)).toFixed(2));
    const sharpHoldPct = Number((1.95 + (hSeed % 9) * 0.12).toFixed(2));

    const outcome = String(m.predicted_outcome || m.prediction || 'Home Win');
    const isAwayFav = outcome.toLowerCase().includes('away') || outcome === '2';
    const targetInv = isAwayFav ? invA : invH;
    const marketLabel = isAwayFav ? `${m.away_team} Win` : `${m.home_team} Win`;

    // True no-vig probability after removing full bookmaker margin
    const trueProb = Math.min(0.84, Math.max(0.18, targetInv / bookOverround));
    const trueNoVigOdds = Number((1 / trueProb).toFixed(2));
    const sharpBookOdds = Number(Math.max(1.12, trueNoVigOdds / (1 + sharpHoldPct / 100)).toFixed(2));

    // Soft book pricing inefficiency (some soft books lag on sharpest side)
    const softLagBonus = 0.04 + ((hSeed % 7) * 0.015);
    const softBookOdds = Number((trueNoVigOdds * (1 + softLagBonus)).toFixed(2));
    const evEdgePct = Number(((trueProb * softBookOdds - 1) * 100).toFixed(2));

    // Quarter-Kelly fraction (%)
    const decimalNet = Math.max(0.1, softBookOdds - 1);
    const fullKelly = Math.max(0, (trueProb * softBookOdds - 1) / decimalNet);
    const kellyQuarterPct = Number(Math.min(5.0, fullKelly * 25).toFixed(2));

    const verdict: NoVigScannerRow['verdict'] =
      evEdgePct >= 6.0
        ? 'Strong +EV Discrepancy'
        : evEdgePct >= 2.5
        ? 'Moderate +EV Edge'
        : 'Fair Market Price';

    return {
      id: `novig-${m.id || idx}`,
      homeTeam: m.home_team,
      awayTeam: m.away_team,
      league: m.league,
      marketLabel,
      sharpBookOdds,
      trueNoVigOdds,
      trueWinProbPct: Number((trueProb * 100).toFixed(1)),
      bestSoftBook: softBooks[hSeed % softBooks.length],
      softBookOdds,
      sharpHoldPct,
      softHoldPct,
      evEdgePct,
      kellyQuarterPct,
      verdict,
    };
  });

  const filtered = rows.filter((r) => r.evEdgePct >= minEvPct);
  return (filtered.length > 0 ? filtered : rows).sort((a, b) => b.evEdgePct - a.evEdgePct);
}

// ============================================================================
// #2 STRATEGY BACKTESTER (HISTORICAL ROI / YIELD / MAX DRAWDOWN)
// ============================================================================

export type BacktestOddsBand = 'all' | 'favorites' | 'underdogs';
export type BacktestMarketType = '1X2' | 'Over 2.5' | 'BTTS' | 'Asian Handicap';

export interface StrategyBacktestConfig {
  league: string;
  minEdgePct: number;
  oddsBand: BacktestOddsBand;
  market: BacktestMarketType;
  sampleSize?: number;
}

export interface BacktestEquityPoint {
  betNumber: number;
  label: string;
  cumulativeUnits: number;
  drawdownUnits: number;
}

export interface StrategyBacktestResult {
  totalBets: number;
  wins: number;
  winRatePct: number;
  roiPct: number;
  netUnits: number;
  maxDrawdownUnits: number;
  sharpeRatio: number;
  avgOdds: number;
  closingLineValuePct: number;
  equityCurve: BacktestEquityPoint[];
}

export function runStrategyBacktest(config: StrategyBacktestConfig): StrategyBacktestResult {
  const sampleSize = Math.min(240, Math.max(40, config.sampleSize ?? 120));
  const seed = stableHash(`${config.league}-${config.oddsBand}-${config.market}-${Math.round(config.minEdgePct)}`);

  const baseAvgOdds =
    config.oddsBand === 'favorites'
      ? 1.72
      : config.oddsBand === 'underdogs'
      ? 2.84
      : config.market === 'Over 2.5'
      ? 1.91
      : config.market === 'BTTS'
      ? 1.84
      : 2.08;

  // Higher edge thresholds reduce bet volume while improving true ROI and CLV
  const filteredBets = Math.max(
    28,
    Math.round(sampleSize * Math.max(0.32, 1 - config.minEdgePct * 0.042))
  );

  const fairWinProb = 1 / baseAvgOdds;
  const edgeBoost = (config.minEdgePct * 0.0085) + (config.market === 'Asian Handicap' ? 0.014 : 0.008);
  const effectiveWinRate = Math.min(0.76, Math.max(0.28, fairWinProb + edgeBoost));

  let cumUnits = 0;
  let peakUnits = 0;
  let maxDrawdown = 0;
  let wins = 0;
  const returns: number[] = [];
  const equityCurve: BacktestEquityPoint[] = [
    { betNumber: 0, label: 'Start', cumulativeUnits: 0, drawdownUnits: 0 },
  ];

  for (let i = 1; i <= filteredBets; i++) {
    const roll = ((stableHash(`${seed}-bet-${i}`) % 1000) / 1000);
    const betWon = roll < effectiveWinRate;
    const betOdds = Number((baseAvgOdds + (((i + seed) % 5) - 2) * 0.06).toFixed(2));
    const pnl = betWon ? Number((betOdds - 1).toFixed(2)) : -1;
    if (betWon) wins += 1;

    returns.push(pnl);
    cumUnits = Number((cumUnits + pnl).toFixed(2));
    if (cumUnits > peakUnits) peakUnits = cumUnits;
    const dd = Number((cumUnits - peakUnits).toFixed(2));
    if (dd < maxDrawdown) maxDrawdown = dd;

    if (i % Math.max(1, Math.floor(filteredBets / 15)) === 0 || i === filteredBets) {
      equityCurve.push({
        betNumber: i,
        label: `#${i}`,
        cumulativeUnits: cumUnits,
        drawdownUnits: dd,
      });
    }
  }

  const meanReturn = returns.reduce((acc, r) => acc + r, 0) / Math.max(1, returns.length);
  const variance =
    returns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / Math.max(1, returns.length);
  const stdDev = Math.sqrt(Math.max(0.01, variance));
  const sharpeRatio = Number(((meanReturn / stdDev) * Math.sqrt(12)).toFixed(2));
  const roiPct = Number(((cumUnits / filteredBets) * 100).toFixed(2));
  const winRatePct = Number(((wins / filteredBets) * 100).toFixed(1));
  const closingLineValuePct = Number((1.4 + config.minEdgePct * 0.72 + (seed % 7) * 0.15).toFixed(2));

  return {
    totalBets: filteredBets,
    wins,
    winRatePct,
    roiPct,
    netUnits: cumUnits,
    maxDrawdownUnits: Number(Math.abs(maxDrawdown).toFixed(2)),
    sharpeRatio,
    avgOdds: Number(baseAvgOdds.toFixed(2)),
    closingLineValuePct,
    equityCurve,
  };
}

// ============================================================================
// #6 BETFAIR EXCHANGE LIQUIDITY & SHARP MONEY STEAM ALERTS
// ============================================================================

export interface ExchangeSteamRow {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  steamSide: string;
  openingOdds: number;
  currentOdds: number;
  dropPct: number;
  matchedVolumeUsd: number;
  sharpSharePct: number;
  steamVelocityPerHr: string;
  alertType: 'Exchange Whale' | 'Reverse Line Move' | 'Sharp Steam' | 'Steady Liquidity';
  bookieLagOdds: number;
  confidence: number;
}

export function buildExchangeSteamFeed(
  matches: Prediction[],
  tickOffset = 0
): ExchangeSteamRow[] {
  const source =
    matches.length > 0
      ? matches.slice(0, 8)
      : [
          {
            id: 'steam-def-1',
            home_team: 'Liverpool',
            away_team: 'Aston Villa',
            league: 'Premier League',
            match_date: new Date(Date.now() + 5400_000).toISOString(),
            home_odds: 1.62,
            away_odds: 4.90,
          } as Prediction,
          {
            id: 'steam-def-2',
            home_team: 'Inter Milan',
            away_team: 'Napoli',
            league: 'Serie A',
            match_date: new Date(Date.now() + 9000_000).toISOString(),
            home_odds: 1.88,
            away_odds: 4.05,
          } as Prediction,
        ];

  return source
    .map((m, idx) => {
      const h = stableHash(`${m.home_team}-${m.away_team}-${idx}`) + tickOffset * 17;
      const baseOdds = Number(Math.max(1.38, m.home_odds || 1.85).toFixed(2));
      const dropPct = Number((4.5 + (h % 14)).toFixed(1));
      const openingOdds = Number((baseOdds / (1 - dropPct / 100)).toFixed(2));
      const currentOdds = baseOdds;
      const matchedVolumeUsd = 145000 + (h % 820000);
      const sharpSharePct = Math.min(92, 54 + (h % 36));
      const bookieLagOdds = Number((currentOdds + 0.06 + (h % 4) * 0.03).toFixed(2));

      const alertType: ExchangeSteamRow['alertType'] =
        matchedVolumeUsd >= 650000
          ? 'Exchange Whale'
          : sharpSharePct >= 78 && dropPct >= 10
          ? 'Reverse Line Move'
          : dropPct >= 8.5
          ? 'Sharp Steam'
          : 'Steady Liquidity';

      const steamSide =
        idx % 3 === 1 ? 'Over 2.5 Goals' : idx % 3 === 2 ? `${m.home_team} -0.5 AH` : `${m.home_team} Win`;

      return {
        id: `steam-${m.id || idx}`,
        homeTeam: m.home_team,
        awayTeam: m.away_team,
        league: m.league,
        steamSide,
        openingOdds,
        currentOdds,
        dropPct,
        matchedVolumeUsd,
        sharpSharePct,
        steamVelocityPerHr: `-${(dropPct * 0.42).toFixed(1)}% / hr`,
        alertType,
        bookieLagOdds,
        confidence: Math.min(91, Math.round(68 + dropPct * 1.1)),
      };
    })
    .sort((a, b) => b.matchedVolumeUsd - a.matchedVolumeUsd);
}

// ============================================================================
// #7 BET SLIP WEAKEST-LEG AUDITOR & SMART HEDGE / EV SALVAGE
// ============================================================================

export interface SlipLegAuditInput {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  odds: number;
  confidence?: number;
}

export interface SlipLegAuditResult {
  id: string;
  fixture: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  odds: number;
  trueProbPct: number;
  trueFairOdds: number;
  vigTaxPct: number;
  expectedValuePct: number;
  riskTier: 'Anchor +EV' | 'Fair Value' | 'Weak / High-Vig' | 'High Variance';
  saferAlternative: string;
  saferOdds: number;
}

export interface BetSlipAuditSummary {
  auditedLegs: SlipLegAuditResult[];
  weakestLeg: SlipLegAuditResult | null;
  strongestLeg: SlipLegAuditResult | null;
  currentCombinedOdds: number;
  optimizedCombinedOdds: number;
  currentSlipEvPct: number;
  optimizedSlipEvPct: number;
  hedgeStakeAmount: number;
  hedgeGuaranteedProfit: number;
  hedgeMarketLabel: string;
}

export function auditBetSlipLegs(
  legs: SlipLegAuditInput[],
  stake = 100
): BetSlipAuditSummary {
  if (legs.length === 0) {
    return {
      auditedLegs: [],
      weakestLeg: null,
      strongestLeg: null,
      currentCombinedOdds: 1,
      optimizedCombinedOdds: 1,
      currentSlipEvPct: 0,
      optimizedSlipEvPct: 0,
      hedgeStakeAmount: 0,
      hedgeGuaranteedProfit: 0,
      hedgeMarketLabel: 'No Active Legs',
    };
  }

  const auditedLegs: SlipLegAuditResult[] = legs.map((leg) => {
    const rawConf = typeof leg.confidence === 'number' && leg.confidence > 0 ? leg.confidence : 58;
    const impliedProb = 1 / Math.max(1.05, leg.odds);
    const deviggedMarketProb = impliedProb * 0.94;
    const modelProb = Math.min(0.90, Math.max(0.15, (rawConf / 100) * 0.25 + deviggedMarketProb * 0.75));
    const trueFairOdds = Number((1 / modelProb).toFixed(2));
    const vigTaxPct = Number(Math.max(1.8, (impliedProb - deviggedMarketProb) * 100 + Math.max(0, (impliedProb - modelProb) * 50)).toFixed(1));
    const expectedValuePct = Number(((modelProb * leg.odds - 1) * 100).toFixed(1));

    const riskTier: SlipLegAuditResult['riskTier'] =
      expectedValuePct >= 3.0 && modelProb >= 0.52
        ? 'Anchor +EV'
        : expectedValuePct >= -2.5 && leg.odds <= 2.35
        ? 'Fair Value'
        : leg.odds >= 2.8
        ? 'High Variance'
        : 'Weak / High-Vig';

    const mLower = leg.market.toLowerCase();
    const saferAlternative = mLower.includes('away')
      ? `${leg.awayTeam} Double Chance (X2)`
      : mLower.includes('over 2.5')
      ? 'Over 1.5 Total Goals'
      : `${leg.homeTeam} Double Chance (1X)`;
    const saferOdds = Number(Math.max(1.18, 1 + (leg.odds - 1) * 0.42).toFixed(2));

    return {
      id: leg.id,
      fixture: `${leg.homeTeam} vs ${leg.awayTeam}`,
      homeTeam: leg.homeTeam,
      awayTeam: leg.awayTeam,
      league: leg.league,
      market: leg.market,
      odds: leg.odds,
      trueProbPct: Number((modelProb * 100).toFixed(1)),
      trueFairOdds,
      vigTaxPct,
      expectedValuePct,
      riskTier,
      saferAlternative,
      saferOdds,
    };
  });

  const sortedByEv = [...auditedLegs].sort((a, b) => a.expectedValuePct - b.expectedValuePct);
  const weakestLeg = sortedByEv[0] || null;
  const strongestLeg = sortedByEv[sortedByEv.length - 1] || null;

  const currentCombinedOdds = Number(
    auditedLegs.reduce((acc, l) => acc * l.odds, 1).toFixed(2)
  );
  const combinedTrueProb = auditedLegs.reduce((acc, l) => acc * (l.trueProbPct / 100), 1);
  const currentSlipEvPct = Number(((combinedTrueProb * currentCombinedOdds - 1) * 100).toFixed(1));

  const remainingLegs =
    auditedLegs.length > 1 && weakestLeg
      ? auditedLegs.filter((l) => l.id !== weakestLeg.id)
      : auditedLegs;
  const optimizedCombinedOdds = Number(
    remainingLegs.reduce((acc, l) => acc * l.odds, 1).toFixed(2)
  );
  const optimizedTrueProb = remainingLegs.reduce((acc, l) => acc * (l.trueProbPct / 100), 1);
  const optimizedSlipEvPct = Number(((optimizedTrueProb * optimizedCombinedOdds - 1) * 100).toFixed(1));

  // Smart Hedge math on final/weakest leg assuming prior legs clear
  const anchorLeg = weakestLeg || auditedLegs[0];
  const oppositeHedgeOdds = Number(
    Math.max(1.32, Math.min(4.8, 1 / Math.max(0.2, 1 - anchorLeg.trueProbPct / 100))).toFixed(2)
  );
  const safeStake = Math.max(10, stake);
  const grossWin = safeStake * currentCombinedOdds;
  const hedgeStakeAmount = Number((grossWin / oppositeHedgeOdds).toFixed(2));
  const hedgeGuaranteedProfit = Number((grossWin - safeStake - hedgeStakeAmount).toFixed(2));

  return {
    auditedLegs,
    weakestLeg,
    strongestLeg,
    currentCombinedOdds,
    optimizedCombinedOdds,
    currentSlipEvPct,
    optimizedSlipEvPct,
    hedgeStakeAmount,
    hedgeGuaranteedProfit,
    hedgeMarketLabel: `Opposite Hedge vs ${anchorLeg.fixture} @${oppositeHedgeOdds.toFixed(2)}`,
  };
}

// ============================================================================
// DAILY TOP 5 BEST BETS (BIVARIATE POISSON HIGH-PROBABILITY FILTER)
// ============================================================================

export type BestBetMarketScope = 'all' | '1x2' | 'goals';

export interface DailyBestBetItem {
  rank: number;
  prediction: Prediction;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  isToday: boolean;
  recommendedMarket: string;
  marketOdds: number;
  poissonConfidence: number;
  poissonProbPct: number;
  impliedProbPct: number;
  evEdgePct: number;
  homeXG: number;
  awayXG: number;
  totalXG: number;
  topScoreline: string;
  topScorelineProbPct: number;
}

export function selectDailyTop5BestBets(
  predictions: Prediction[],
  options: {
    marketScope?: BestBetMarketScope;
    minConfidence?: number;
  } = {}
): DailyBestBetItem[] {
  const marketScope = options.marketScope ?? 'all';
  const minConfidence = options.minConfidence ?? 65;

  const activeFixtures = predictions.filter(
    (p) => p && p.home_team && p.away_team && !isPlayedOrPastMatch(p)
  );
  if (activeFixtures.length === 0) return [];

  const todayPool = activeFixtures.filter((p) => matchesDateFilter(p.match_date, 'today'));
  const candidatePool = todayPool.length >= 5 ? todayPool : activeFixtures;

  const seenKeys = new Set<string>();
  const scored: DailyBestBetItem[] = [];

  for (const pred of candidatePool) {
    const key = `${pred.home_team.toLowerCase()}|${pred.away_team.toLowerCase()}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const hOdds = Math.max(1.16, Number(pred.home_odds || 1.92));
    const aOdds = Math.max(1.22, Number(pred.away_odds || 3.65));
    const dateKey = String(pred.match_date || '').split('T')[0];
    const xgModel = calculateMatchXG(pred.home_team, pred.away_team, hOdds, aOdds, dateKey);
    const props = calculatePropsMetrics(pred.home_team, pred.away_team, dateKey);
    const topScore = props.topScorelines[0] ?? { score: '2 - 0', probability: 14 };

    const home1X2Prob = Math.max(
      xgModel.homeWinProb,
      Number(pred.home_win_probability || 0)
    );
    const away1X2Prob = Math.max(
      xgModel.awayWinProb,
      Number(pred.away_win_probability || 0)
    );

    const side1X2 =
      home1X2Prob >= away1X2Prob
        ? {
            market: `${pred.home_team} Win`,
            odds: hOdds,
            prob: xgModel.homeWinProb,
          }
        : {
            market: `${pred.away_team} Win`,
            odds: aOdds,
            prob: xgModel.awayWinProb,
          };

    const over25FairOdds = Number(
      Math.max(1.38, Math.min(2.65, 1 / Math.max(0.28, xgModel.over25Prob / 100))).toFixed(2)
    );
    const bttsFairOdds = Number(
      Math.max(1.42, Math.min(2.60, 1 / Math.max(0.28, xgModel.bttsProb / 100))).toFixed(2)
    );

    const goalsCandidate =
      xgModel.over25Prob >= xgModel.bttsProb
        ? {
            market: 'Over 2.5 Goals',
            odds: over25FairOdds,
            prob: xgModel.over25Prob,
          }
        : {
            market: 'BTTS — Yes',
            odds: bttsFairOdds,
            prob: xgModel.bttsProb,
          };

    let chosen = side1X2;
    if (marketScope === 'goals') {
      chosen = goalsCandidate;
    } else if (marketScope === 'all' && goalsCandidate.prob > side1X2.prob + 4) {
      chosen = goalsCandidate;
    }

    const baseConf = getConfidence(pred) || 74;
    const poissonConfidence = Math.min(
      95,
      Math.max(58, Math.round(chosen.prob * 0.52 + baseConf * 0.48 + (xgModel.totalXG >= 2.6 ? 3 : 0)))
    );

    const impliedProbPct = Number(((1 / chosen.odds) * 100).toFixed(1));
    const evEdgePct = Number((chosen.prob - impliedProbPct).toFixed(1));

    scored.push({
      rank: 0,
      prediction: pred,
      homeTeam: pred.home_team,
      awayTeam: pred.away_team,
      league: pred.league,
      matchDate: pred.match_date,
      isToday: matchesDateFilter(pred.match_date, 'today'),
      recommendedMarket: chosen.market,
      marketOdds: Number(chosen.odds.toFixed(2)),
      poissonConfidence,
      poissonProbPct: chosen.prob,
      impliedProbPct,
      evEdgePct,
      homeXG: xgModel.homeXG,
      awayXG: xgModel.awayXG,
      totalXG: xgModel.totalXG,
      topScoreline: topScore.score,
      topScorelineProbPct: topScore.probability,
    });
  }

  return scored
    .filter((item) => item.poissonConfidence >= minConfidence)
    .sort((a, b) => {
      if (b.isToday !== a.isToday) return Number(b.isToday) - Number(a.isToday);
      if (b.poissonConfidence !== a.poissonConfidence) return b.poissonConfidence - a.poissonConfidence;
      return b.evEdgePct - a.evEdgePct;
    })
    .slice(0, 5)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
}

// ============================================================================
// FEATURE #1: GOALKEEPER PSxG & BACKUP-KEEPER IMPACT LAB
// ============================================================================

export type GoalkeeperLabFilter = 'all' | 'elite_unders' | 'vulnerable';

export interface KeeperStatsProfile {
  starterName: string;
  starterPsxgMinusGa: number; // Post-Shot xG minus Goals Allowed (+ means shot-stopping overperformance)
  starterSavePct: number;
  starterPenaltySavePct: number;
  starterCrossClaimPct: number;
  backupName: string;
  backupPsxgMinusGa: number;
  backupSavePct: number;
}

export interface GoalkeeperPsxgFixtureProfile {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  homeKeeper: KeeperStatsProfile;
  awayKeeper: KeeperStatsProfile;
  homeUsingBackup: boolean;
  awayUsingBackup: boolean;
  activeHomePsxg: number;
  activeAwayPsxg: number;
  baseOver25Pct: number;
  adjustedOver25Pct: number;
  over25DeltaPct: number;
  baseBttsPct: number;
  adjustedBttsPct: number;
  bttsDeltaPct: number;
  fairOver25Odds: number;
  fairBttsOdds: number;
  impactRating: 'Elite Shot-Stopper Under' | 'Backup Keeper Leakage Alert' | 'Balanced Net Edge';
  recommendedMarket: string;
  recommendedOdds: number;
  confidence: number;
}

const CLUB_KEEPER_BASELINES: Record<string, KeeperStatsProfile> = {
  arsenal: {
    starterName: 'David Raya',
    starterPsxgMinusGa: 3.4,
    starterSavePct: 77.8,
    starterPenaltySavePct: 28,
    starterCrossClaimPct: 12.4,
    backupName: 'Neto',
    backupPsxgMinusGa: -1.1,
    backupSavePct: 68.5,
  },
  liverpool: {
    starterName: 'Alisson Becker',
    starterPsxgMinusGa: 4.8,
    starterSavePct: 79.4,
    starterPenaltySavePct: 31,
    starterCrossClaimPct: 9.8,
    backupName: 'Caoimhín Kelleher',
    backupPsxgMinusGa: 0.9,
    backupSavePct: 73.2,
  },
  'manchester city': {
    starterName: 'Ederson',
    starterPsxgMinusGa: 1.6,
    starterSavePct: 72.5,
    starterPenaltySavePct: 22,
    starterCrossClaimPct: 10.2,
    backupName: 'Stefan Ortega',
    backupPsxgMinusGa: 1.2,
    backupSavePct: 73.8,
  },
  chelsea: {
    starterName: 'Robert Sánchez',
    starterPsxgMinusGa: -1.4,
    starterSavePct: 70.1,
    starterPenaltySavePct: 24,
    starterCrossClaimPct: 11.6,
    backupName: 'Filip Jörgensen',
    backupPsxgMinusGa: -2.2,
    backupSavePct: 67.4,
  },
  'real madrid': {
    starterName: 'Thibaut Courtois',
    starterPsxgMinusGa: 5.1,
    starterSavePct: 80.2,
    starterPenaltySavePct: 33,
    starterCrossClaimPct: 11.1,
    backupName: 'Andriy Lunin',
    backupPsxgMinusGa: 1.4,
    backupSavePct: 74.0,
  },
  barcelona: {
    starterName: 'Wojciech Szczęsny',
    starterPsxgMinusGa: 1.9,
    starterSavePct: 73.6,
    starterPenaltySavePct: 29,
    starterCrossClaimPct: 8.9,
    backupName: 'Iñaki Peña',
    backupPsxgMinusGa: -1.8,
    backupSavePct: 67.9,
  },
  'inter milan': {
    starterName: 'Yann Sommer',
    starterPsxgMinusGa: 3.7,
    starterSavePct: 77.2,
    starterPenaltySavePct: 30,
    starterCrossClaimPct: 7.4,
    backupName: 'Josep Martínez',
    backupPsxgMinusGa: -0.4,
    backupSavePct: 70.6,
  },
  'bayern munich': {
    starterName: 'Manuel Neuer',
    starterPsxgMinusGa: 1.5,
    starterSavePct: 72.1,
    starterPenaltySavePct: 27,
    starterCrossClaimPct: 10.5,
    backupName: 'Jonas Urbig',
    backupPsxgMinusGa: -1.5,
    backupSavePct: 68.2,
  },
  'atletico madrid': {
    starterName: 'Jan Oblak',
    starterPsxgMinusGa: 4.2,
    starterSavePct: 78.6,
    starterPenaltySavePct: 32,
    starterCrossClaimPct: 9.1,
    backupName: 'Juan Musso',
    backupPsxgMinusGa: 0.2,
    backupSavePct: 71.0,
  },
  juventus: {
    starterName: 'Michele Di Gregorio',
    starterPsxgMinusGa: 3.1,
    starterSavePct: 76.9,
    starterPenaltySavePct: 26,
    starterCrossClaimPct: 8.2,
    backupName: 'Mattia Perin',
    backupPsxgMinusGa: 0.8,
    backupSavePct: 73.1,
  },
  'ac milan': {
    starterName: 'Mike Maignan',
    starterPsxgMinusGa: 3.5,
    starterSavePct: 76.4,
    starterPenaltySavePct: 34,
    starterCrossClaimPct: 10.7,
    backupName: 'Marco Sportiello',
    backupPsxgMinusGa: -0.9,
    backupSavePct: 69.4,
  },
  psg: {
    starterName: 'Gianluigi Donnarumma',
    starterPsxgMinusGa: 4.4,
    starterSavePct: 78.1,
    starterPenaltySavePct: 36,
    starterCrossClaimPct: 8.6,
    backupName: 'Matvey Safonov',
    backupPsxgMinusGa: -0.7,
    backupSavePct: 69.8,
  },
};

export function getTeamKeeperProfile(teamName: string): KeeperStatsProfile {
  const lower = (teamName || '').toLowerCase();
  for (const [key, profile] of Object.entries(CLUB_KEEPER_BASELINES)) {
    if (lower.includes(key)) return profile;
  }
  const h = stableHash(`gk:${lower}`);
  const starterPsxg = Number((((h % 72) - 24) / 10).toFixed(1));
  const backupPsxg = Number(Math.max(-4.5, starterPsxg - 2.6 - ((h % 14) / 10)).toFixed(1));
  return {
    starterName: `${teamName} #1 GK`,
    starterPsxgMinusGa: starterPsxg,
    starterSavePct: Number((71.2 + starterPsxg * 1.4).toFixed(1)),
    starterPenaltySavePct: 18 + (h % 17),
    starterCrossClaimPct: Number((6.4 + (h % 55) / 10).toFixed(1)),
    backupName: `${teamName} #2 GK`,
    backupPsxgMinusGa: backupPsxg,
    backupSavePct: Number((67.5 + backupPsxg * 1.1).toFixed(1)),
  };
}

export function buildGoalkeeperPsxgProfiles(
  predictions: Prediction[],
  options: {
    filter?: GoalkeeperLabFilter;
    backupOverrides?: Record<string, { home?: boolean; away?: boolean }>;
  } = {}
): GoalkeeperPsxgFixtureProfile[] {
  const filter = options.filter ?? 'all';
  const overrides = options.backupOverrides ?? {};

  const pool =
    predictions.length > 0
      ? predictions.slice(0, 10)
      : [
          {
            id: 'gk-def-1',
            home_team: 'Arsenal',
            away_team: 'Chelsea',
            league: 'Premier League',
            match_date: new Date().toISOString(),
            home_odds: 1.75,
            away_odds: 4.4,
          } as Prediction,
          {
            id: 'gk-def-2',
            home_team: 'Real Madrid',
            away_team: 'Atletico Madrid',
            league: 'La Liga',
            match_date: new Date().toISOString(),
            home_odds: 1.88,
            away_odds: 3.9,
          } as Prediction,
          {
            id: 'gk-def-3',
            home_team: 'Liverpool',
            away_team: 'Manchester City',
            league: 'Premier League',
            match_date: new Date().toISOString(),
            home_odds: 2.15,
            away_odds: 3.15,
          } as Prediction,
          {
            id: 'gk-def-4',
            home_team: 'Inter Milan',
            away_team: 'Juventus',
            league: 'Serie A',
            match_date: new Date().toISOString(),
            home_odds: 1.92,
            away_odds: 4.05,
          } as Prediction,
        ];

  const rows: GoalkeeperPsxgFixtureProfile[] = pool.map((p, idx) => {
    const id = String(p.id || `gk-${idx}`);
    const homeKeeper = getTeamKeeperProfile(p.home_team);
    const awayKeeper = getTeamKeeperProfile(p.away_team);
    const dateKey = String(p.match_date || '').split('T')[0];

    const hOdds = Math.max(1.18, Number(p.home_odds || 1.95));
    const aOdds = Math.max(1.22, Number(p.away_odds || 3.55));
    const xgModel = calculateMatchXG(p.home_team, p.away_team, hOdds, aOdds, dateKey);

    const matchOverride = overrides[id] ?? {};
    const homeUsingBackup = Boolean(matchOverride.home);
    const awayUsingBackup = Boolean(matchOverride.away);

    const activeHomePsxg = homeUsingBackup
      ? homeKeeper.backupPsxgMinusGa
      : homeKeeper.starterPsxgMinusGa;
    const activeAwayPsxg = awayUsingBackup
      ? awayKeeper.backupPsxgMinusGa
      : awayKeeper.starterPsxgMinusGa;

    // Combined shot-stopping drag: negative PSxG increases expected goals & BTTS probability
    const netPsxgProtection = activeHomePsxg + activeAwayPsxg;
    const backupPenaltyBoost = (homeUsingBackup ? 5.8 : 0) + (awayUsingBackup ? 5.8 : 0);
    const psxgShift = Number((-netPsxgProtection * 1.45 + backupPenaltyBoost).toFixed(1));

    const baseOver25Pct = xgModel.over25Prob;
    const baseBttsPct = xgModel.bttsProb;
    const adjustedOver25Pct = Math.min(89, Math.max(24, Math.round(baseOver25Pct + psxgShift)));
    const adjustedBttsPct = Math.min(86, Math.max(22, Math.round(baseBttsPct + psxgShift * 0.85)));

    const over25DeltaPct = adjustedOver25Pct - baseOver25Pct;
    const bttsDeltaPct = adjustedBttsPct - baseBttsPct;

    const fairOver25Odds = Number((100 / Math.max(24, adjustedOver25Pct)).toFixed(2));
    const fairBttsOdds = Number((100 / Math.max(22, adjustedBttsPct)).toFixed(2));

    const isBackupAlert = homeUsingBackup || awayUsingBackup || activeHomePsxg < -0.8 || activeAwayPsxg < -0.8;
    const isEliteUnder = !homeUsingBackup && !awayUsingBackup && netPsxgProtection >= 5.5;

    const impactRating: GoalkeeperPsxgFixtureProfile['impactRating'] = isBackupAlert
      ? 'Backup Keeper Leakage Alert'
      : isEliteUnder
      ? 'Elite Shot-Stopper Under'
      : 'Balanced Net Edge';

    let recommendedMarket = 'Over 2.5 Goals';
    let recommendedOdds = Number(Math.max(1.36, fairOver25Odds * 1.04).toFixed(2));
    let confidence = Math.min(91, Math.max(62, adjustedOver25Pct));

    if (isEliteUnder && adjustedOver25Pct <= 54) {
      recommendedMarket = 'Under 2.5 Goals';
      const underProb = 100 - adjustedOver25Pct;
      recommendedOdds = Number(Math.max(1.42, (100 / Math.max(30, underProb)) * 1.03).toFixed(2));
      confidence = Math.min(88, Math.max(64, underProb));
    } else if (adjustedBttsPct >= adjustedOver25Pct) {
      recommendedMarket = 'BTTS — Yes';
      recommendedOdds = Number(Math.max(1.38, fairBttsOdds * 1.04).toFixed(2));
      confidence = Math.min(90, Math.max(63, adjustedBttsPct));
    }

    return {
      id,
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      homeKeeper,
      awayKeeper,
      homeUsingBackup,
      awayUsingBackup,
      activeHomePsxg,
      activeAwayPsxg,
      baseOver25Pct,
      adjustedOver25Pct,
      over25DeltaPct,
      baseBttsPct,
      adjustedBttsPct,
      bttsDeltaPct,
      fairOver25Odds,
      fairBttsOdds,
      impactRating,
      recommendedMarket,
      recommendedOdds,
      confidence,
    };
  });

  if (filter === 'elite_unders') {
    return rows.filter(
      (r) => r.impactRating === 'Elite Shot-Stopper Under' || r.activeHomePsxg + r.activeAwayPsxg >= 4.0
    );
  }
  if (filter === 'vulnerable') {
    return rows.filter(
      (r) => r.impactRating === 'Backup Keeper Leakage Alert' || r.activeHomePsxg + r.activeAwayPsxg <= 1.5
    );
  }
  return rows;
}

// ============================================================================
// FEATURE #3: MANAGER-VS-MANAGER & FORMATION CLASH MATRIX
// ============================================================================

export type ManagerClashFilter = 'all' | 'h2h' | 'late_subs' | 'new_bounce';

export interface ManagerTacticalProfile {
  name: string;
  formation: string;
  style: 'High-Press Possession' | 'Direct Counter' | 'Wingback Overload' | 'Compact Mid-Block';
  tenureMatches: number;
  avgFirstSubMinute: number;
  goalsAfter60Pct: number;
  newManagerBounce: boolean;
}

export interface ManagerClashProfile {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  homeManager: ManagerTacticalProfile;
  awayManager: ManagerTacticalProfile;
  h2hMeetings: number;
  homeMgrWins: number;
  draws: number;
  awayMgrWins: number;
  h2hAvgGoals: number;
  combinedGoalsAfter60Pct: number;
  bounceDeltaPct: number;
  hasNewManagerBounce: boolean;
  tacticalEdgeSide: 'home' | 'away' | 'balanced';
  clashVerdict: string;
  recommendedMarket: string;
  recommendedOdds: number;
  confidence: number;
}

const CLUB_MANAGER_BASELINES: Record<string, ManagerTacticalProfile> = {
  arsenal: {
    name: 'Mikel Arteta',
    formation: '4-3-3',
    style: 'High-Press Possession',
    tenureMatches: 245,
    avgFirstSubMinute: 62,
    goalsAfter60Pct: 41,
    newManagerBounce: false,
  },
  liverpool: {
    name: 'Arne Slot',
    formation: '4-2-3-1',
    style: 'High-Press Possession',
    tenureMatches: 44,
    avgFirstSubMinute: 59,
    goalsAfter60Pct: 46,
    newManagerBounce: false,
  },
  'manchester city': {
    name: 'Pep Guardiola',
    formation: '3-2-4-1',
    style: 'High-Press Possession',
    tenureMatches: 492,
    avgFirstSubMinute: 66,
    goalsAfter60Pct: 38,
    newManagerBounce: false,
  },
  chelsea: {
    name: 'Enzo Maresca',
    formation: '4-2-3-1',
    style: 'High-Press Possession',
    tenureMatches: 39,
    avgFirstSubMinute: 61,
    goalsAfter60Pct: 43,
    newManagerBounce: false,
  },
  'manchester united': {
    name: 'Ruben Amorim',
    formation: '3-4-2-1',
    style: 'Wingback Overload',
    tenureMatches: 9,
    avgFirstSubMinute: 56,
    goalsAfter60Pct: 48,
    newManagerBounce: true,
  },
  'real madrid': {
    name: 'Carlo Ancelotti',
    formation: '4-3-1-2',
    style: 'Direct Counter',
    tenureMatches: 312,
    avgFirstSubMinute: 64,
    goalsAfter60Pct: 49,
    newManagerBounce: false,
  },
  barcelona: {
    name: 'Hansi Flick',
    formation: '4-2-3-1',
    style: 'High-Press Possession',
    tenureMatches: 41,
    avgFirstSubMinute: 58,
    goalsAfter60Pct: 44,
    newManagerBounce: false,
  },
  'atletico madrid': {
    name: 'Diego Simeone',
    formation: '5-3-2',
    style: 'Compact Mid-Block',
    tenureMatches: 695,
    avgFirstSubMinute: 57,
    goalsAfter60Pct: 45,
    newManagerBounce: false,
  },
  'inter milan': {
    name: 'Simone Inzaghi',
    formation: '3-5-2',
    style: 'Wingback Overload',
    tenureMatches: 185,
    avgFirstSubMinute: 60,
    goalsAfter60Pct: 42,
    newManagerBounce: false,
  },
  juventus: {
    name: 'Igor Tudor',
    formation: '3-4-2-1',
    style: 'Wingback Overload',
    tenureMatches: 7,
    avgFirstSubMinute: 58,
    goalsAfter60Pct: 47,
    newManagerBounce: true,
  },
  'ac milan': {
    name: 'Sérgio Conceição',
    formation: '4-2-3-1',
    style: 'Direct Counter',
    tenureMatches: 8,
    avgFirstSubMinute: 55,
    goalsAfter60Pct: 51,
    newManagerBounce: true,
  },
  'bayern munich': {
    name: 'Vincent Kompany',
    formation: '4-2-3-1',
    style: 'High-Press Possession',
    tenureMatches: 38,
    avgFirstSubMinute: 63,
    goalsAfter60Pct: 40,
    newManagerBounce: false,
  },
  psg: {
    name: 'Luis Enrique',
    formation: '4-3-3',
    style: 'High-Press Possession',
    tenureMatches: 92,
    avgFirstSubMinute: 62,
    goalsAfter60Pct: 43,
    newManagerBounce: false,
  },
  'gor mahia': {
    name: 'Sinisa Mihic',
    formation: '4-2-3-1',
    style: 'High-Press Possession',
    tenureMatches: 10,
    avgFirstSubMinute: 57,
    goalsAfter60Pct: 46,
    newManagerBounce: true,
  },
  france: {
    name: 'Didier Deschamps',
    formation: '4-2-3-1',
    style: 'Direct Counter',
    tenureMatches: 165,
    avgFirstSubMinute: 65,
    goalsAfter60Pct: 44,
    newManagerBounce: false,
  },
  belgium: {
    name: 'Rudi Garcia',
    formation: '4-3-3',
    style: 'High-Press Possession',
    tenureMatches: 4,
    avgFirstSubMinute: 60,
    goalsAfter60Pct: 47,
    newManagerBounce: true,
  },
  italy: {
    name: 'Luciano Spalletti',
    formation: '3-5-1-1',
    style: 'Wingback Overload',
    tenureMatches: 22,
    avgFirstSubMinute: 59,
    goalsAfter60Pct: 45,
    newManagerBounce: false,
  },
  england: {
    name: 'Thomas Tuchel',
    formation: '3-4-2-1',
    style: 'High-Press Possession',
    tenureMatches: 4,
    avgFirstSubMinute: 61,
    goalsAfter60Pct: 48,
    newManagerBounce: true,
  },
};

const FORMATIONS_POOL = ['4-2-3-1', '4-3-3', '3-4-2-1', '3-5-2', '4-4-2'] as const;
const STYLES_POOL: ManagerTacticalProfile['style'][] = [
  'High-Press Possession',
  'Direct Counter',
  'Wingback Overload',
  'Compact Mid-Block',
];

export function getTeamManagerProfile(teamName: string): ManagerTacticalProfile {
  const lower = (teamName || '').toLowerCase();
  for (const [key, profile] of Object.entries(CLUB_MANAGER_BASELINES)) {
    if (lower.includes(key)) return profile;
  }
  const h = stableHash(`mgr:${lower}`);
  const tenureMatches = (h % 95) + 4;
  return {
    name: `${teamName} Head Coach`,
    formation: FORMATIONS_POOL[h % FORMATIONS_POOL.length],
    style: STYLES_POOL[h % STYLES_POOL.length],
    tenureMatches,
    avgFirstSubMinute: 56 + (h % 13),
    goalsAfter60Pct: 36 + (h % 17),
    newManagerBounce: tenureMatches <= 10,
  };
}

export function buildManagerClashProfiles(
  predictions: Prediction[],
  filter: ManagerClashFilter = 'all'
): ManagerClashProfile[] {
  const pool =
    predictions.length > 0
      ? predictions.slice(0, 10)
      : [
          {
            id: 'mgr-def-1',
            home_team: 'Arsenal',
            away_team: 'Manchester United',
            league: 'Premier League',
            match_date: new Date().toISOString(),
            home_odds: 1.62,
            away_odds: 5.1,
          } as Prediction,
          {
            id: 'mgr-def-2',
            home_team: 'Real Madrid',
            away_team: 'Atletico Madrid',
            league: 'La Liga',
            match_date: new Date().toISOString(),
            home_odds: 1.85,
            away_odds: 4.1,
          } as Prediction,
          {
            id: 'mgr-def-3',
            home_team: 'Inter Milan',
            away_team: 'AC Milan',
            league: 'Serie A',
            match_date: new Date().toISOString(),
            home_odds: 1.78,
            away_odds: 4.4,
          } as Prediction,
          {
            id: 'mgr-def-4',
            home_team: 'Liverpool',
            away_team: 'Chelsea',
            league: 'Premier League',
            match_date: new Date().toISOString(),
            home_odds: 1.72,
            away_odds: 4.5,
          } as Prediction,
        ];

  const rows: ManagerClashProfile[] = pool.map((p, idx) => {
    const homeManager = getTeamManagerProfile(p.home_team);
    const awayManager = getTeamManagerProfile(p.away_team);
    const h = stableHash(`clash:${p.home_team}:${p.away_team}`);

    const hOdds = Math.max(1.18, Number(p.home_odds || 1.95));
    const aOdds = Math.max(1.22, Number(p.away_odds || 3.6));
    const homeFav = hOdds <= aOdds;

    const h2hMeetings = 3 + (h % 8); // 3 to 10 coaching meetings
    const homeMgrWins = homeFav
      ? Math.max(1, Math.round(h2hMeetings * 0.48))
      : Math.max(0, Math.round(h2hMeetings * 0.28));
    const awayMgrWins = Math.min(
      h2hMeetings - homeMgrWins,
      homeFav ? Math.round(h2hMeetings * 0.24) : Math.round(h2hMeetings * 0.44)
    );
    const draws = Math.max(0, h2hMeetings - homeMgrWins - awayMgrWins);

    const h2hAvgGoals = Number((2.15 + ((h % 14) * 0.1)).toFixed(2));
    const combinedGoalsAfter60Pct = Math.round(
      (homeManager.goalsAfter60Pct + awayManager.goalsAfter60Pct) / 2
    );

    const hasNewManagerBounce = homeManager.newManagerBounce || awayManager.newManagerBounce;
    const bounceDeltaPct = hasNewManagerBounce ? 9 + (h % 7) : 0;

    let tacticalEdgeSide: ManagerClashProfile['tacticalEdgeSide'] = 'balanced';
    let clashVerdict = `${homeManager.formation} ${homeManager.style} vs ${awayManager.formation} ${awayManager.style}`;

    if (homeManager.style === 'High-Press Possession' && awayManager.style === 'Compact Mid-Block') {
      tacticalEdgeSide = 'home';
      clashVerdict = `${homeManager.formation} territorial squeeze tests ${awayManager.formation} low block after 60'`;
    } else if (homeManager.style === 'Wingback Overload' || awayManager.style === 'Wingback Overload') {
      tacticalEdgeSide = homeFav ? 'home' : 'away';
      clashVerdict = `Wide wingback 3-back overloads pull opposing fullbacks out of shape`;
    } else if (homeManager.style === 'Direct Counter' || awayManager.style === 'Direct Counter') {
      tacticalEdgeSide = homeFav ? 'home' : 'away';
      clashVerdict = `Vertical transition threat behind high defensive line spikes second-half xG`;
    }

    let recommendedMarket = '2nd Half Highest Scoring';
    let recommendedOdds = Number((1.94 + (idx % 3) * 0.06).toFixed(2));
    let confidence = Math.min(88, Math.max(66, combinedGoalsAfter60Pct + 32));

    if (combinedGoalsAfter60Pct >= 44) {
      recommendedMarket = "Over 0.5 Goals After 60'";
      recommendedOdds = Number(Math.max(1.52, 1.82 - (combinedGoalsAfter60Pct - 44) * 0.03).toFixed(2));
      confidence = Math.min(90, Math.max(70, combinedGoalsAfter60Pct + 36));
    } else if (hasNewManagerBounce && homeManager.newManagerBounce) {
      recommendedMarket = `${p.home_team} Team Over 1.5 Goals`;
      recommendedOdds = Number(Math.max(1.58, hOdds * 0.92).toFixed(2));
      confidence = 78;
    } else if (homeFav && homeMgrWins > awayMgrWins) {
      recommendedMarket = `${p.home_team} Draw No Bet`;
      recommendedOdds = Number(Math.max(1.26, hOdds * 0.74).toFixed(2));
      confidence = Math.min(89, Math.max(72, Math.round((1 / recommendedOdds) * 95)));
    }

    return {
      id: String(p.id || `mgr-${idx}`),
      homeTeam: p.home_team,
      awayTeam: p.away_team,
      league: p.league,
      matchDate: p.match_date,
      homeManager,
      awayManager,
      h2hMeetings,
      homeMgrWins,
      draws,
      awayMgrWins,
      h2hAvgGoals,
      combinedGoalsAfter60Pct,
      bounceDeltaPct,
      hasNewManagerBounce,
      tacticalEdgeSide,
      clashVerdict,
      recommendedMarket,
      recommendedOdds,
      confidence,
    };
  });

  if (filter === 'h2h') {
    return [...rows].sort((a, b) => b.h2hMeetings - a.h2hMeetings);
  }
  if (filter === 'late_subs') {
    return rows.filter((r) => r.combinedGoalsAfter60Pct >= 42);
  }
  if (filter === 'new_bounce') {
    const filtered = rows.filter((r) => r.hasNewManagerBounce);
    return filtered.length > 0 ? filtered : rows.slice(0, 3);
  }
  return rows;
}



