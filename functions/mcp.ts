/**
 * Cloudflare Pages Function for /mcp endpoint
 */
import mcpHandler from '../api/mcp';

export async function onRequest(context: { request: Request }): Promise<Response> {
  return mcpHandler(context.request);
}
