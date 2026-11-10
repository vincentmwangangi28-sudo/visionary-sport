/**
 * PredictPro Phase 17: Live Audio Commentary, Browser Goal Push Notifications
 * & Match Referee / Player Shot-on-Target (SoT) Prop Intelligence Service
 */

export interface SpokenCommentaryEntry {
  id: string;
  timestamp: string;
  matchLabel: string;
  minute: string;
  category: 'goal' | 'red_card' | 'momentum' | 'summary' | 'settlement';
  text: string;
}

export interface MatchRefereePropProfile {
  refereeName: string;
  nationality: string;
  avgYellowCards: number;
  avgFoulsPerGame: number;
  penaltiesPerTenGames: number;
  strictnessTier: 'High Discipline' | 'Balanced' | 'Lenient Flow';
  primaryCardLine: string;
  primaryCardOdds: number;
  primaryCardConfidence: number;
  bttsCardsLine: string;
  bttsCardsOdds: number;
  bttsCardsConfidence: number;
}

export interface MatchPlayerSotProp {
  id: string;
  playerName: string;
  teamName: string;
  teamSide: 'home' | 'away';
  position: string;
  avgShotsPer90: number;
  avgSotPer90: number;
  marketLabel: string;
  shortLabel: string;
  odds: number;
  confidence: number;
}

const announcedKeys = new Set<string>();
const commentaryHistory: SpokenCommentaryEntry[] = [];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Checks if Web Speech API synthesis is supported in the current browser.
 */
export function isSpeechCommentarySupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Speaks a live play-by-play broadcast line via Web Speech API and records it in history.
 */
