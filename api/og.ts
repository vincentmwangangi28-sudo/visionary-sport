// Vercel Edge Function: Dynamic 1200x630 OpenGraph Social Card Generator
// Supports match cards (/api/og?home=Arsenal&away=Chelsea&league=Premier+League&tip=Home+Win&conf=78&xg=2.14+-+0.98&score=2-1)
// and accumulator/hub cards (/api/og?title=5-Fold+Banker+Slip&subtitle=Combined+Odds+6.45&code=PP-84920&conf=84)

export const config = {
  runtime: 'edge',
};

function escapeSvg(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getInitials(team: string): string {
  const words = team.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'FC';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const home = url.searchParams.get('home')?.trim() || '';
  const away = url.searchParams.get('away')?.trim() || '';
  const league = url.searchParams.get('league')?.trim() || 'AI Football Intelligence';
  const tip = url.searchParams.get('tip')?.trim() || 'Home Win';
  const conf = Math.min(99, Math.max(50, Number(url.searchParams.get('conf')) || 82));
  const xg = url.searchParams.get('xg')?.trim() || '1.84 - 0.96';
  const score = url.searchParams.get('score')?.trim() || '2-1';
  const title = url.searchParams.get('title')?.trim() || '';
  const subtitle = url.searchParams.get('subtitle')?.trim() || '';
  const code = url.searchParams.get('code')?.trim() || '';

  const isMatchCard = Boolean(home && away);
  const mainHeading = isMatchCard
    ? `${home} vs ${away}`
    : title || 'PredictPro — Quantitative Football Intelligence';
  const subHeading = isMatchCard
    ? `${league} · Bivariate Poisson & Expected Goals (xG) Model`
    : subtitle || 'Daily Verified AI Football Predictions, +EV Value Bets & Poisson Matrices';

  const homeInitials = isMatchCard ? getInitials(home) : 'PP';
  const awayInitials = isMatchCard ? getInitials(away) : 'AI';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#090D16" />
      <stop offset="55%" stop-color="#111827" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />
  <rect x="32" y="32" width="1136" height="566" rx="24" fill="#111827" fill-opacity="0.7" stroke="#1E293B" stroke-width="2" />

  <!-- Top Brand Bar -->
  <rect x="68" y="64" width="48" height="48" rx="12" fill="#10B981" />
  <text x="92" y="96" fill="#06281E" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" text-anchor="middle">PP</text>
  <text x="132" y="86" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="800">PredictPro</text>
  <text x="132" y="108" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600">predictpro.guru · Quantitative Football Analytics</text>

  <!-- Confidence Pill Top Right -->
  <rect x="910" y="64" width="222" height="48" rx="12" fill="#064E3B" stroke="#10B981" stroke-width="1.5" />
  <text x="1021" y="94" fill="#34D399" font-family="ui-monospace, SFMono-Regular, monospace" font-size="18" font-weight="800" text-anchor="middle">${escapeSvg(String(conf))}% AI CONFIDENCE</text>

  <!-- League / Category Kicker -->
  <text x="68" y="166" fill="#10B981" font-family="ui-monospace, SFMono-Regular, monospace" font-size="16" font-weight="700" letter-spacing="1.5">${escapeSvg(subHeading.toUpperCase().slice(0, 78))}</text>

  <!-- Main Matchup / Headline -->
  <text x="68" y="228" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="${mainHeading.length > 34 ? '40' : '48'}" font-weight="900">${escapeSvg(mainHeading.slice(0, 46))}</text>

  ${
    isMatchCard
      ? `
  <!-- Matchup Shields & Telemetry Row -->
  <rect x="68" y="266" width="1064" height="196" rx="18" fill="#0B1120" stroke="#1E293B" stroke-width="1.5" />

  <!-- Home Club Shield -->
  <circle cx="156" cy="364" r="52" fill="#1E293B" stroke="#334155" stroke-width="2" />
  <text x="156" y="374" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" text-anchor="middle">${escapeSvg(homeInitials)}</text>
  <text x="230" y="352" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700">HOME CLUB</text>
  <text x="230" y="384" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800">${escapeSvg(home.slice(0, 20))}</text>

  <!-- Center Projection Metric Box -->
  <rect x="468" y="292" width="264" height="144" rx="14" fill="#064E3B" fill-opacity="0.45" stroke="#10B981" stroke-width="1.5" />
  <text x="600" y="324" fill="#A7F3D0" font-family="ui-monospace, SFMono-Regular, monospace" font-size="13" font-weight="700" text-anchor="middle">PROJECTED OUTCOME</text>
  <text x="600" y="362" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="900" text-anchor="middle">${escapeSvg(tip.slice(0, 20))}</text>
  <text x="600" y="396" fill="#34D399" font-family="ui-monospace, SFMono-Regular, monospace" font-size="16" font-weight="700" text-anchor="middle">xG: ${escapeSvg(xg)} · Score: ${escapeSvg(score)}</text>
  <text x="600" y="420" fill="#94A3B8" font-family="ui-monospace, SFMono-Regular, monospace" font-size="12" font-weight="600" text-anchor="middle">Dixon-Coles Poisson Matrix</text>

  <!-- Away Club Shield -->
  <circle cx="1044" cy="364" r="52" fill="#1E293B" stroke="#334155" stroke-width="2" />
  <text x="1044" y="374" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" text-anchor="middle">${escapeSvg(awayInitials)}</text>
  <text x="970" y="352" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" text-anchor="end">AWAY CLUB</text>
  <text x="970" y="384" fill="#F8FAFC" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="800" text-anchor="end">${escapeSvg(away.slice(0, 20))}</text>
  `
      : `
  <!-- Hub / Accumulator Slip Telemetry Box -->
  <rect x="68" y="266" width="1064" height="196" rx="18" fill="#0B1120" stroke="#1E293B" stroke-width="1.5" />
  <text x="108" y="324" fill="#94A3B8" font-family="ui-monospace, SFMono-Regular, monospace" font-size="15" font-weight="700">PRIMARY SELECTION / MARKET</text>
  <text x="108" y="368" fill="#34D399" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900">${escapeSvg(tip.slice(0, 38))}</text>
  <text x="108" y="414" fill="#E2E8F0" font-family="ui-monospace, SFMono-Regular, monospace" font-size="18" font-weight="600">${code ? `Booking Code: ${escapeSvg(code)} · ` : ''}Model Accuracy: 87.2% Verified Strike Rate</text>
  `
  }

  <!-- Footer Attribution Bar -->
  <text x="68" y="542" fill="#94A3B8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">40+ Global Football Leagues · Expected Goals (xG) · H2H Analytics · +EV Value Scanner</text>
  <text x="1132" y="542" fill="#10B981" font-family="ui-monospace, SFMono-Regular, monospace" font-size="16" font-weight="800" text-anchor="end">https://predictpro.guru</text>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
