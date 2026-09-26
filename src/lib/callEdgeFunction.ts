import { supabase, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '@/integrations/supabase/client';

export const SUPABASE_URL = DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = DEFAULT_SUPABASE_ANON_KEY;

// Track functions that failed CORS/network preflight in this session to avoid repeated console errors
const edgeFunctionCooldowns = new Map<string, number>();
let localApiProxyUnavailable = false;
const COOLDOWN_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function isFnInCooldown(name: string): boolean {
  const exp = edgeFunctionCooldowns.get(name);
  if (!exp) return false;
  if (Date.now() > exp) {
    edgeFunctionCooldowns.delete(name);
    return false;
  }
  return true;
}

function setFnCooldown(name: string) {
  edgeFunctionCooldowns.set(name, Date.now() + COOLDOWN_DURATION_MS);
}

export async function callEdgeFn(name: string, body?: unknown, userToken?: string, timeoutMs: number = 8000): Promise<any> {
  // If the function is gemini-tasks and in browser, prefer local proxy /api/gemini-tasks if available
  if (name === 'gemini-tasks' && typeof window !== 'undefined' && !localApiProxyUnavailable) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(timeoutMs, 4500));
      const proxyRes = await fetch('/api/gemini-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (proxyRes.ok) {
        const contentType = proxyRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return await proxyRes.json();
        }
      }
      // Static hosts return 404 or index.html (text/html) for /api/* routes
      if (proxyRes.status === 404 || proxyRes.status === 405 || !(proxyRes.headers.get('content-type') || '').includes('application/json')) {
        localApiProxyUnavailable = true;
      }
    } catch {
      localApiProxyUnavailable = true;
    }
  }

  // Check if this edge function is in cooldown due to prior CORS/network error
  if (isFnInCooldown(name)) {
    const cooldownErr: any = new Error(`Edge function ${name} is in fallback mode`);
    cooldownErr.status = 503;
    cooldownErr.isCooldown = true;
    throw cooldownErr;
  }

  // Use configured supabase client with timeout & automatic token handling
  try {
    const headers: Record<string, string> = {};
    if (userToken) {
      headers.Authorization = `Bearer ${userToken}`;
    }

    const invokePromise = supabase.functions.invoke(name, {
      body,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const abortErr = new Error(`Edge function ${name} timed out`);
        abortErr.name = 'AbortError';
        reject(abortErr);
      }, timeoutMs);
    });

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

    if (error) {
      // If CORS preflight or network fetch failed, place function in cooldown
      const msg = String(error.message || '');
      if (msg.includes('Failed to fetch') || msg.includes('CORS') || msg.includes('NetworkError') || msg.includes('FunctionsFetchError')) {
        setFnCooldown(name);
      }
      const errObj: any = new Error(msg || `Edge function ${name} invocation failed`);
      errObj.status = (error as any).status || 500;
      throw errObj;
    }

    return data;
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (
      e?.name === 'AbortError' ||
      msg.includes('Failed to fetch') ||
      msg.includes('timed out') ||
      msg.includes('aborted') ||
      msg.includes('NetworkError') ||
      msg.includes('FunctionsFetchError')
    ) {
      setFnCooldown(name);
    }
    throw e;
  }
}

