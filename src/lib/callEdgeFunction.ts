// Direct fetch to edge function - bypasses supabase client auth issues
const SUPABASE_URL = 'https://bhgjlhgevyggkhyytulv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZ2psaGdldnlnZ2toeXl0dWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NzYzNzksImV4cCI6MjA5MzI1MjM3OX0.2Ol0F5WXfWD-T3rqeWwHQ4VCFaqKyaGXIfU3urNn5nQ';

export async function callEdgeFn(name: string, body?: unknown, userToken?: string): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken ?? ANON_KEY}`,
      'apikey': ANON_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge function ${name} failed: ${res.status} ${text}`);
  }
  return res.json();
}
