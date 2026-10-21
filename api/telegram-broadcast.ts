import { handleTelegramRequest, TelegramRequestPayload } from '../src/server/telegramHandler';

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

  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode');
    const queryAction = url.searchParams.get('action') as TelegramRequestPayload['action'] | null;

    let payload: TelegramRequestPayload = {
      action: queryAction || (mode === 'config' ? 'get_config' : 'check_bot'),
    };
    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as TelegramRequestPayload;
      payload = {
        ...body,
        action: body.action || queryAction || (mode === 'config' ? 'configure_bot' : 'check_bot'),
      };
    }

    const result = await handleTelegramRequest(payload);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Telegram API execution failed',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
