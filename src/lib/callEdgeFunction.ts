export const SUPABASE_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ';

export async function callEdgeFn(name: string, body?: unknown, userToken?: string, timeoutMs: number = 8000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort();
    } catch {}
  }, timeoutMs);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken ?? SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`${name}: ${res.status}`);
    return await res.json();
  } catch (e: any) {
    clearTimeout(timeoutId);
    if (e?.name === 'AbortError' || e?.message?.includes?.('aborted')) {
      console.warn(`[callEdgeFn] Call to ${name} timed out or was aborted.`);
    }
    throw e;
  }
}
