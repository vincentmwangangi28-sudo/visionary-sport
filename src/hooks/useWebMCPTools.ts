import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface WebMCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
  execute: (params: Record<string, unknown>) => Promise<unknown> | unknown;
}

interface ModelContextContainer {
  registerTool?: (tool: WebMCPToolDefinition) => void;
  unregisterTool?: (name: string) => void;
  provideContext?: (context: { tools: WebMCPToolDefinition[] }) => void;
}

/**
 * Registers PredictPro AI Football Prediction tools with the browser's
 * Web Model Context Protocol (WebMCP) API (`navigator.modelContext` / `document.modelContext`)
 * so Chrome Agentic Browsing & AI Assistants can discover and invoke site capabilities.
 */
export function useWebMCPTools(): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tools: WebMCPToolDefinition[] = [
      {
        name: 'search_football_predictions',
        description:
          'Search daily AI football match predictions, Expected Goals (xG) statistics, and betting tips by club or competition.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Club name, matchup, or league name (e.g. Arsenal, Premier League, Real Madrid)',
            },
          },
          required: ['query'],
        },
        execute: async (params) => {
          const q = String(params?.query || '').trim();
          const target = q ? `/predict?q=${encodeURIComponent(q)}` : '/predict';
          navigate(target);
          return {
            status: 'ok',
            navigatedTo: target,
            message: `Opened PredictPro AI Match Predictor for "${q || 'all fixtures'}"`,
          };
        },
      },
      {
        name: 'view_prediction_market_hub',
        description:
          'Navigate directly to a specialized AI football prediction market hub (Banker Bets, Value Bets +EV, BTTS & Over 2.5, Correct Score, Accumulator Builder, or Mega Jackpot).',
        inputSchema: {
          type: 'object',
          properties: {
            market: {
              type: 'string',
              description: 'Target football prediction market hub',
              enum: [
                'best-bets',
                'value-bets',
                'btts',
                'correct-score',
                'accumulator',
                'jackpot-predictions',
                'dropping-odds',
                'live',
              ],
            },
          },
          required: ['market'],
        },
        execute: async (params) => {
          const market = String(params?.market || 'best-bets').replace(/^\/+/, '');
          const target = `/${market}`;
          navigate(target);
          return {
            status: 'ok',
            navigatedTo: target,
            message: `Navigated to PredictPro ${market} hub`,
          };
        },
      },
      {
        name: 'open_member_signup_modal',
        description:
          'Open the PredictPro free account creation dialog so the user can save bet slips and claim 50 welcome coins.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        execute: async () => {
          window.dispatchEvent(new CustomEvent('open-first-visit-signup'));
          return {
            status: 'ok',
            message: 'Opened PredictPro free account registration dialog',
          };
        },
      },
    ];

    const navContext = (navigator as unknown as { modelContext?: ModelContextContainer }).modelContext;
    const docContext = (document as unknown as { modelContext?: ModelContextContainer }).modelContext;
    const targets = [navContext, docContext].filter(Boolean) as ModelContextContainer[];

    for (const ctx of targets) {
      try {
        if (typeof ctx.registerTool === 'function') {
          for (const tool of tools) {
            try {
              ctx.unregisterTool?.(tool.name);
            } catch {
              // Ignore if not previously registered
            }
            ctx.registerTool(tool);
          }
        } else if (typeof ctx.provideContext === 'function') {
          ctx.provideContext({ tools });
        }
      } catch {
        // Ignore experimental browser WebMCP API differences
      }
    }

    return () => {
      for (const ctx of targets) {
        try {
          if (typeof ctx.unregisterTool === 'function') {
            for (const tool of tools) {
              ctx.unregisterTool(tool.name);
            }
          }
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [navigate]);
}
