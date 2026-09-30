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
  };

  const meta = routeTitles[cleanPath] || {
    title: `PredictPro.guru — Quantitative Football Analytics (${cleanPath})`,
    summary:
      'AI-powered football predictions, Expected Goals (xG) modeling, Bivariate Poisson scoreline probabilities, and live odds movement across 40+ global competitions.',
  };

  const markdown = `---
title: "${meta.title}"
url: "https://predictpro.guru${cleanPath === '/' ? '' : cleanPath}"
description: "${meta.summary}"
content_signal: "ai-train=yes, search=yes, ai-input=yes"
mcp_server_card: "https://predictpro.guru/.well-known/mcp/server-card.json"
a2a_agent_card: "https://predictpro.guru/.well-known/agent-card.json"
api_catalog: "https://predictpro.guru/.well-known/api-catalog"
ai_catalog: "https://predictpro.guru/.well-known/ai-catalog.json"
auth_discovery: "https://predictpro.guru/auth.md"
---

# ${meta.title}

> ${meta.summary}

## Quantitative Model & Live Telemetry Summary

- **Primary Prediction Engine**: Bivariate Poisson Distribution ($P(X=x, Y=y)$) with Dixon-Coles low-scoring correlation ($\\rho$) and club ELO strength adjustments.
- **Verified Banker Accuracy**: 84%–87% historical hit rate on high-confidence Banker selections ($\\ge 75\\%$ model confidence).
- **Coverage**: English Premier League, UEFA Champions League, La Liga, Serie A, Bundesliga, Ligue 1, Kenyan Premier League (KPL), MLS, and 17-game Mega & Midweek Jackpots.

## Machine-Readable Agent Discovery Endpoints

- **MCP Server Card (SEP-1649)**: [/.well-known/mcp/server-card.json](https://predictpro.guru/.well-known/mcp/server-card.json)
- **MCP Streamable HTTP Endpoint**: [https://predictpro.guru/mcp](https://predictpro.guru/mcp)
- **A2A Agent Card**: [/.well-known/agent-card.json](https://predictpro.guru/.well-known/agent-card.json)
- **Agent Skills Discovery Index**: [/.well-known/agent-skills/index.json](https://predictpro.guru/.well-known/agent-skills/index.json)
- **ARD Capability Manifest**: [/.well-known/ai-catalog.json](https://predictpro.guru/.well-known/ai-catalog.json)
- **API Catalog (RFC 9727)**: [/.well-known/api-catalog](https://predictpro.guru/.well-known/api-catalog)
- **OpenAPI 3.1 Specification**: [/openapi.json](https://predictpro.guru/openapi.json)
- **Agent Authentication & Registration**: [/auth.md](https://predictpro.guru/auth.md)
- **OAuth Protected Resource Metadata**: [/.well-known/oauth-protected-resource](https://predictpro.guru/.well-known/oauth-protected-resource)
- **OAuth Authorization Server Metadata**: [/.well-known/oauth-authorization-server](https://predictpro.guru/.well-known/oauth-authorization-server)
- **Expanded LLM Documentation**: [/llms-full.txt](https://predictpro.guru/llms-full.txt)

## Key Prediction Hubs (Supports \`Accept: text/markdown\`)

- [Daily AI Football Predictions](https://predictpro.guru/)
- [High-Confidence Banker Bets](https://predictpro.guru/best-bets)
- [Positive Expected Value (+EV) Bets](https://predictpro.guru/value-bets)
- [17-Game Mega & Midweek Jackpot Predictions](https://predictpro.guru/jackpot-predictions)
- [Both Teams To Score (BTTS) & Over 2.5 Goals](https://predictpro.guru/btts)
- [Exact Correct Score Matrix](https://predictpro.guru/correct-score)
- [Dropping Odds & Sharp Steam Radar](https://predictpro.guru/dropping-odds)
- [English Premier League Predictions](https://predictpro.guru/premier-league-predictions)
- [UEFA Champions League Predictions](https://predictpro.guru/champions-league-predictions)
- [Spanish La Liga Predictions](https://predictpro.guru/la-liga-predictions)
- [Italian Serie A Predictions](https://predictpro.guru/serie-a-predictions)
- [German Bundesliga Predictions](https://predictpro.guru/bundesliga-predictions)
- [French Ligue 1 Predictions](https://predictpro.guru/ligue-1-predictions)
- [Kenyan Premier League (KPL) Predictions](https://predictpro.guru/kpl-predictions)
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