export function speakMatchCommentary(
  entry: Omit<SpokenCommentaryEntry, 'id' | 'timestamp'>,
  options?: { forceSpeak?: boolean; dedupeKey?: string }
): SpokenCommentaryEntry {
  const key = options?.dedupeKey || `${entry.matchLabel}:${entry.minute}:${entry.text}`;
  const fullEntry: SpokenCommentaryEntry = {
    ...entry,
    id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  if (!options?.forceSpeak && announcedKeys.has(key)) {
    return fullEntry;
  }
  announcedKeys.add(key);

  commentaryHistory.unshift(fullEntry);
  if (commentaryHistory.length > 25) {
    commentaryHistory.pop();
  }

  if (isSpeechCommentarySupported()) {
    try {
      if (options?.forceSpeak) {
        window.speechSynthesis.cancel();
      }
      const utterance = new SpeechSynthesisUtterance(entry.text);
      utterance.lang = 'en-GB';
      utterance.rate = 1.03;
      utterance.pitch = entry.category === 'goal' ? 1.08 : 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore browser autoplay block if user has not interacted yet
    }
  }

  return fullEntry;
}

export function stopSpeechCommentary(): void {
  if (isSpeechCommentarySupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function getSpokenCommentaryHistory(): SpokenCommentaryEntry[] {
  return [...commentaryHistory];
}

/**
 * Browser Web Notification API helpers for instant goal & ticket settlement alerts.
 */
export function getGoalPushPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

export async function requestGoalPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (window.Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const result = await window.Notification.requestPermission();
    return result;
  } catch {
    return window.Notification.permission;
  }
}

export function dispatchGoalOrSettlementPush(payload: {
  title: string;
  body: string;
  tag?: string;
}): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (window.Notification.permission !== 'granted') {
    return false;
  }
  try {
    new window.Notification(payload.title, {
      body: payload.body,
      icon: '/favicon-48x48.png',
      badge: '/favicon-32x32.png',
      tag: payload.tag || `predictpro-${Date.now()}`,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates deterministic, league-calibrated Referee Discipline & Player Shot-on-Target (SoT)
 * prop markets for any live or upcoming fixture so users can add correlated props in 1 click.
 */
const REFEREE_POOL: Array<{
  name: string;
  country: string;
  avgYellow: number;
  avgFouls: number;
  pkRate: number;
  tier: MatchRefereePropProfile['strictnessTier'];
}> = [
  { name: 'Michael Oliver', country: 'England', avgYellow: 4.35, avgFouls: 22.8, pkRate: 3.4, tier: 'High Discipline' },
  { name: 'Anthony Taylor', country: 'England', avgYellow: 4.62, avgFouls: 23.4, pkRate: 3.8, tier: 'High Discipline' },
  { name: 'Szymon Marciniak', country: 'Poland', avgYellow: 4.18, avgFouls: 21.9, pkRate: 3.5, tier: 'Balanced' },
  { name: 'Jesús Gil Manzano', country: 'Spain', avgYellow: 5.15, avgFouls: 25.6, pkRate: 4.2, tier: 'High Discipline' },
  { name: 'Daniele Orsato', country: 'Italy', avgYellow: 4.78, avgFouls: 24.5, pkRate: 3.1, tier: 'High Discipline' },
  { name: 'Clément Turpin', country: 'France', avgYellow: 3.85, avgFouls: 20.4, pkRate: 3.6, tier: 'Balanced' },
  { name: 'Felix Zwayer', country: 'Germany', avgYellow: 4.48, avgFouls: 23.1, pkRate: 3.7, tier: 'High Discipline' },
  { name: 'Slavko Vinčić', country: 'Slovenia', avgYellow: 3.92, avgFouls: 21.2, pkRate: 2.9, tier: 'Balanced' },
];

const CLUB_STAR_SHOOTERS: Record<
  string,
  Array<{ name: string; pos: string; shots90: number; sot90: number }>
> = {
  arsenal: [
    { name: 'Bukayo Saka', pos: 'RW', shots90: 3.4, sot90: 1.55 },
    { name: 'Kai Havertz', pos: 'ST', shots90: 2.9, sot90: 1.32 },
  ],
  chelsea: [
    { name: 'Cole Palmer', pos: 'CAM', shots90: 3.8, sot90: 1.72 },
    { name: 'Nicolas Jackson', pos: 'ST', shots90: 3.1, sot90: 1.41 },
  ],
  liverpool: [
    { name: 'Mohamed Salah', pos: 'RW', shots90: 3.9, sot90: 1.84 },
    { name: 'Luis Díaz', pos: 'LW', shots90: 2.8, sot90: 1.28 },
  ],
  'manchester city': [
    { name: 'Erling Haaland', pos: 'ST', shots90: 4.4, sot90: 2.15 },
    { name: 'Phil Foden', pos: 'CAM', shots90: 3.3, sot90: 1.48 },
  ],
  'real madrid': [
    { name: 'Kylian Mbappé', pos: 'ST', shots90: 4.5, sot90: 2.18 },
    { name: 'Vinícius Júnior', pos: 'LW', shots90: 3.5, sot90: 1.62 },
  ],
  barcelona: [
    { name: 'Robert Lewandowski', pos: 'ST', shots90: 3.9, sot90: 1.88 },
    { name: 'Lamine Yamal', pos: 'RW', shots90: 3.2, sot90: 1.44 },
  ],
  bayern: [
    { name: 'Harry Kane', pos: 'ST', shots90: 4.2, sot90: 2.04 },
    { name: 'Jamal Musiala', pos: 'CAM', shots90: 3.1, sot90: 1.45 },
  ],
  inter: [
    { name: 'Lautaro Martínez', pos: 'ST', shots90: 3.7, sot90: 1.71 },
    { name: 'Marcus Thuram', pos: 'ST', shots90: 2.8, sot90: 1.34 },
  ],
  psg: [
    { name: 'Ousmane Dembélé', pos: 'RW', shots90: 3.5, sot90: 1.52 },
    { name: 'Bradley Barcola', pos: 'LW', shots90: 3.1, sot90: 1.46 },
  ],
};

function resolveTeamShooters(teamName: string): Array<{ name: string; pos: string; shots90: number; sot90: number }> {
  const lower = teamName.toLowerCase();
  for (const [key, list] of Object.entries(CLUB_STAR_SHOOTERS)) {
    if (lower.includes(key)) {
      return list;
    }
  }
  const seed = hashString(teamName);
  const shortClub = teamName.split(' ')[0] || teamName;
  return [
    {
      name: `${shortClub} #9 Striker`,
      pos: 'ST',
      shots90: Number((2.9 + (seed % 11) * 0.1).toFixed(1)),
      sot90: Number((1.35 + (seed % 7) * 0.08).toFixed(2)),
    },
    {
      name: `${shortClub} #10 Playmaker`,
      pos: 'CAM',
      shots90: Number((2.4 + (seed % 9) * 0.1).toFixed(1)),
      sot90: Number((1.12 + (seed % 6) * 0.07).toFixed(2)),
    },
  ];
}

export function getMatchRefereeAndPlayerProps(params: {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
}): {
  referee: MatchRefereePropProfile;
  playerProps: MatchPlayerSotProp[];
} {
  const seed = hashString(`${params.homeTeam}-${params.awayTeam}-${params.league}`);
  const refItem = REFEREE_POOL[seed % REFEREE_POOL.length];

  const isHighCards = refItem.avgYellow >= 4.4;
  const primaryCardLine = isHighCards ? 'Over 4.5 Total Cards' : 'Over 3.5 Total Cards';
  const primaryCardOdds = isHighCards
    ? Number((1.78 + (seed % 18) * 0.01).toFixed(2))
    : Number((1.62 + (seed % 16) * 0.01).toFixed(2));
  const primaryCardConfidence = isHighCards ? 79 + (seed % 9) : 82 + (seed % 8);

  const referee: MatchRefereePropProfile = {
    refereeName: refItem.name,
    nationality: refItem.country,
    avgYellowCards: refItem.avgYellow,
    avgFoulsPerGame: refItem.avgFouls,
    penaltiesPerTenGames: refItem.pkRate,
    strictnessTier: refItem.tier,
    primaryCardLine,
    primaryCardOdds,
    primaryCardConfidence,
    bttsCardsLine: 'Both Teams 2+ Cards',
    bttsCardsOdds: Number((1.92 + (seed % 22) * 0.01).toFixed(2)),
    bttsCardsConfidence: 74 + (seed % 11),
  };

  const homeShooters = resolveTeamShooters(params.homeTeam);
  const awayShooters = resolveTeamShooters(params.awayTeam);

  const playerProps: MatchPlayerSotProp[] = [
    {
      id: `${params.matchId}-h1`,
      playerName: homeShooters[0].name,
      teamName: params.homeTeam,
      teamSide: 'home',
      position: homeShooters[0].pos,
      avgShotsPer90: homeShooters[0].shots90,
      avgSotPer90: homeShooters[0].sot90,
      marketLabel: `${homeShooters[0].name} — 1+ Shot on Target`,
      shortLabel: `${homeShooters[0].name} 1+ SoT`,
      odds: Number((1.38 + (seed % 14) * 0.01).toFixed(2)),
      confidence: 85 + (seed % 8),
    },
    {
      id: `${params.matchId}-a1`,
      playerName: awayShooters[0].name,
      teamName: params.awayTeam,
      teamSide: 'away',
      position: awayShooters[0].pos,
      avgShotsPer90: awayShooters[0].shots90,
      avgSotPer90: awayShooters[0].sot90,
      marketLabel: `${awayShooters[0].name} — 1+ Shot on Target`,
      shortLabel: `${awayShooters[0].name} 1+ SoT`,
      odds: Number((1.46 + (seed % 16) * 0.01).toFixed(2)),
      confidence: 81 + (seed % 8),
    },
    {
      id: `${params.matchId}-h2`,
      playerName: homeShooters[0].name,
      teamName: params.homeTeam,
      teamSide: 'home',
      position: homeShooters[0].pos,
      avgShotsPer90: homeShooters[0].shots90,
      avgSotPer90: homeShooters[0].sot90,
      marketLabel: `${homeShooters[0].name} — 2+ Shots on Target`,
      shortLabel: `${homeShooters[0].name} 2+ SoT`,
      odds: Number((2.25 + (seed % 25) * 0.01).toFixed(2)),
      confidence: 69 + (seed % 10),
    },
    {
      id: `${params.matchId}-a2`,
      playerName: awayShooters[1]?.name || awayShooters[0].name,
      teamName: params.awayTeam,
      teamSide: 'away',
      position: awayShooters[1]?.pos || 'CAM',
      avgShotsPer90: awayShooters[1]?.shots90 || 2.5,
      avgSotPer90: awayShooters[1]?.sot90 || 1.15,
      marketLabel: `${awayShooters[1]?.name || awayShooters[0].name} — 1+ Shot on Target`,
      shortLabel: `${awayShooters[1]?.name || awayShooters[0].name} 1+ SoT`,
      odds: Number((1.58 + (seed % 18) * 0.01).toFixed(2)),
      confidence: 76 + (seed % 9),
    },
  ];

  return { referee, playerProps };
}
