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

  console.log('Generating transfer rumors content...');

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate transfer rumors using AI
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
            content: `You are a football transfer news expert. Generate 5 realistic but fictional transfer rumors for major European clubs. 
            
Respond ONLY with valid JSON array in this format:
[
  {
    "player_name": "Player Name",
    "current_club": "Current Club",
    "target_club": "Target Club",
    "transfer_fee": "€50M",
    "probability": 65,
    "source": "Multiple Sources",
    "headline": "Brief headline under 80 chars",
    "details": "2-3 sentence details about the rumor"
  }
]`
          },
          {
            role: 'user',
            content: 'Generate 5 fresh transfer rumors for today featuring top European clubs like Real Madrid, Barcelona, Manchester City, Liverpool, Bayern Munich, PSG, Juventus, Chelsea, or Arsenal.'
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';

    let rumors;
    try {
      rumors = JSON.parse(content);
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse transfer rumors');
    }

    let rumorsInserted = 0;

    for (const rumor of rumors) {
      const { error: insertError } = await supabase.from('transfer_rumors').insert({
        player_name: rumor.player_name,
        current_club: rumor.current_club,
        target_club: rumor.target_club,
        transfer_fee: rumor.transfer_fee,
        probability: rumor.probability,
        source: rumor.source,
        headline: rumor.headline,
        details: rumor.details,
        is_confirmed: false,
      });

      if (insertError) {
        console.error('Error inserting rumor:', insertError);
      } else {
        rumorsInserted++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, rumors_inserted: rumorsInserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transfer rumors error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
