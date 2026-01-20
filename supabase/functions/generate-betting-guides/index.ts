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

    console.log('📚 Generating betting strategy guides...');

    const guides = [
      {
        category: 'Value Betting',
        prompt: `Write a comprehensive guide on value betting strategy (600-800 words). Include:
- What is value betting and how to identify it
- Calculating expected value (EV)
- How AI predictions help find value bets
- Real-world examples with typical odds
- Common mistakes to avoid
- Risk management tips
Make it actionable for Kenyan bettors using local platforms.`,
      },
      {
        category: 'Accumulator Strategy',
        prompt: `Write a detailed guide on accumulator betting strategy (600-800 words). Cover:
- Pros and cons of accumulators
- Optimal number of selections
- How to use confidence scores in accas
- Bankroll allocation for accumulators
- When accumulators make sense vs single bets
- Example accumulator with AI predictions
Focus on practical tips for maximizing returns while managing risk.`,
      },
      {
        category: 'Live Betting Tactics',
        prompt: `Write an educational guide on in-play/live betting strategies (600-800 words). Include:
- How odds shift during matches
- Key moments to place live bets
- Reading match momentum
- Common live betting markets
- Combining pre-match predictions with live opportunities
- Discipline and quick decision-making
Target football matches specifically.`,
      },
      {
        category: 'League Analysis',
        prompt: `Write a league-specific betting guide for the Premier League (600-800 words). Cover:
- Unique characteristics of EPL betting
- Home vs away form patterns
- Big 6 vs smaller clubs dynamics
- Best markets for EPL matches
- Seasonal trends (early season, Christmas period, run-in)
- How AI adapts predictions for league-specific factors
Include current season context.`,
      },
    ];

    // Select 1-2 guides to generate
    const shuffled = guides.sort(() => Math.random() - 0.5);
    const selectedGuides = shuffled.slice(0, 2);
    const generatedGuides = [];

    for (const guide of selectedGuides) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: guide.prompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to generate ${guide.category} guide`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      const dateStr = new Date().toISOString().split('T')[0];
      const slug = `${guide.category.toLowerCase().replace(/\s+/g, '-')}-guide-${dateStr}`;

      // Check for existing guide
      const { data: existing } = await supabase
        .from('news_articles')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existing) {
        const { error: insertError } = await supabase
          .from('news_articles')
          .insert({
            title: `${guide.category} Strategy Guide`,
            content,
            excerpt: `Master ${guide.category.toLowerCase()} with our expert AI-powered strategies.`,
            slug,
            category: 'Strategy Guide',
            tags: ['betting strategy', guide.category.toLowerCase(), 'guide', 'tips'],
            is_published: true,
            author: 'PredictPro Strategy Team',
          });

        if (!insertError) {
          generatedGuides.push({ category: guide.category, slug });
          console.log(`✅ Generated: ${guide.category} guide`);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      generated: generatedGuides,
      message: `Generated ${generatedGuides.length} betting strategy guides`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error generating betting guides:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
