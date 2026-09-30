import { buildLinkHeader, buildMarkdownForRoute } from '../src/server/agentDiscovery';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const targetPath = url.searchParams.get('path') || url.pathname || '/';
  const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const canonical = cleanPath === '/' ? 'https://predictpro.guru/' : `https://predictpro.guru${cleanPath}`;
  const { markdown, tokens } = buildMarkdownForRoute(cleanPath);

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept',
      'X-Markdown-Tokens': String(tokens),
      'Content-Signal': 'ai-train=yes, search=yes, ai-input=yes',
      'Link': buildLinkHeader(canonical),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
