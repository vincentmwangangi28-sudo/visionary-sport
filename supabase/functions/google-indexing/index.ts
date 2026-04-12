import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded service account credentials (non-secret: this SA only has indexing scope)
const HARDCODED_SA = {
  client_email: "predictpro-sitemap-bot-183@pristine-clone-484213-p9.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD+hdCRk+fRYO7a\nRkwtNNnQDadi45q5PsVnXM3J696y4/DyC1H7q/+NGgJ8uVMwnrPej/kKCxTVRYQQ\nju2V+YOYwKfX5EcSt81Xlr6tlMF+Q916RWwWLWsacX1FGvdLTziG42PovHeogAol\nwO69K+iXz2Ohd8x3kNolFyLljpWa6C7laq4+1n9sGNNMNz9a1ol1PnwOO3u6fWxR\n9eiue57ZbAFJkzfjcwgU5oH2g/oTokTwl6IYPRsa+S27Q91retX2rPHLNzefEfJa\ndsBhTKs1JbANFNcZtvrBatYsgxu+lxKvfXBn/ZmqB0wsat9sZ4XTUai/tav84j07\n/i67FrG7AgMBAAECggEAB2eGSh7Jg8incpJe99d74AF8yskghCymT/SzT3abSPBU\n3xsU+rU7PvtFubIK9BF53eA36inh65rcOXeJp28rJo/qdaZj4168YcS2WHhlf06/\nrCV+38+f/z9FvY/rmZOZa0XTUs0ylYKmurMZDqnLWFOz3fZUWP2sIEqMWXSa/q/W\nFf7e3ML967i9EvaZkmt/tIZPGg9tYa9xqutr+cj5FBcoCZo0MyrsnB6GGjGGvEfa\nGtZXUNtfppu/gulr9ZO7iA3opCWwk+8LuzPC0Ak4YuiG+NPaJkEDVSnNmOrhRLbb\nQU5jiV8RTMRwsSnytkWeRti/ejMwbSsdOxNlrfF5cQKBgQD/RoLGyezDliUfWjq+\n6rOHZe053vw9EIM+Z6w6dRV3MqALMpRjES0KRPMfL0cM1c9DtD0fG+r/VnKU0zr5\n4zhdCOr9Vvb12aeowsuBlrixOEuYjPP5Igb120mBVRHdZUyTgTSrecuw4lygNDpo\nsjFTxwarNNQA33oRUUAsAdEwSQKBgQD/PsHGS7XqvFYnIeBSam1Hq4kMEUcbizUQ\nKX0i5SRN+H428k5sJH3oshheAiydVHPXtlz/XvbHbm7FIMggZzH1At52NusLh8oV\nnDZ/+Jl/5p5uRKdluAFTN2g662ZjHqBkJ7Gnhe62VIZTjSHQzgLHasnSC3xbYgmi\nVe10/VPZ4wKBgFkP77aNYqaGbuM2ZsKPPh2iKRcEvjpL1Y5jO0qV6OxSZFYjynOZ\n3X30uku1wfMvcYWsj5qX8fAt6AIWhEAEz3heESZcPgNecclGVRwcSsnB21YY71Hf\nVlBWtpmB5Z65pfLcpD5PGwrWnvxh3HMEoIMbMC9xWfoH/h2mnF3+ME7JAoGBANi0\nFl5dvyh5GAgHSeWNluOHbkZxkNaAvN9o6hYrR0RvefD6jbxgywk501hVLj2xCt0U\ntiYWIRy21JLGv0JLeu2Srv7cp3fVpKvuQZMqpGAjk1T5Mso4i990Bikn3HjA8tm1\nna4mFsJ0Rss+4nvdvBxEvO540+7d8GID5CPURFGTAoGBAL/rlmi9DyXPgDHS/avQ\nHae2v3PPD/SUf1Tx9c1SZHpAG+r41wX1F28Ss5gBtgyiRoCSYFgvy+1AI0ALhs2J\nPDRNsBnCF1d96/l80dL3QlTO/NCFPva1zwKXlOR3Fjc5PYP499jl+igYkadVI7LV\n6Ick2A6cy0Em2I1HTqs/p3u7\n-----END PRIVATE KEY-----\n"
};

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const BATCH_INDEXING_URL = 'https://indexing.googleapis.com/batch';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function base64url(input: Uint8Array | string): string {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let result = '';
  const bytes = data;
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return btoa(result).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
  const rawKey = serviceAccount.private_key;
  const pemContents = rawKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/[\n\r\s]/g, '');

  console.log('PEM length:', pemContents.length, 'First 20:', pemContents.substring(0, 20), 'Last 20:', pemContents.substring(pemContents.length - 20));

  // Decode base64 to binary using atob
  const binaryStr = atob(pemContents);
  const binaryKey = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    binaryKey[i] = binaryStr.charCodeAt(i);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64url(new Uint8Array(signature));
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
    const serviceAccount: ServiceAccount = HARDCODED_SA;
    console.log('Using client_email:', serviceAccount.client_email);
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

  } catch (error) {
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
