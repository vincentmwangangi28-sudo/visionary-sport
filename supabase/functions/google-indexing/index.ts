import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SA_EMAIL = "predictpro-sitemap-bot-183@pristine-clone-484213-p9.iam.gserviceaccount.com";

const RSA_JWK = {
  kty: "RSA",
  n: "_oXQkZPn0WKO2kZMLTTZ0A2nYuOauT7FZ1zNyevesuPw8gtR-6v_jRoCfLlTMJ6z3o_5CgsU1UWEEI7tlfmDmMCn1-RHErfNV5a-rZTBfkPdekVsFi1rGnF9RRr3S084huNj6Lx3qIAKJcCevSvol89joXfMd5DaJRci5Y6Vmugu5WquPtZ_bBjTTDc_WtaJdT58Djt7un1sUfXornue2WwBSZM343MIFOaB9oP6E6JE8JeiGD0bGvktu0Pda3rV9qzxyzc3nxHyWnbAYUyrNSWwDRTXGbb6wWrWLIMbvpcSr31wZ_2ZqgdMLGrfbGeF01Gov7Wr_OI9O_4uuxaxuw",
  e: "AQAB",
  d: "B2eGSh7Jg8incpJe99d74AF8yskghCymT_SzT3abSPBU3xsU-rU7PvtFubIK9BF53eA36inh65rcOXeJp28rJo_qdaZj4168YcS2WHhlf06_rCV-38-f_z9FvY_rmZOZa0XTUs0ylYKmurMZDqnLWFOz3fZUWP2sIEqMWXSa_q_WFf7e3ML967i9EvaZkmt_tIZPGg9tYa9xqutr-cj5FBcoCZo0MyrsnB6GGjGGvEfaGtZXUNtfppu_gulr9ZO7iA3opCWwk-8LuzPC0Ak4YuiG-NPaJkEDVSnNmOrhRLbbQU5jiV8RTMRwsSnytKWeRti_ejMwbSsdOxNlrfF5cQ",
  p: "_0aCxsnsw5YlH1o6vuqzh2XtOd78PRCDPmesOnUVdzKgCzKUYxEtCkTy3y9HDNXPQ7Q9Hxvq_1ZylNM6-eM4XQjq_Vb29dmnqMLLgZa4sThLmIzz-SIG9dtJgVUR3WVMk4E0a3nLsOJcoDQ6aLIxU8cGqzTUAN96EVFALAHRMEk",
  q: "_z7Bxku16rxWJyHgUmjNR6uJDBFHG4s1ECl9IuUkTfh-NvJObCR96LIYXgIsnVRz17Zc_172x25uxSDIIGcx9QLedjbrC4fKFZw2f_iZf-aebkSnZbgBUzdoOutmYx6gZCexp4XutlSGU40h0M4Cx2rJ0gt8W2IJolXtdP1T2eM",
  dp: "WQ_vto1ipoZu4zZmwo8-HaIpFwS-OkvVjmM7SpXo7FJkViPKc5ndffS6S7XB8y9xhayPmpfx8C3oAhaEQATPeF4RJlw-A15xyUZVHBxKycHbVhjvUd9WUFa2mYHlnrml8tykPk8bCtae_GHccwSggxswL3FZ-gf-HaacXf4wTsk",
  dq: "2LQWXl2_KHkYCAdJ5Y2W44duRnGQ1oC832jqFitHRG958PqNvGDLCTnTWFUuPbEK3RS2JhYhHLbUksa_Qkt67ZKu_tynd9Wkq-5BkyqkYCOTVPkyyjiL33QGKSfceMDy2bWdriYWwnRGyz7ie928HES87njT7t3wYgPkI9REUZM",
  qi: "v-uWaL0PJc-AMdL9q9Adp7a_c88P9JR_VPH1zVJkekAb6vjXBfUXbxKzmAG2DKJGgJJgWC_L7UAjQAuGzYk8NE2wGcIXV33r-XzR0vdCVM780IU-9rXPApeU5HcWNzk9g_j32OX6KBiRp1UjstXohyTYDpzLQSbYjUdOqz-ne7s",
  alg: "RS256",
  use: "sig",
};

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

async function getAccessToken(): Promise<string> {
  const privateKey = await crypto.subtle.importKey(
    'jwk',
    RSA_JWK,
    { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const now = Math.floor(Date.now() / 1000);
  const jwt = await create(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: SA_EMAIL,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    },
    privateKey
  );

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
    console.log('Google Indexing: Starting with JWK approach');
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
