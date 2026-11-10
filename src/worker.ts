/**
 * Cloudflare Worker Entrypoint (Static Assets + /api/* & /mcp Serverless Router)
 * Supports `npx wrangler deploy` for project `visionary-sport`.
 */
import { onRequest as handleApiRequest } from '../functions/api/[[path]]';
import mcpHandler from '../api/mcp';

export interface Env {
  ASSETS?: {
    fetch: (request: Request | string) => Promise<Response>;
  };
  [key: string]: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Handle /mcp agentic protocol discovery
    if (url.pathname === '/mcp' || url.pathname === '/api/a2a') {
      return mcpHandler(request);
    }

    // 2. Handle all /api/* serverless endpoints
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest({ request, env });
    }

    // 3. Delegate static assets & SPA routes to Cloudflare Assets binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('PredictPro Worker Running', { status: 200 });
  },
};
