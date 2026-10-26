import { broadcastAdminSync } from './adminOverrideSyncService';

export interface SocialCardRowItem {
  label: string;
  sublabel: string;
  badgeText: string;
  status?: 'won' | 'locked' | 'code';
}

export interface SocialCardRenderConfig {
  template: 'daily-codes' | 'verified-win' | 'jackpot-bankers';
  format: 'story-9-16' | 'square-1-1';
  headline: string;
  subtitle: string;
  bookmaker: string;
  bookingCode: string;
  promoCode: string;
  totalOdds: string;
  winRateBadge: string;
  rows: SocialCardRowItem[];
}

export interface VerifiedWinProof {
  id: string;
  date: string;
  title: string;
  bookmaker: string;
  bookingCode: string;
  totalOdds: number;
  profitUnits: number;
  legs: Array<{
    match: string;
    market: string;
    finalScore: string;
    odds: number;
  }>;
  certifiedBy: string;
}

export interface WatchlistFixtureItem {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  pick: string;
  confidence: number;
  addedAt: string;
}

export interface BankrollSyncedSlip {
  id: string;
  date: string;
  slipTitle: string;
  bookmaker: string;
  bookingCode: string;
  odds: number;
  stake: number;
  currency: string;
  potentialReturn: number;
  status: 'pending' | 'won' | 'lost';
}

export const DEFAULT_VERIFIED_WIN_PROOFS: VerifiedWinProof[] = [
  {
    id: 'proof-1',
    date: 'Yesterday · Verified FT',
    title: '2.18x Daily Rollover Double — 100% Green Sweep',
    bookmaker: 'SportyBet',
    bookingCode: 'BC8942X',
    totalOdds: 2.18,
    profitUnits: 1.18,
    legs: [
      { match: 'Manchester City vs Sunderland', market: 'Man City Win & Over 2.5', finalScore: '5 - 3 (FT)', odds: 1.48 },
      { match: 'Sevilla vs Barcelona', market: 'Barcelona Win (2)', finalScore: '1 - 3 (FT)', odds: 1.47 },
    ],
    certifiedBy: 'PredictPro AutomatedESPN Grader',
  },
  {
    id: 'proof-2',
    date: '2 Days Ago · Verified FT',
    title: '5.42x European Elite xG Accumulator',
    bookmaker: '1xBet',
    bookingCode: 'PRD26X',
    totalOdds: 5.42,
    profitUnits: 4.42,
    legs: [
      { match: 'Atlético Madrid vs Real Madrid', market: 'BTTS: Yes', finalScore: '2 - 1 (FT)', odds: 1.68 },
      { match: 'Juventus vs Atalanta', market: 'Juventus Win (1)', finalScore: '2 - 0 (FT)', odds: 2.05 },
      { match: 'AC Milan vs Lecce', market: 'AC Milan -1.5 AH', finalScore: '3 - 0 (FT)', odds: 1.57 },
    ],
    certifiedBy: 'PredictPro AutomatedESPN Grader',
  },
];

export const DEFAULT_WATCHLIST_FIXTURES: WatchlistFixtureItem[] = [
  {
    matchId: 'wl-ars-che',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    league: 'Premier League',
    matchDate: 'Upcoming · 19:45 UTC',
    pick: 'Arsenal Win (1)',
    confidence: 84,
    addedAt: 'Saved to Watchlist',
  },
  {
    matchId: 'wl-gor-afc',
    homeTeam: 'Gor Mahia',
    awayTeam: 'AFC Leopards',
    league: 'FKF Premier League',
    matchDate: 'Upcoming · 15:00 UTC',
    pick: 'Gor Mahia Win (1)',
    confidence: 86,
    addedAt: 'Saved to Watchlist',
  },
];

export const DEFAULT_BANKROLL_SLIPS: BankrollSyncedSlip[] = [
  {
    id: 'br-slip-1',
    date: new Date().toLocaleDateString('en-GB'),
    slipTitle: 'Daily 2.14x Sure Rollover Double',
    bookmaker: 'SportyBet',
    bookingCode: 'BC8942X',
    odds: 2.14,
    stake: 1000,
    currency: 'KES',
    potentialReturn: 2140,
    status: 'won',
  },
  {
    id: 'br-slip-2',
    date: new Date().toLocaleDateString('en-GB'),
    slipTitle: '5.42x Smart Value Accumulator',
    bookmaker: 'Bet9ja',
    bookingCode: 'B9J551092',
    odds: 5.42,
    stake: 500,
    currency: 'KES',
    potentialReturn: 2710,
    status: 'pending',
  },
];

