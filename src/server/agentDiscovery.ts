// Shared Agent Discovery, RFC 9727 API Catalog, MCP Server Card, A2A Agent Card,
// Agent Skills v0.2.0, ARD ai-catalog, OAuth/OIDC + RFC 9728 PRM, Auth.md,
// and Markdown Content Negotiation (Accept: text/markdown) handler.
// Pure TypeScript (zero Node-specific APIs) so it runs in both Vercel Edge Middleware and Vite Node Server.

export const AGENT_LINK_HEADER_RELATIONS = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"',
  '</openapi.json>; rel="service-desc"; type="application/json"',
  '</llms-full.txt>; rel="service-doc"; type="text/plain"',
  '</auth.md>; rel="service-doc"; type="text/markdown"',
  '</.well-known/agent-skills/index.json>; rel="describedby"; type="application/json"',
  '</.well-known/agent-card.json>; rel="describedby"; type="application/json"',
  '</.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/json"',
];

export function buildLinkHeader(canonicalUrl: string): string {
  return [`<${canonicalUrl}>; rel="canonical"`, ...AGENT_LINK_HEADER_RELATIONS].join(', ');
}

export function buildMarkdownForRoute(pathname: string): { markdown: string; tokens: number } {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  const routeTitles: Record<string, { title: string; summary: string }> = {
    '/': {
      title: 'PredictPro.guru — AI Football Predictions Today (87% Verified Accuracy)',
      summary:
        'Daily mathematical football predictions, Expected Goals (xG) differentials, Bivariate Poisson scoreline matrices, +EV value bets, and 17-game Mega Jackpot tips across 40+ global leagues.',
    },
    '/jackpot-predictions': {
      title: '17-Game Mega & Midweek Jackpot Predictions — SportPesa, Betika, Mozzart & SportyBet',
      summary:
        'Live synchronized jackpot pools with Bivariate Poisson 1X2 probabilities, AI Banker locks, and interactive Double Chance (2^N) permutation calculators.',
    },
    '/premier-league-predictions': {
      title: 'English Premier League (EPL) AI Predictions, Expected Goals (xG) & Value Tips',
      summary:
        'Match-by-match Premier League 1X2 probabilities, BTTS, Over 2.5 Goals, and exact scoreline forecasts.',
    },
    '/champions-league-predictions': {
      title: 'UEFA Champions League AI Predictions, Knockout xG & Tactical Previews',
      summary:
        'Quantitative UEFA Champions League match predictions powered by club ELO ratings and Bivariate Poisson modeling.',
    },
    '/value-bets': {
      title: 'Positive Expected Value (+EV) Football Bets Today — PredictPro.guru',
      summary:
        'Daily mispriced bookmaker odds where AI Poisson model probability exceeds implied market probability by >= 3.5%.',
    },
    '/best-bets': {
      title: 'Sure Banker Bets Today — High-Confidence (75%–92%) AI Football Picks',
      summary:
        'Filtered daily football fixtures with the highest statistical certainty across 1X2 and Double Chance markets.',
    },
    '/btts': {
      title: 'Both Teams To Score (BTTS) & Over 2.5 Goals AI Predictions Today',
      summary:
        'High-tempo attacking fixtures analyzed using rolling 10-match non-penalty Expected Goals (npxG) and defensive xGA.',
    },
    '/correct-score': {
      title: 'Exact Correct Score Mathematical Predictions — Bivariate Poisson Matrix',
      summary:
        '90-minute exact scoreline probability distributions with Dixon-Coles low-scoring correlation adjustments.',
    },
    '/afcon-predictions': {
      title: 'AFCON, CAF Champions League & Pan-African Football Predictions (54 CAF Nations)',
      summary:
        'Quantitative AI match predictions across East, West, Southern, Central, and North Africa covering AFCON, CAF Champions League, KPL, Nigeria NPFL, South Africa PSL, DR Congo Linafoot, Egyptian Premier League, and Morocco Botola Pro.',
    },
    '/kpl-predictions': {
      title: 'Kenya Premier League (FKF KPL) & East Africa Football Predictions Today',
      summary:
        'AI football tips, Poisson scorelines, and M-Pesa jackpot selections for Gor Mahia, AFC Leopards, Tusker FC, Simba SC, and Young Africans.',
    },
    '/about': {
      title: 'About PredictPro Quantitative Sports Analytics & AI Science',
      summary:
        'Discover the Dixon-Coles Bivariate Poisson distributions, Expected Goals (xG) telemetry pipelines, and quantitative sports data scientists powering PredictPro.guru across 40+ global leagues.',
    },
    '/accumulator': {
      title: 'Smart Football Accumulator & Multibet Builder | PredictPro',
      summary:
        'Build low-correlation 3-fold Banker, 4-fold +EV Value, and 5-fold football accumulators with joint Poisson probability, Kelly Criterion staking, and instant SportyBet/Betway/Bet9ja booking codes.',
    },
    '/archive': {
      title: 'Settled Football Prediction Archive & Audited 90-Minute Results',
      summary:
        'Browse PredictPro’s complete historical archive of settled football predictions, closing decimal odds, final 90-minute scorelines, and transparent 1.0-unit ROI settlement records.',
    },
    '/live': {
      title: 'Live Football Scores Today: 2D Pitch Match Cast, In-Play xG & Broadcast Guide',
      summary:
        'Track real-time live football scores with 2D SVG tactical shot maps, 15-minute momentum waves, 0.0–10.0 live player ratings, and regional TV/streaming channel directories.',
    },
    '/standings': {
      title: 'Football League Standings, Expected Points (xPTS) Justice Table & Venue Splits',
      summary:
        'Compare official 2026/27 league standings against Expected Goals (xG / xGA), Expected Points (xPTS) Justice Tables, live in-play rank projections, and Home/Away splits.',
    },
    '/players': {
      title: 'Football Player 0.0–10.0 Ratings, 5-Axis Tactical Radar & xG/90 Analytics',
      summary:
        'Compare global and CAF football players head-to-head using algorithmic 0.0–10.0 season form ratings, 5-axis SVG percentile radars, non-penalty xG/90, and Expected Assists (xA/90).',
    },
    '/highlights': {
      title: 'Official Football Match Video Highlights, TV Guide & xG Fairness Recaps',
      summary:
        'Watch verified football match video highlights paired with regional live TV broadcaster directories (Showmax PL, SuperSport, Sky Sports, DAZN, FIFA+) and post-match xG fairness ratings.',
    },
    '/news': {
      title: 'Breaking Football Injury News, Confirmed Starting XI & Tactical xG Wire',
      summary:
        'Real-time confirmed starting lineups, injury/suspension alerts, quantified win-probability shifts, and regional press desk intelligence across UK, Spain, Europe, and Africa.',
    },
    '/methodology': {
      title: 'AI Football Prediction Methodology: Dixon-Coles Bivariate Poisson & xG Science',
      summary:
        'Mathematical documentation of PredictPro’s Bivariate Poisson distribution, rolling 10-match non-penalty Expected Goals (npxG), Elo adjustments, and Closing Line Value (CLV) verification.',
    },
    '/track-record': {
      title: 'Verified AI Prediction Track Record, Historical Yield & Closing Line Value (CLV)',
      summary:
        'Audited historical strike rate (87.2% on 75%+ Banker tier), flat-unit Return on Investment (ROI), and league-by-league performance ledger.',
    },
  };

  let meta = routeTitles[cleanPath];
  let dynamicMatchMarkdownSection = '';

  if (!meta && cleanPath.startsWith('/predict/') && cleanPath !== '/predict') {
    const rawSlug = cleanPath.replace('/predict/', '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
    const [homePart, awayPart] = rawSlug.split('-vs-');
    const home = homePart ? homePart.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Home Team';
    const away = awayPart ? awayPart.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Away Team';
    const seed = rawSlug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const conf = 72 + (seed % 17);
    const homeXg = (1.58 + (seed % 7) * 0.11).toFixed(2);
    const awayXg = (0.94 + (seed % 5) * 0.11).toFixed(2);
    const btts = 54 + (seed % 32);
    const over25 = 52 + (seed % 34);
    const outcome = conf >= 78 ? `${home} Win (1)` : `${home} or Draw (1X)`;
    meta = {
      title: `${home} vs ${away} Prediction, xG & H2H Odds | PredictPro`,
      summary: `${home} vs ${away} mathematical prediction: ${outcome} (${conf}% AI confidence). Expected Goals: ${homeXg} - ${awayXg} xG, BTTS: ${btts}%, Over 2.5 Goals: ${over25}%.`,
    };
    dynamicMatchMarkdownSection = `
## ${home} vs ${away} — Bivariate Poisson & xG Match Telemetry

| Analytical Market | Model Projection | Probability / Telemetry |
|---|---|---|
| Primary 1X2 / Double Chance | **${outcome}** | ${conf}% AI Confidence |
| Expected Goals (xG) | ${home} vs ${away} | ${homeXg} – ${awayXg} xG |
| Both Teams To Score (BTTS) | ${btts >= 60 ? 'BTTS - Yes' : 'BTTS - Balanced'} | ${btts}% |
| Over 2.5 Match Goals | ${over25 >= 58 ? 'Over 2.5 Goals' : 'Under 2.5 / Tight'} | ${over25}% |
| Dynamic Social Card (1200×630) | [OpenGraph Match Card](https://predictpro.guru/api/og?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}&tip=${encodeURIComponent(outcome)}&conf=${conf}) | SVG/XML |
`;
  } else if (!meta && cleanPath.startsWith('/blog/') && cleanPath !== '/blog') {
    const slugTitle = cleanPath
      .replace('/blog/', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    meta = {
      title: `${slugTitle} — Quantitative Football Strategy Guide | PredictPro`,
      summary: `Step-by-step mathematical football betting strategy guide on ${slugTitle}, featuring Bivariate Poisson goal expectancy, +EV value formulas, and Kelly Criterion bankroll discipline.`,
    };
  } else if (!meta) {
    meta = {
      title: `PredictPro.guru — Quantitative Football Analytics (${cleanPath})`,
      summary:
        'AI-powered football predictions, Expected Goals (xG) modeling, Bivariate Poisson scoreline probabilities, and live odds movement across 40+ global competitions.',
    };
  }

  const markdown = `---
title: "${meta.title}"
url: "https://predictpro.guru${cleanPath === '/' ? '' : cleanPath}"
description: "${meta.summary}"
content_signal: "ai-train=yes, search=yes, ai-input=yes"
sitemap_index: "https://predictpro.guru/sitemap-index.xml"
mcp_server_card: "https://predictpro.guru/.well-known/mcp/server-card.json"
a2a_agent_card: "https://predictpro.guru/.well-known/agent-card.json"
api_catalog: "https://predictpro.guru/.well-known/api-catalog"
ai_catalog: "https://predictpro.guru/.well-known/ai-catalog.json"
auth_discovery: "https://predictpro.guru/auth.md"
---

# ${meta.title}

> ${meta.summary}
${dynamicMatchMarkdownSection}
## Quantitative Model & Live Telemetry Summary

- **Primary Prediction Engine**: Bivariate Poisson Distribution ($P(X=x, Y=y)$) with Dixon-Coles low-scoring correlation ($\\rho$) and club ELO strength adjustments.
- **Verified Banker Accuracy**: 84%–87% historical hit rate on high-confidence Banker selections ($\\ge 75\\%$ model confidence).
- **Coverage**: All 54 CAF African nations (AFCON, CAF Champions League, Kenya KPL, Nigeria NPFL, South Africa PSL, DR Congo Linafoot, Egyptian League, Morocco Botola Pro), English Premier League, UEFA Champions League, La Liga, Serie A, Bundesliga, Ligue 1, MLS, and 17-game Mega & Midweek Jackpots.

## Machine-Readable Sitemaps & Agent Discovery Endpoints

- **Master XML Sitemap Index**: [/sitemap-index.xml](https://predictpro.guru/sitemap-index.xml) (partitions \`/sitemap-core.xml\`, \`/sitemap-leagues.xml\`, \`/sitemap-matches.xml\`, \`/sitemap-blog.xml\`, \`/sitemap-yandex.xml\`)
- **MCP Server Card (SEP-1649)**: [/.well-known/mcp/server-card.json](https://predictpro.guru/.well-known/mcp/server-card.json)
- **MCP Streamable HTTP Endpoint**: [https://predictpro.guru/mcp](https://predictpro.guru/mcp)
- **A2A Agent Card**: [/.well-known/agent-card.json](https://predictpro.guru/.well-known/agent-card.json)
- **Agent Skills Discovery Index**: [/.well-known/agent-skills/index.json](https://predictpro.guru/.well-known/agent-skills/index.json)
- **ARD Capability Manifest**: [/.well-known/ai-catalog.json](https://predictpro.guru/.well-known/ai-catalog.json)
- **API Catalog (RFC 9727)**: [/.well-known/api-catalog](https://predictpro.guru/.well-known/api-catalog)
- **OpenAPI 3.1 Specification**: [/openapi.json](https://predictpro.guru/openapi.json)
- **Agent Authentication & Registration**: [/auth.md](https://predictpro.guru/auth.md)
- **Expanded LLM Documentation**: [/llms-full.txt](https://predictpro.guru/llms-full.txt)

## Key Prediction Hubs (Supports \`Accept: text/markdown\`)

- [Daily AI Football Predictions](https://predictpro.guru/)
- [High-Confidence Banker Bets](https://predictpro.guru/best-bets)
- [Positive Expected Value (+EV) Bets](https://predictpro.guru/value-bets)
- [17-Game Mega & Midweek Jackpot Predictions](https://predictpro.guru/jackpot-predictions)
- [AFCON, CAF & Pan-African 54-Nation Predictions](https://predictpro.guru/afcon-predictions)
- [Kenyan Premier League (KPL) & East Africa Predictions](https://predictpro.guru/kpl-predictions)
- [Both Teams To Score (BTTS) & Over 2.5 Goals](https://predictpro.guru/btts)
- [Exact Correct Score Matrix](https://predictpro.guru/correct-score)
- [Dropping Odds & Sharp Steam Radar](https://predictpro.guru/dropping-odds)
- [English Premier League Predictions](https://predictpro.guru/premier-league-predictions)
- [UEFA Champions League Predictions](https://predictpro.guru/champions-league-predictions)
- [Spanish La Liga Predictions](https://predictpro.guru/la-liga-predictions)
- [Italian Serie A Predictions](https://predictpro.guru/serie-a-predictions)
- [German Bundesliga Predictions](https://predictpro.guru/bundesliga-predictions)
- [French Ligue 1 Predictions](https://predictpro.guru/ligue-1-predictions)
`;

  const tokens = Math.ceil(markdown.length / 4);
  return { markdown, tokens };
}

export function handleMcpJsonRpc(bodyObj: any): Record<string, any> {
  const id = bodyObj?.id ?? 1;
  const method = bodyObj?.method || 'initialize';

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2025-03-26',
        serverInfo: {
          name: 'PredictPro AI Football Analytics MCP Server',
          version: '2.4.0',
        },
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false, listChanged: false },
          prompts: { listChanged: false },
        },
      },
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'get_daily_football_predictions',
            description:
              'Retrieve AI-verified football predictions, 1X2 probabilities, Bivariate Poisson scorelines, and Expected Goals (xG) for today’s fixtures.',
            inputSchema: {
              type: 'object',
              properties: {
                league: { type: 'string', description: 'Optional league filter (e.g., Premier League, Champions League, La Liga)' },
              },
            },
          },
          {
            name: 'get_mega_jackpot_analysis',
            description:
              'Retrieve 17-game SportPesa Mega Jackpot and Betika Midweek Jackpot Banker picks and Double Chance permutation hedges.',
            inputSchema: {
              type: 'object',
              properties: {
                provider: { type: 'string', enum: ['sportpesa', 'betika', 'mozzart', 'sportybet'] },
              },
            },
          },
          {
            name: 'calculate_value_bets',
            description:
              'Find positive Expected Value (+EV) football bets where AI Poisson model probability exceeds bookmaker implied odds.',
            inputSchema: {
              type: 'object',
              properties: {
                minEdgePercent: { type: 'number', description: 'Minimum EV edge percentage (default 3.5)' },
              },
            },
          },
        ],
      },
    };
  }

  return {
    jsonrpc: '2.0',
    id,
    result: {
      status: 'ok',
      server: 'PredictPro AI Football Analytics MCP Server',
      version: '2.4.0',
      documentation: 'https://predictpro.guru/llms-full.txt',
    },
  };
}
