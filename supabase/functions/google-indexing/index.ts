import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { importPKCS8, SignJWT } from "https://esm.sh/jose@5.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SA_EMAIL = "predictpro-sitemap-bot-183@pristine-clone-484213-p9.iam.gserviceaccount.com";

// Raw DER base64 - reconstruct PEM at runtime to avoid any formatting corruption
const DER_B64 = "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD+hdCRk+fRYO7aRkwtNNnQDadi45q5PsVnXM3J696y4/DyC1H7q/+NGgJ8uVMwnrPej/kKCxTVRYQQju2V+YOYwKfX5EcSt81Xlr6tlMF+Q916RWwWLWsacX1FGvdLTziG42PovHeogAolwO69K+iXz2Ohd8x3kNolFyLljpWa6C7laq4+1n9sGNNMNz9a1ol1PnwOO3u6fWxR9eiue57ZbAFJkzfjcwgU5oH2g/oTokTwl6IYPRsa+S27Q91retX2rPHLNzefEfJadsBhTKs1JbANFNcZtvrBatYsgxu+lxKvfXBn/ZmqB0wsat9sZ4XTUai/tav84j07/i67FrG7AgMBAAECggEAB2eGSh7Jg8incpJe99d74AF8yskghCymT/SzT3abSPBU3xsU+rU7PvtFubIK9BF53eA36inh65rcOXeJp28rJo/qdaZj4168YcS2WHhlf06/rCV+38+f/z9FvY/rmZOZa0XTUs0ylYKmurMZDqnLWFOz3fZUWP2sIEqMWXSa/q/WFf7e3ML967i9EvaZkmt/tIZPGg9tYa9xqutr+cj5FBcoCZo0MyrsnB6GGjGGvEfaGtZXUNtfppu/gulr9ZO7iA3opCWwk+8LuzPC0Ak4YuiG+NPaJkEDVSnNmOrhRLbbQU5jiV8RTMRwsSnytkWeRti/ejMwbSsdOxNlrfF5cQKBgQD/RoLGyezDliUfWjq+6rOHZe053vw9EIM+Z6w6dRV3MqALMpRjES0KRPMfL0cM1c9DtD0fG+r/VnKU0zr54zhdCOr9Vvb12aeowsuBlrixOEuYjPP5Igb120mBVRHdZUyTgTSrecuw4lygNDposjFTxwarNNQA33oRUUAsAdEwSQKBgQD/PsHGS7XqvFYnIeBSam1Hq4kMEUcbizUQKX0i5SRN+H428k5sJH3oshheAiydVHPXtlz/XvbHbm7FIMggZzH1At52NusLh8oVnDZ/+Jl/5p5uRKdluAFTN2g662ZjHqBkJ7Gnhe62VIZTjSHQzgLHasnSC3xbYgmiVe10/VPZ4wKBgFkP77aNYqaGbuM2ZsKPPh2iKRcEvjpL1Y5jO0qV6OxSZFYjynOZ3X30uku1wfMvcYWsj5qX8fAt6AIWhEAEz3heESZcPgNecclGVRwcSsnB21YY71HfVlBWtpmB5Z65pfLcpD5PGwrWnvxh3HMEoIMbMC9xWfoH/h2mnF3+ME7JAoGBANi0Fl5dvyh5GAgHSeWNluOHbkZxkNaAvN9o6hYrR0RvefD6jbxgywk501hVLj2xCt0UtiYWIRy21JLGv0JLeu2Srv7cp3fVpKvuQZMqpGAjk1T5Mso4i990Bikn3HjA8tm1na4mFsJ0Rss+4nvdvBxEvO540+7d8GID5CPURFGTAoGBAL/rlmi9DyXPgDHS/avQHae2v3PPD/SUf1Tx9c1SZHpAG+r41wX1F28Ss5gBtgyiRoCSYFgvy+1AI0ALhs2JPDRNsBnCF1d96/l80dL3QlTO/NCFPva1zwKXlOR3Fjc5PYP499jl+igYkadVI7LV6Ick2A6cy0Em2I1HTqs/p3u7";

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function buildPem(derB64: string): string {
  // Split into 64-char lines and wrap with PEM headers
  const lines: string[] = [];
  for (let i = 0; i < derB64.length; i += 64) {
    lines.push(derB64.substring(i, i + 64));
  }
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
}

async function getAccessToken(): Promise<string> {
  const pem = buildPem(DER_B64);
  const privateKey = await importPKCS8(pem, 'RS256');

  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/indexing',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(SA_EMAIL)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);

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
    throw new Error(`Token error: ${resp.status} ${err}`);
  }

  return (await resp.json()).access_token;
}

async function submitUrl(accessToken: string, url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
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
    console.log('Google Indexing: Starting with crypto.subtle approach');
    const accessToken = await getAccessToken();
    console.log('Google Indexing: Got access token successfully');

    let urls: string[] = [];
    let type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED';

    if (req.method === 'POST') {
      const body = await req.json();
      urls = body.urls || [];
      type = body.type || 'URL_UPDATED';
    }

    if (urls.length === 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const BASE_URL = 'https://predictpro.guru';
      const staticRoutes = ['/', '/leaderboard', '/performance', '/news', '/insights', '/about', '/rewards', '/shop'];
      urls = staticRoutes.map(r => `${BASE_URL}${r}`);

      const { data: predictions } = await supabase.from('predictions')
        .select('match_id')
        .gte('match_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (predictions) {
        const uniqueIds = new Set(predictions.map((p: { match_id: string }) => p.match_id));
        uniqueIds.forEach(id => urls.push(`${BASE_URL}/match/${id}`));
      }

      const { data: articles } = await supabase.from('news_articles')
        .select('slug')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (articles) {
        articles.forEach((a: { slug: string }) => { if (a.slug) urls.push(`${BASE_URL}/news/${a.slug}`); });
      }
    }

    const batchUrls = urls.slice(0, 200);
    const results = [];

    for (let i = 0; i < batchUrls.length; i += 10) {
      const batch = batchUrls.slice(i, i + 10);
      const batchResults = await Promise.all(
        batch.map(url => submitUrl(accessToken, url, type))
      );
      results.push(...batchResults);

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
      results: results.slice(0, 20),
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
