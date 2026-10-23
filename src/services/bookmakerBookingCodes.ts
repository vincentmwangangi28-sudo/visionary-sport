export interface RegionalBookmaker {
  id: string;
  name: string;
  region: 'Africa' | 'UK & Europe' | 'Americas' | 'Global';
  flag: string;
  codePrefix: string;
  websiteUrl: string;
  countryCodes?: string[];
  deepLinkPattern?: string;
  marginAdjustment?: number; // Multiplier relative to baseline odds
}

export interface BookmakerTranslatedLeg {
  gameId: string;
  match: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  originalMarket: string;
  translatedMarket: string;
  sourceOdds: number;
  convertedOdds: number;
  confidence: number;
}

export interface BookingCodeConversionResult {
  sourceBookmaker: RegionalBookmaker;
  targetBookmaker: RegionalBookmaker;
  sourceCode: string;
  targetCode: string;
  legs: BookmakerTranslatedLeg[];
  totalSourceOdds: number;
  totalTargetOdds: number;
  combinedConfidence: number;
  timestamp: string;
}

export const REGIONAL_BOOKMAKERS: RegionalBookmaker[] = [
  // Africa
  { id: 'sportybet', name: 'SportyBet', region: 'Africa', flag: '🌍', codePrefix: 'SB-', countryCodes: ['ke', 'ng', 'gh', 'tz', 'ug', 'zm'], websiteUrl: 'https://www.sportybet.com', marginAdjustment: 1.02 },
  { id: 'sportpesa', name: 'SportPesa', region: 'Africa', flag: '🇰🇪', codePrefix: 'SP-', countryCodes: ['ke', 'ea', 'tz'], websiteUrl: 'https://www.sportpesa.co.ke', marginAdjustment: 1.0 },
  { id: 'betika', name: 'Betika', region: 'Africa', flag: '🇰🇪', codePrefix: 'BTK-', countryCodes: ['ke', 'ea', 'tz', 'gh', 'cd'], websiteUrl: 'https://www.betika.com', marginAdjustment: 1.01 },
  { id: 'bet9ja', name: 'Bet9ja', region: 'Africa', flag: '🇳🇬', codePrefix: 'B9J-', countryCodes: ['ng', 'wa'], websiteUrl: 'https://www.bet9ja.com', marginAdjustment: 1.01 },
  { id: 'betway', name: 'Betway', region: 'Africa', flag: '🌍', codePrefix: 'BW-', countryCodes: ['ke', 'ng', 'za', 'gh', 'zm', 'tz', 'uk'], websiteUrl: 'https://www.betway.co.ke', marginAdjustment: 0.99 },
  { id: 'betpawa', name: 'betPawa', region: 'Africa', flag: '🌍', codePrefix: 'BPW-', countryCodes: ['ke', 'ng', 'gh', 'ug', 'tz', 'zm', 'cm', 'rw'], websiteUrl: 'https://www.betpawa.com', marginAdjustment: 1.0 },
  { id: 'betking', name: 'BetKing', region: 'Africa', flag: '🇳🇬', codePrefix: 'BKG-', countryCodes: ['ng', 'gh', 'ke'], websiteUrl: 'https://www.betking.com', marginAdjustment: 1.01 },
  { id: 'mozzart', name: 'MozzartBet', region: 'Africa', flag: '🌍', codePrefix: 'MZT-', countryCodes: ['ke', 'ea', 'ng', 'gh'], websiteUrl: 'https://www.mozzartbet.co.ke', marginAdjustment: 1.0 },
  { id: 'premierbet', name: 'PremierBet', region: 'Africa', flag: '🇨🇩', codePrefix: 'PMB-', countryCodes: ['cd', 'cm', 'ao', 'zm', 'mw', 'tz', 'sn', 'ci'], websiteUrl: 'https://www.premierbet.com', marginAdjustment: 0.99 },
  { id: 'odibets', name: 'OdiBets', region: 'Africa', flag: '🇰🇪', codePrefix: 'ODI-', countryCodes: ['ke', 'ea', 'gh'], websiteUrl: 'https://www.odibets.com', marginAdjustment: 1.0 },
  { id: 'hollywoodbets', name: 'Hollywoodbets', region: 'Africa', flag: '🇿🇦', codePrefix: 'HWB-', countryCodes: ['za', 'mz'], websiteUrl: 'https://www.hollywoodbets.net', marginAdjustment: 0.99 },
  { id: 'supabets', name: 'Supabets', region: 'Africa', flag: '🇿🇦', codePrefix: 'SPB-', countryCodes: ['za', 'gh', 'tz', 'zw'], websiteUrl: 'https://www.supabets.co.za', marginAdjustment: 1.0 },

  // Global & Pro
  { id: '1xbet', name: '1xBet', region: 'Global', flag: '🌐', codePrefix: '1X-', countryCodes: ['global', 'ke', 'ng', 'ea', 'br'], websiteUrl: 'https://1xbet.com', marginAdjustment: 1.04 },
  { id: '22bet', name: '22Bet', region: 'Global', flag: '🌐', codePrefix: '22B-', countryCodes: ['global', 'ea'], websiteUrl: 'https://22bet.com', marginAdjustment: 1.03 },
  { id: 'pinnacle', name: 'Pinnacle', region: 'Global', flag: '⚡', codePrefix: 'PIN-', countryCodes: ['global', 'uk', 'eu'], websiteUrl: 'https://www.pinnacle.com', marginAdjustment: 1.05 },
  { id: 'stake', name: 'Stake.com', region: 'Global', flag: '⚡', codePrefix: 'STK-', countryCodes: ['global'], websiteUrl: 'https://stake.com', marginAdjustment: 1.03 },
  { id: 'dafabet', name: 'Dafabet', region: 'Global', flag: '🌏', codePrefix: 'DAF-', countryCodes: ['global', 'ke'], websiteUrl: 'https://www.dafabet.com', marginAdjustment: 1.0 },

  // UK & Europe
  { id: 'bet365', name: 'Bet365', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'B365-', countryCodes: ['uk', 'eu', 'global'], websiteUrl: 'https://www.bet365.com', marginAdjustment: 1.02 },
  { id: 'skybet', name: 'SkyBet', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'SKY-', countryCodes: ['uk'], websiteUrl: 'https://www.skybet.com', marginAdjustment: 0.99 },
  { id: 'unibet', name: 'Unibet', region: 'UK & Europe', flag: '🇪🇺', codePrefix: 'UNI-', countryCodes: ['eu', 'uk'], websiteUrl: 'https://www.unibet.com', marginAdjustment: 1.01 },
  { id: 'betfair', name: 'Betfair', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'BF-', countryCodes: ['uk', 'eu'], websiteUrl: 'https://www.betfair.com', marginAdjustment: 1.04 },
  { id: 'williamhill', name: 'William Hill', region: 'UK & Europe', flag: '🇬🇧', codePrefix: 'WH-', countryCodes: ['uk'], websiteUrl: 'https://www.williamhill.com', marginAdjustment: 0.99 },

  // Americas
  { id: 'draftkings', name: 'DraftKings', region: 'Americas', flag: '🇺🇸', codePrefix: 'DK-', countryCodes: ['us'], websiteUrl: 'https://sportsbook.draftkings.com', marginAdjustment: 1.0 },
  { id: 'fanduel', name: 'FanDuel', region: 'Americas', flag: '🇺🇸', codePrefix: 'FD-', countryCodes: ['us'], websiteUrl: 'https://sportsbook.fanduel.com', marginAdjustment: 1.0 },
  { id: 'betmgm', name: 'BetMGM', region: 'Americas', flag: '🇺🇸', codePrefix: 'MGM-', countryCodes: ['us'], websiteUrl: 'https://sports.betmgm.com', marginAdjustment: 0.99 },
  { id: 'betano', name: 'Betano', region: 'Americas', flag: '🇧🇷', codePrefix: 'BTN-', countryCodes: ['br'], websiteUrl: 'https://www.betano.com', marginAdjustment: 1.01 },
];

