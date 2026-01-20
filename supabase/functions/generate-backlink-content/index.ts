import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Fetch recent predictions for content
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!predictions || predictions.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'No predictions found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    
    // Generate guest post content for sports blogs
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

    const guestPostResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: guestPostPrompt }],
        temperature: 0.7,
      }),
    });

    if (!guestPostResponse.ok) {
      throw new Error(`AI API error: ${guestPostResponse.status}`);
    }

    const guestPostData = await guestPostResponse.json();
    let guestPostContent = guestPostData.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    let parsedContent;
    try {
      const jsonMatch = guestPostContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse guest post JSON:', e);
      parsedContent = {
        title: 'AI-Powered Football Predictions: The Future of Sports Betting',
        content: guestPostContent,
        excerpt: 'Discover how artificial intelligence is revolutionizing sports predictions.',
        metaDescription: 'Learn how AI analyzes football matches to deliver accurate predictions.',
        keywords: ['AI predictions', 'football betting', 'sports analytics'],
      };
    }

    // Store as syndication-ready article
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
