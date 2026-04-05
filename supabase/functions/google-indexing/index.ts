import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const BATCH_INDEXING_URL = 'https://indexing.googleapis.com/batch';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function base64url(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createJWT(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import the private key for signing
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/[\n\r\s]/g, '');

  // Decode base64 to binary using a safe method
  const binaryString = atob(pemContents);
  const binaryKey = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    binaryKey[i] = binaryString.charCodeAt(i);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64url(String.fromCharCode(...new Uint8Array(signature)));
  return `${unsignedToken}.${signatureB64}`;
}

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const jwt = await createJWT(serviceAccount);

  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to get access token: ${resp.status} ${err}`);
  }

  const data = await resp.json();
  return data.access_token;
}

async function submitUrl(accessToken: string, url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<{ url: string; success: boolean; status?: number; error?: string }> {
  try {
    const resp = await fetch(INDEXING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type }),
    });

    const data = await resp.json();
    return { url, success: resp.ok, status: resp.status, error: resp.ok ? undefined : JSON.stringify(data) };
  } catch (e) {
    return { url, success: false, error: (e as Error).message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON secret not configured');
    }

    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    // Parse request body for URLs
    let urls: string[] = [];
    let type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED';

    if (req.method === 'POST') {
      const body = await req.json();
      urls = body.urls || [];
      type = body.type || 'URL_UPDATED';
    }

    if (urls.length === 0) {
      // If no URLs provided, fetch from database
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const BASE_URL = 'https://predictpro.guru';
      const staticRoutes = ['/', '/leaderboard', '/performance', '/news', '/insights', '/about', '/rewards', '/shop'];
      urls = staticRoutes.map(r => `${BASE_URL}${r}`);

      // Add match pages
      const { data: predictions } = await supabase.from('predictions')
        .select('match_id')
        .gte('match_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (predictions) {
        const uniqueIds = new Set(predictions.map(p => p.match_id));
        uniqueIds.forEach(id => urls.push(`${BASE_URL}/match/${id}`));
      }

      // Add news articles
      const { data: articles } = await supabase.from('news_articles')
        .select('slug')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (articles) {
        articles.forEach(a => { if (a.slug) urls.push(`${BASE_URL}/news/${a.slug}`); });
      }
    }

    // Google Indexing API has a quota of 200 requests/day — limit batch size
    const batchUrls = urls.slice(0, 200);
    const results = [];
    
    // Process in batches of 10 with delays to respect rate limits
    for (let i = 0; i < batchUrls.length; i += 10) {
      const batch = batchUrls.slice(i, i + 10);
      const batchResults = await Promise.all(
        batch.map(url => submitUrl(accessToken, url, type))
      );
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + 10 < batchUrls.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Google Indexing: ${successCount} succeeded, ${failCount} failed out of ${results.length} URLs`);

    return new Response(JSON.stringify({
      success: true,
      total: results.length,
      succeeded: successCount,
      failed: failCount,
      results: results.slice(0, 20), // Return first 20 for debugging
      submitted_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Google Indexing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
