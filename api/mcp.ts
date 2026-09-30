import { handleMcpJsonRpc } from '../src/server/agentDiscovery';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  let bodyObj: any = {};
  if (request.method === 'POST') {
    try {
      bodyObj = await request.json();
    } catch {
      bodyObj = {};
    }
  }

  return new Response(JSON.stringify(handleMcpJsonRpc(bodyObj)), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}