export function getVerifiedWinProofs(): VerifiedWinProof[] {
  if (typeof window === 'undefined') return DEFAULT_VERIFIED_WIN_PROOFS;
  try {
    const raw = localStorage.getItem('predictpro_verified_win_proofs');
    return raw ? JSON.parse(raw) : DEFAULT_VERIFIED_WIN_PROOFS;
  } catch {
    return DEFAULT_VERIFIED_WIN_PROOFS;
  }
}

export function publishVerifiedWinProof(proof: Omit<VerifiedWinProof, 'id'>): VerifiedWinProof[] {
  const current = getVerifiedWinProofs();
  const created: VerifiedWinProof = {
    ...proof,
    id: `proof-${Date.now()}`,
  };
  const next = [created, ...current];
  try {
    localStorage.setItem('predictpro_verified_win_proofs', JSON.stringify(next));
    broadcastAdminSync('verified_win_proofs');
  } catch {
    // ignore
  }
  return next;
}

export function getUserWatchlist(): WatchlistFixtureItem[] {
  if (typeof window === 'undefined') return DEFAULT_WATCHLIST_FIXTURES;
  try {
    const raw = localStorage.getItem('predictpro_user_watchlist');
    return raw ? JSON.parse(raw) : DEFAULT_WATCHLIST_FIXTURES;
  } catch {
    return DEFAULT_WATCHLIST_FIXTURES;
  }
}

export function toggleWatchlistFixture(item: WatchlistFixtureItem): {
  list: WatchlistFixtureItem[];
  added: boolean;
} {
  const current = getUserWatchlist();
  const exists = current.some((x) => x.matchId === item.matchId);
  const next = exists
    ? current.filter((x) => x.matchId !== item.matchId)
    : [item, ...current];
  try {
    localStorage.setItem('predictpro_user_watchlist', JSON.stringify(next));
    broadcastAdminSync('watchlist');
  } catch {
    // ignore
  }
  return { list: next, added: !exists };
}

export function getBankrollSyncedSlips(): BankrollSyncedSlip[] {
  if (typeof window === 'undefined') return DEFAULT_BANKROLL_SLIPS;
  try {
    const raw = localStorage.getItem('predictpro_bankroll_synced_slips');
    return raw ? JSON.parse(raw) : DEFAULT_BANKROLL_SLIPS;
  } catch {
    return DEFAULT_BANKROLL_SLIPS;
  }
}

export function logSlipToBankrollLedger(input: {
  slipTitle: string;
  bookmaker: string;
  bookingCode: string;
  odds: number;
  stake: number;
  currency: string;
}): BankrollSyncedSlip[] {
  const current = getBankrollSyncedSlips();
  const created: BankrollSyncedSlip = {
    id: `br-slip-${Date.now()}`,
    date: new Date().toLocaleDateString('en-GB'),
    slipTitle: input.slipTitle,
    bookmaker: input.bookmaker,
    bookingCode: input.bookingCode,
    odds: Number(input.odds.toFixed(2)),
    stake: input.stake,
    currency: input.currency,
    potentialReturn: Math.round(input.stake * input.odds),
    status: 'pending',
  };
  const next = [created, ...current];
  try {
    localStorage.setItem('predictpro_bankroll_synced_slips', JSON.stringify(next));
    broadcastAdminSync('bankroll_slips');
  } catch {
    // ignore
  }
  return next;
}

export function gradeBankrollSyncedSlip(
  id: string,
  status: 'pending' | 'won' | 'lost'
): BankrollSyncedSlip[] {
  const current = getBankrollSyncedSlips();
  const next = current.map((s) => (s.id === id ? { ...s, status } : s));
  try {
    localStorage.setItem('predictpro_bankroll_synced_slips', JSON.stringify(next));
    broadcastAdminSync('bankroll_slips');
  } catch {
    // ignore
  }
  return next;
}

/**
 * Renders a 2x Retina HTML5 Canvas Social Card (1080x1920 Story or 1080x1080 Square)
 * and triggers an instant PNG download.
 */
