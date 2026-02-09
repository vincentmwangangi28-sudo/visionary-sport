import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callAIWithRetry(lovableApiKey: string, messages: unknown[], maxRetries = 3): Promise<string | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      }

      if (response.status === 429 || response.status === 402) {
        const delay = Math.pow(2, attempt) * 3000 + Math.random() * 2000;
        console.log(`AI rate limited (${response.status}), retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      console.error(`AI API error: ${response.status}`);
      return null;
    } catch (e) {
      console.error(`AI call error attempt ${attempt + 1}:`, e);
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔗 Generating backlink-optimized content...');

    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!predictions || predictions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No predictions found to base content on' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    
    const guestPostPrompt = `Write a professional guest post article (600-800 words) for sports betting blogs about AI-powered football predictions. Include:

1. Title: Catchy, SEO-optimized headline about AI predictions
2. Introduction: Hook about the evolution of sports analytics
3. Body: 
   - How AI analyzes match data
   - Recent prediction examples from ${predictions.slice(0, 3).map(p => `${p.home_team} vs ${p.away_team}`).join(', ')}
   - Accuracy metrics and confidence scoring
4. Conclusion: Call to action mentioning PredictPro.guru
5. Author bio placeholder

Format as JSON with fields: title, content, excerpt, metaDescription, keywords[]`;

    const guestPostContent = await callAIWithRetry(lovableApiKey, [
      { role: 'user', content: guestPostPrompt }
    ]);

    if (!guestPostContent) {
      return new Response(JSON.stringify({ success: false, error: 'AI unavailable after retries' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parsedContent;
    try {
      const jsonMatch = guestPostContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse guest post JSON:', e);
    }
    
    if (!parsedContent) {
      parsedContent = {
        title: 'AI-Powered Football Predictions: The Future of Sports Betting',
        content: guestPostContent,
        excerpt: 'Discover how artificial intelligence is revolutionizing sports predictions.',
        metaDescription: 'Learn how AI analyzes football matches to deliver accurate predictions.',
        keywords: ['AI predictions', 'football betting', 'sports analytics'],
      };
    }

    const slug = `guest-post-${dateStr}-${Math.random().toString(36).substring(7)}`;
    
    const { error: insertError } = await supabase
      .from('news_articles')
      .insert({
        title: parsedContent.title || 'AI Football Predictions Guide',
        content: parsedContent.content || guestPostContent,
        excerpt: parsedContent.excerpt || 'Expert AI predictions for football matches.',
        slug,
        category: 'Guest Post',
        tags: parsedContent.keywords || ['AI', 'predictions', 'football'],
        is_published: true,
        author: 'PredictPro AI',
      });

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    console.log('✅ Backlink content generated successfully');

    return new Response(JSON.stringify({
      success: true,
      article: {
        title: parsedContent.title,
        slug,
        canonicalUrl: `https://predictpro.guru/news/${slug}`,
        metaDescription: parsedContent.metaDescription,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating backlink content:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
