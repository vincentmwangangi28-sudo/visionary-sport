import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting automated news article generation...');

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Topics for daily news generation
    const newsTopics = [
      { category: 'preview', prompt: 'Generate a match preview article for an upcoming Premier League match this week. Include team form, key players, and tactical analysis.' },
      { category: 'analysis', prompt: 'Generate a post-match analysis article for a recent Champions League game. Include key moments, player ratings, and tactical insights.' },
      { category: 'transfer', prompt: 'Generate a transfer news article about rumored moves in European football. Include player names, clubs involved, and transfer fee estimates.' },
      { category: 'trending', prompt: 'Generate a trending sports headline article about current events in football. Focus on manager news, player injuries, or league standings.' },
    ];

    let articlesGenerated = 0;

    for (const topic of newsTopics) {
      try {
        console.log(`Generating ${topic.category} article...`);

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a professional sports journalist for PredictPro Guru, a Kenyan sports prediction platform. Write engaging, SEO-optimized articles. Always use realistic but fictional team matchups if needed. Include relevant keywords like "football predictions Kenya", "AI sports analysis", "Premier League tips". 
                
Respond ONLY with valid JSON in this exact format:
{
  "title": "Compelling headline under 70 characters",
  "excerpt": "Meta description under 160 characters for SEO",
  "content": "Full article in markdown format, 300-500 words",
  "tags": ["tag1", "tag2", "tag3"]
}`
              },
              { role: 'user', content: topic.prompt }
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI error for ${topic.category}:`, errorText);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';

        let article;
        try {
          article = JSON.parse(content);
        } catch {
          console.error('Failed to parse AI response:', content);
          continue;
        }

        // Generate slug from title
        const slug = article.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 80) + '-' + Date.now();

        // Insert article
        const { error: insertError } = await supabase.from('news_articles').insert({
          title: article.title,
          slug: slug,
          content: article.content,
          excerpt: article.excerpt,
          category: topic.category,
          tags: article.tags || [],
          author: 'PredictPro AI',
          is_published: true,
        });

        if (insertError) {
          console.error('Error inserting article:', insertError);
        } else {
          articlesGenerated++;
          console.log(`Generated article: ${article.title}`);
        }

        // Delay between articles to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (topicError) {
        console.error(`Error generating ${topic.category} article:`, topicError);
      }
    }

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      articles_generated: articlesGenerated,
    };

    console.log('News generation completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('News generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