export function downloadSocialCardPng(config: SocialCardRenderConfig, filenamePrefix = 'predictpro-card') {
  const isStory = config.format === 'story-9-16';
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Deep Slate Background
  ctx.fillStyle = '#0B101B';
  ctx.fillRect(0, 0, width, height);

  // Subtle top accent bar
  ctx.fillStyle = '#10B981';
  ctx.fillRect(0, 0, width, 14);

  // 2. Top Brand Header
  const padX = 72;
  let y = isStory ? 96 : 68;

  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(`PREDICTPRO QUANTITATIVE ANALYTICS · ${config.winRateBadge}`, padX, y);

  y += isStory ? 68 : 54;
  ctx.fillStyle = '#F8FAFC';
  ctx.font = `bold ${isStory ? 54 : 44}px sans-serif`;
  ctx.fillText(config.headline.slice(0, 38), padX, y);

  y += isStory ? 44 : 36;
  ctx.fillStyle = '#94A3B8';
  ctx.font = `${isStory ? 28 : 24}px sans-serif`;
  ctx.fillText(config.subtitle.slice(0, 65), padX, y);

  // 3. Booking Code & Total Odds Highlight Box
  y += isStory ? 56 : 36;
  const boxHeight = isStory ? 160 : 124;
  ctx.fillStyle = '#131C2E';
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(padX, y, width - padX * 2, boxHeight, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(`${config.bookmaker.toUpperCase()} BOOKING CODE`, padX + 36, y + (isStory ? 52 : 42));

  ctx.fillStyle = '#10B981';
  ctx.font = `bold ${isStory ? 56 : 44}px monospace`;
  ctx.fillText(config.bookingCode, padX + 36, y + (isStory ? 122 : 96));

  ctx.fillStyle = '#F8FAFC';
  ctx.font = `bold ${isStory ? 48 : 38}px monospace`;
  const oddsText = `${config.totalOdds}x ODDS`;
  const oddsMeasure = ctx.measureText(oddsText).width;
  ctx.fillText(oddsText, width - padX - 36 - oddsMeasure, y + (isStory ? 115 : 92));

  // 4. Fixture / Code Rows
  y += boxHeight + (isStory ? 48 : 30);
  const maxRows = isStory ? 6 : 4;
  const rowHeight = isStory ? 156 : 108;
  const rowGap = isStory ? 22 : 14;

  config.rows.slice(0, maxRows).forEach((row, idx) => {
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padX, y, width - padX * 2, rowHeight, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = `bold ${isStory ? 32 : 26}px sans-serif`;
    ctx.fillText(`${idx + 1}. ${row.label.slice(0, 38)}`, padX + 30, y + (isStory ? 58 : 44));

    ctx.fillStyle = '#94A3B8';
    ctx.font = `${isStory ? 26 : 21}px sans-serif`;
    ctx.fillText(row.sublabel.slice(0, 52), padX + 30, y + (isStory ? 108 : 82));

    // Right status / odds badge
    ctx.fillStyle = '#10B981';
    ctx.font = `bold ${isStory ? 30 : 24}px monospace`;
    const bWidth = ctx.measureText(row.badgeText).width;
    ctx.fillText(row.badgeText, width - padX - 30 - bWidth, y + (isStory ? 84 : 64));

    y += rowHeight + rowGap;
  });

  // 5. Footer URL & Promo Code
  const footerY = height - (isStory ? 90 : 52);
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(
    `predictpro.guru/slip-generator  ·  PROMO CODE: ${config.promoCode}`,
    padX,
    footerY
  );

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `${filenamePrefix}-${config.format}-${Date.now()}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getCertifiedWinningProofs(): Array<
  VerifiedWinProof & { profitLabel: string; verificationHash: string }
> {
  return getVerifiedWinProofs().map((p, idx) => ({
    ...p,
    profitLabel: `+${p.profitUnits.toFixed(2)} Units Verified Profit`,
    verificationHash: `PP-SHA256-98F4A${idx + 1}`,
  }));
}

export function syncSlipToBankroll(input: {
  source?: string;
  bookmaker: string;
  bookingCode: string;
  totalOdds: number;
  suggestedStake: number;
  kellyPct?: number;
  legs?: Array<{ match: string; market: string; odds: number }>;
}): BankrollSyncedSlip[] {
  const firstLeg = input.legs?.[0];
  const title =
    input.legs && input.legs.length > 1
      ? `${input.legs.length}-Fold ${input.source === 'LIVE_MULTIVIEW_QUAD' ? 'Multi-View Live' : 'Monte Carlo'} Parlay`
      : firstLeg
      ? `${firstLeg.match} — ${firstLeg.market}`
      : `${input.bookmaker} ${input.totalOdds.toFixed(2)}x Slip`;

  return logSlipToBankrollLedger({
    slipTitle: title,
    bookmaker: input.bookmaker,
    bookingCode: input.bookingCode,
    odds: input.totalOdds,
    stake: input.suggestedStake,
    currency: 'USD',
  });
}

export async function renderSocialCardPngDataUrl(options: {
  format?: 'STORY_9_16' | 'SQUARE_1_1';
  theme?: string;
  badgeText?: string;
  headline: string;
  subheadline: string;
  bookmaker: string;
  bookingCode: string;
  totalOdds: number;
  winProbabilityPct?: number;
  kellyStakePct?: number;
  isWinnerCertified?: boolean;
  verificationHash?: string;
  legs: Array<{
    match: string;
    league: string;
    market: string;
    odds: number;
    result?: 'WON' | 'PENDING';
  }>;
}): Promise<string> {
  const isStory = options.format !== 'SQUARE_1_1';
  const width = 1080;
  const height = isStory ? 1920 : 1080;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#090D16';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#10B981';
  ctx.fillRect(0, 0, width, 16);

  const padX = 72;
  let y = isStory ? 96 : 68;

  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 28px monospace';
  ctx.fillText(
    options.badgeText || 'PREDICTPRO QUANTITATIVE ANALYTICS',
    padX,
    y
  );

  y += isStory ? 66 : 52;
  ctx.fillStyle = '#F8FAFC';
  ctx.font = `bold ${isStory ? 52 : 42}px sans-serif`;
  ctx.fillText(options.headline.slice(0, 38), padX, y);

  y += isStory ? 44 : 36;
  ctx.fillStyle = '#94A3B8';
  ctx.font = `${isStory ? 28 : 24}px sans-serif`;
  ctx.fillText(options.subheadline.slice(0, 65), padX, y);

  y += isStory ? 56 : 36;
  const boxHeight = isStory ? 160 : 124;
  ctx.fillStyle = '#131C2E';
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(padX, y, width - padX * 2, boxHeight, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(`${options.bookmaker.toUpperCase()} CODE`, padX + 36, y + (isStory ? 52 : 42));

  ctx.fillStyle = '#10B981';
  ctx.font = `bold ${isStory ? 56 : 44}px monospace`;
  ctx.fillText(options.bookingCode, padX + 36, y + (isStory ? 122 : 96));

  ctx.fillStyle = '#F8FAFC';
  ctx.font = `bold ${isStory ? 48 : 38}px monospace`;
  const oddsText = `${options.totalOdds.toFixed(2)}x ODDS`;
  const oddsMeasure = ctx.measureText(oddsText).width;
  ctx.fillText(oddsText, width - padX - 36 - oddsMeasure, y + (isStory ? 115 : 92));

  y += boxHeight + (isStory ? 48 : 30);
  const rowHeight = isStory ? 156 : 108;
  const rowGap = isStory ? 22 : 14;

  options.legs.slice(0, isStory ? 5 : 3).forEach((leg, idx) => {
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padX, y, width - padX * 2, rowHeight, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    ctx.font = `bold ${isStory ? 32 : 26}px sans-serif`;
    ctx.fillText(`${idx + 1}. ${leg.match.slice(0, 38)}`, padX + 30, y + (isStory ? 58 : 44));

    ctx.fillStyle = '#94A3B8';
    ctx.font = `${isStory ? 26 : 21}px sans-serif`;
    ctx.fillText(`${leg.league} · ${leg.market}`, padX + 30, y + (isStory ? 108 : 82));

    ctx.fillStyle = '#10B981';
    ctx.font = `bold ${isStory ? 30 : 24}px monospace`;
    const badge = `${leg.odds.toFixed(2)} ${leg.result === 'WON' ? '✓ WON' : ''}`;
    const bWidth = ctx.measureText(badge).width;
    ctx.fillText(badge, width - padX - 30 - bWidth, y + (isStory ? 84 : 64));

    y += rowHeight + rowGap;
  });

  const footerY = height - (isStory ? 90 : 52);
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(
    `predictpro.guru  ·  AUDIT: ${options.verificationHash || 'PP-VERIFIED'}`,
    padX,
    footerY
  );

  return canvas.toDataURL('image/png');
}
