import { supabase, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '@/integrations/supabase/client';

export const SUPABASE_URL = DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = DEFAULT_SUPABASE_ANON_KEY;

export async function callEdgeFn(name: string, body?: unknown, userToken?: string, timeoutMs: number = 12000): Promise<any> {
  // If the function is gemini-tasks and in browser, prefer local proxy /api/gemini-tasks
  if (name === 'gemini-tasks' && typeof window !== 'undefined') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(timeoutMs, 6000));
      const proxyRes = await fetch('/api/gemini-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (proxyRes.ok) {
        return await proxyRes.json();
      }
    } catch {
      // Continue to Supabase functions invoke
    }
  }

  // Use configured supabase client with automatic token and origin handling
  try {
    const headers: Record<string, string> = {};
    if (userToken) {
      headers.Authorization = `Bearer ${userToken}`;
    }

    const { data, error } = await supabase.functions.invoke(name, {
      body,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    if (error) {
      const errObj: any = new Error(error.message || `Edge function ${name} invocation failed`);
      errObj.status = (error as any).status || 500;
      throw errObj;
    }

    return data;
  } catch (e: any) {
    // If it's a network/abort error, keep debug quiet to prevent console noise
    if (e?.name !== 'AbortError' && !e?.message?.includes?.('aborted') && !e?.message?.includes?.('Failed to fetch')) {
      console.warn(`[callEdgeFn] Invocation notice for ${name}:`, e?.message || e);
    }
    throw e;
  }
}