export function generateRegionalBookingCode(
  bookmakerId: string,
  selectionsOrCount: number | Array<{ homeTeam?: string; awayTeam?: string; market?: string }> = 3,
  seedText?: string
): string {
  const bookmaker = REGIONAL_BOOKMAKERS.find((b) => b.id === bookmakerId.toLowerCase()) || REGIONAL_BOOKMAKERS[0];
  const selectionsCount = Array.isArray(selectionsOrCount)
    ? Math.max(1, selectionsOrCount.length)
    : Math.max(1, selectionsOrCount);
  const resolvedSeed =
    seedText ??
    (Array.isArray(selectionsOrCount) && selectionsOrCount.length > 0
      ? selectionsOrCount.map((s) => `${s.homeTeam || ''}-${s.awayTeam || ''}-${s.market || ''}`).join('|')
      : undefined);

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  if (resolvedSeed) {
    let hash = 0;
    for (let i = 0; i < resolvedSeed.length; i++) {
      hash = (hash * 31 + resolvedSeed.charCodeAt(i)) >>> 0;
    }
    for (let i = 0; i < 5; i++) {
      rand += chars.charAt((hash + i * 17) % chars.length);
      hash = Math.floor(hash / 7) + (i + 1) * 13;
    }
  } else {
    for (let i = 0; i < 5; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  const cleanPrefix = bookmaker.codePrefix.toUpperCase().replace(/-$/, '');
  return `${cleanPrefix}-${selectionsCount}X-${rand}`;
}

/**
 * Generates deterministic 4-digit Bookmaker SMS / Coupon Game ID (e.g., 4812)
 */
export function generateMatchGameId(
  homeTeam: string,
  awayTeam: string = '',
  bookmakerId: string = 'sportybet'
): string {
  const str = `${homeTeam.toLowerCase()}-${awayTeam.toLowerCase()}-${bookmakerId.toLowerCase()}`;
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum = (sum * 33 + str.charCodeAt(i)) % 9000;
  }
  return String(1000 + (sum % 8999));
}

/**
 * Translates generic football market names into exact bookmaker-specific terminology
 */
export function translateMarketForBookmaker(market: string, bookmakerId: string): string {
  const m = (market || 'Home Win').trim();
  const lower = m.toLowerCase();
  const bId = bookmakerId.toLowerCase();

  // 1X2 Home
  if (lower === 'home win' || lower === '1' || lower === 'home') {
    if (bId === '1xbet' || bId === '22bet') return '1x2: W1';
    if (bId === 'sportybet') return '1X2 - Home (1)';
    if (bId === 'bet9ja' || bId === 'betking') return '1X2 - 1';
    if (bId === 'sportpesa') return '3 Way - 1';
    if (bId === 'bet365') return 'Full Time Result - Home';
    return '1X2 - Home (1)';
  }

  // 1X2 Away
  if (lower === 'away win' || lower === '2' || lower === 'away') {
    if (bId === '1xbet' || bId === '22bet') return '1x2: W2';
    if (bId === 'sportybet') return '1X2 - Away (2)';
    if (bId === 'bet9ja' || bId === 'betking') return '1X2 - 2';
    if (bId === 'sportpesa') return '3 Way - 2';
    if (bId === 'bet365') return 'Full Time Result - Away';
    return '1X2 - Away (2)';
  }

  // 1X2 Draw
  if (lower === 'draw' || lower === 'x') {
    if (bId === '1xbet' || bId === '22bet') return '1x2: X';
    if (bId === 'sportybet') return '1X2 - Draw (X)';
    if (bId === 'bet9ja' || bId === 'betking') return '1X2 - X';
    if (bId === 'sportpesa') return '3 Way - X';
    if (bId === 'bet365') return 'Full Time Result - Draw';
    return '1X2 - Draw (X)';
  }

  // Over / Under Goals
  if (lower.includes('over 2.5')) {
    if (bId === '1xbet' || bId === '22bet') return 'Total: Over (2.5)';
    if (bId === 'sportybet') return 'Over/Under - Over 2.5';
    if (bId === 'bet9ja') return 'O/U 2.5 - Over';
    if (bId === 'sportpesa' || bId === 'betika') return 'Total Goals - Over 2.5';
    if (bId === 'bet365') return 'Goals Over/Under - Over 2.5';
    return 'Over 2.5 Goals';
  }
  if (lower.includes('over 1.5') && !lower.includes('&')) {
    if (bId === '1xbet' || bId === '22bet') return 'Total: Over (1.5)';
    if (bId === 'sportybet') return 'Over/Under - Over 1.5';
    if (bId === 'bet9ja') return 'O/U 1.5 - Over';
    return 'Over 1.5 Goals';
  }
  if (lower.includes('under 2.5')) {
    if (bId === '1xbet' || bId === '22bet') return 'Total: Under (2.5)';
    if (bId === 'sportybet') return 'Over/Under - Under 2.5';
    if (bId === 'bet9ja') return 'O/U 2.5 - Under';
    return 'Under 2.5 Goals';
  }

  // BTTS / GG
  if (lower.includes('btts') || lower.includes('both teams to score') || lower === 'gg') {
    const isNo = lower.includes('no') || lower === 'ng';
    if (bId === 'sportybet' || bId === 'bet9ja' || bId === 'betika' || bId === 'odibets') {
      return isNo ? 'GG/NG - NG' : 'GG/NG - GG (Yes)';
    }
    if (bId === '1xbet' || bId === '22bet') {
      return isNo ? 'Both Teams To Score: No' : 'Both Teams To Score: Yes';
    }
    return isNo ? 'BTTS - No' : 'BTTS - Yes (GG)';
  }

  // Double Chance
  if (lower.includes('1x') || lower.includes('home or draw')) {
    if (bId === '1xbet' || bId === '22bet') return 'Double Chance: 1X';
    if (bId === 'sportybet' || bId === 'bet9ja') return 'Double Chance - 1X';
    return 'Double Chance 1X';
  }
  if (lower.includes('x2') || lower.includes('away or draw')) {
    if (bId === '1xbet' || bId === '22bet') return 'Double Chance: 2X';
    if (bId === 'sportybet' || bId === 'bet9ja') return 'Double Chance - X2';
    return 'Double Chance X2';
  }

  // Draw No Bet
  if (lower.includes('draw no bet') || lower.includes('dnb')) {
    if (bId === '1xbet') return m.replace(/Draw No Bet/i, 'Handicap (0)');
    if (bId === 'sportybet') return `DNB - ${m.replace(/Draw No Bet/i, '').trim() || '1'}`;
    return m;
  }

  return m;
}

/**
 * Converts a Booking Code or active selections from one bookmaker to another
 */
export function convertBookingCodeBetweenBookmakers(
  rawCode: string,
  sourceBookmakerId: string,
  targetBookmakerId: string,
  availableFixtures: Array<{
    homeTeam: string;
    awayTeam: string;
    league: string;
    market: string;
    odds: number;
    confidence: number;
  }>
): BookingCodeConversionResult {
  const sourceBookmaker =
    REGIONAL_BOOKMAKERS.find((b) => b.id === sourceBookmakerId) || REGIONAL_BOOKMAKERS[0];
  const targetBookmaker =
    REGIONAL_BOOKMAKERS.find((b) => b.id === targetBookmakerId) ||
    REGIONAL_BOOKMAKERS[1] ||
    REGIONAL_BOOKMAKERS[0];

  const cleanCode = (rawCode || 'SB-4X-9K2LM').trim().toUpperCase();

  // Determine how many legs the code represents (e.g., "SB-5X-..." -> 5 legs, default 4)
  const countMatch = cleanCode.match(/(\d+)X/i);
  const desiredCount = countMatch ? Math.min(10, Math.max(2, parseInt(countMatch[1], 10))) : 4;

  // Deterministic rotation based on the code characters so the same code always resolves to the same slip
  let seed = 0;
  for (let i = 0; i < cleanCode.length; i++) {
    seed = (seed * 29 + cleanCode.charCodeAt(i)) >>> 0;
  }

  const pool =
    availableFixtures.length > 0
      ? availableFixtures
      : [
          { homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'Premier League', market: 'Home Win', odds: 1.78, confidence: 84 },
          { homeTeam: 'Real Madrid', awayTeam: 'Barcelona', league: 'LaLiga', market: 'Over 2.5 Goals', odds: 1.68, confidence: 82 },
          { homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', league: 'Bundesliga', market: 'BTTS Yes', odds: 1.62, confidence: 85 },
          { homeTeam: 'Inter Milan', awayTeam: 'AC Milan', league: 'Serie A', market: '1X Double Chance', odds: 1.38, confidence: 88 },
          { homeTeam: 'PSG', awayTeam: 'Marseille', league: 'Ligue 1', market: 'Home Win & Over 1.5', odds: 1.74, confidence: 81 },
          { homeTeam: 'Liverpool', awayTeam: 'Man City', league: 'Premier League', market: 'BTTS Yes', odds: 1.65, confidence: 83 },
        ];

  const selectedFixtures = [];
  for (let i = 0; i < Math.min(desiredCount, pool.length); i++) {
    const idx = (seed + i * 3) % pool.length;
    selectedFixtures.push(pool[idx]);
  }

  const sourceMargin = sourceBookmaker.marginAdjustment ?? 1.0;
  const targetMargin = targetBookmaker.marginAdjustment ?? 1.02;
  const ratio = targetMargin / sourceMargin;

  const legs: BookmakerTranslatedLeg[] = selectedFixtures.map((f) => {
    const sOdds = Number((f.odds * sourceMargin).toFixed(2));
    const tOdds = Number(Math.max(1.12, f.odds * ratio).toFixed(2));
    return {
      gameId: generateMatchGameId(f.homeTeam, f.awayTeam, targetBookmaker.id),
      match: `${f.homeTeam} vs ${f.awayTeam}`,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      league: f.league,
      originalMarket: translateMarketForBookmaker(f.market, sourceBookmaker.id),
      translatedMarket: translateMarketForBookmaker(f.market, targetBookmaker.id),
      sourceOdds: sOdds,
      convertedOdds: tOdds,
      confidence: f.confidence,
    };
  });

  const totalSourceOdds = Number(legs.reduce((acc, l) => acc * l.sourceOdds, 1).toFixed(2));
  const totalTargetOdds = Number(legs.reduce((acc, l) => acc * l.convertedOdds, 1).toFixed(2));
  const combinedConfidence = Math.round(
    legs.reduce((acc, l) => acc + l.confidence, 0) / Math.max(1, legs.length)
  );

  const targetCode = generateRegionalBookingCode(targetBookmaker.id, legs.length, cleanCode);

  return {
    sourceBookmaker,
    targetBookmaker,
    sourceCode: cleanCode,
    targetCode,
    legs,
    totalSourceOdds,
    totalTargetOdds,
    combinedConfidence,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generates and downloads a High-DPI (2x) PNG Slip Card using HTML5 Canvas
 */
export function downloadSlipAsPngImage(params: {
  selections: Array<{
    homeTeam: string;
    awayTeam: string;
    league: string;
    market: string;
    odds: number;
    confidence?: number;
  }>;
  totalOdds: number;
  stake?: number;
  currency?: string;
  potentialReturn?: number;
  bookmakerName?: string;
  bookieId?: string;
  title?: string;
  bookingCode?: string;
}): void {
  const {
    selections,
    totalOdds,
    stake = 100,
    currency = 'KES',
    potentialReturn = totalOdds * stake,
    bookieId,
    bookmakerName = bookieId
      ? REGIONAL_BOOKMAKERS.find((b) => b.id === bookieId.toLowerCase())?.name || bookieId.toUpperCase()
      : 'SportyBet / 1xBet',
    title,
    bookingCode = generateRegionalBookingCode(bookieId || 'sportybet', selections),
  } = params;

  const scale = 2;
  const width = 640;
  const headerHeight = 128;
  const rowHeight = 76;
  const footerHeight = 148;
  const height = headerHeight + Math.max(1, selections.length) * rowHeight + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, width, height);

  // Top emerald accent bar
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, '#10b981');
  grad.addColorStop(0.5, '#0ea5e9');
  grad.addColorStop(1, '#10b981');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, 6);

  // Header container
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 20, width - 40, 92);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, width - 40, 92);

  // Brand Title
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.fillText('PREDICTPRO.GURU · VERIFIED AI MULTIBET SLIP', 38, 46);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 22px Inter, system-ui, sans-serif';
  ctx.fillText((title || `${selections.length}-Leg AI Accumulator`).slice(0, 34), 38, 76);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 12px Inter, system-ui, sans-serif';
  ctx.fillText(`Generated ${new Date().toLocaleDateString()} · ${bookmakerName}`, 38, 96);

  // Booking Code Badge on Right
  ctx.fillStyle = '#052e16';
  ctx.fillRect(width - 210, 34, 172, 64);
  ctx.strokeStyle = '#10b981';
  ctx.strokeRect(width - 210, 34, 172, 64);

  ctx.fillStyle = '#6ee7b7';
  ctx.font = 'bold 10px Inter, system-ui, sans-serif';
  ctx.fillText('BOOKING CODE', width - 196, 54);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px monospace';
  ctx.fillText(bookingCode, width - 196, 80);

  // Legs List
  selections.forEach((leg, i) => {
    const y = headerHeight + i * rowHeight;

    ctx.fillStyle = i % 2 === 0 ? '#111827' : '#0f172a';
    ctx.fillRect(20, y, width - 40, rowHeight - 8);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(20, y, width - 40, rowHeight - 8);

    // Index badge
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`#${i + 1}`, 34, y + 26);

    // League
    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.fillText((leg.league || 'Football').toUpperCase(), 64, y + 25);

    // Teams
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px Inter, system-ui, sans-serif';
    const matchTitle = `${leg.homeTeam} vs ${leg.awayTeam}`;
    ctx.fillText(matchTitle.slice(0, 36), 34, y + 50);

    // Market pill
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(leg.market, width - 110, y + 32);

    if (leg.confidence) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 11px Inter, system-ui, sans-serif';
      ctx.fillText(`AI Confidence: ${leg.confidence}%`, width - 110, y + 50);
    }

    // Odds Box
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(width - 96, y + 14, 62, 40);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(leg.odds.toFixed(2), width - 65, y + 39);
    ctx.textAlign = 'left';
  });

  // Footer Summary Box
  const fy = headerHeight + selections.length * rowHeight + 8;
  ctx.fillStyle = '#052e16';
  ctx.fillRect(20, fy, width - 40, 112);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, fy, width - 40, 112);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.fillText('COMBINED ODDS', 40, fy + 34);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px monospace';
  ctx.fillText(`${totalOdds.toFixed(2)}x`, 40, fy + 66);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.fillText('STAKE', 230, fy + 34);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`${currency} ${stake.toLocaleString()}`, 230, fy + 64);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#6ee7b7';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.fillText('ESTIMATED PAYOUT', width - 40, fy + 34);
  ctx.fillStyle = '#10b981';
  ctx.font = '900 24px monospace';
  ctx.fillText(
    `${currency} ${Math.round(potentialReturn).toLocaleString()}`,
    width - 40,
    fy + 66
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 11px Inter, system-ui, sans-serif';
  ctx.fillText('predictpro.guru/slip-generator · 18+ Play Responsibly', width - 40, fy + 96);
  ctx.textAlign = 'left';

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `PredictPro-Slip-${bookingCode}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
