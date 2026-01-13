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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recent predictions without FAQs
    const { data: predictions } = await supabase
      .from('predictions')
      .select('match_id, home_team, away_team, league, prediction, confidence')
      .gte('match_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (!predictions || predictions.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0, message: 'No new matches for FAQs' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let faqCount = 0;

    for (const match of predictions) {
      // Check if FAQs already exist
      const { data: existingFaqs } = await supabase
        .from('match_faqs')
        .select('id')
        .eq('match_id', match.match_id)
        .limit(1);

      if (existingFaqs && existingFaqs.length > 0) continue;

      try {
        const prompt = `Generate 5 SEO-optimized FAQ questions and answers for the match: ${match.home_team} vs ${match.away_team} (${match.league}).

Return a JSON array:
[
  {"question": "Who will win ${match.home_team} vs ${match.away_team}?", "answer": "Based on our AI analysis..."},
  {"question": "What are the betting odds for...", "answer": "..."},
  ...
]

Include questions about:
1. Match prediction
2. Best betting tips
3. Key players to watch
4. Head-to-head record
5. Expected goals/score`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'You are an SEO expert for sports predictions. Return only valid JSON array.' },
              { role: 'user', content: prompt }
            ]
          })
        });

        if (!response.ok) continue;

        const aiData = await response.json();
        const content = aiData.choices[0]?.message?.content || '';
        
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) continue;

        const faqs = JSON.parse(jsonMatch[0]);

        // Insert FAQs
        for (const faq of faqs) {
          await supabase.from('match_faqs').insert({
            match_id: match.match_id,
            question: faq.question,
            answer: faq.answer
          });
          faqCount++;
        }

        await new Promise(r => setTimeout(r, 1000));
      } catch (e) {
        console.error(`FAQ generation error for ${match.match_id}:`, e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      count: faqCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Match FAQs error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
