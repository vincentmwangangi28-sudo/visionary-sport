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

  console.log('Starting automated poll generation...');

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch upcoming predictions to create polls
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .gte('match_date', new Date().toISOString())
      .order('match_date', { ascending: true })
      .limit(5);

    if (predError) {
      throw predError;
    }

    let pollsCreated = 0;

    for (const pred of predictions || []) {
      // Check if poll already exists for this match
      const { data: existingPoll } = await supabase
        .from('polls')
        .select('id')
        .eq('match_id', pred.match_id)
        .maybeSingle();

      if (existingPoll) {
        console.log(`Poll already exists for ${pred.match_id}`);
        continue;
      }

      // Create poll with options
      const pollEndsAt = new Date(pred.match_date);
      pollEndsAt.setHours(pollEndsAt.getHours() - 1); // End 1 hour before match

      const { error: insertError } = await supabase.from('polls').insert({
        question: `Who will win: ${pred.home_team} vs ${pred.away_team}?`,
        match_id: pred.match_id,
        options: JSON.stringify([
          { label: pred.home_team, votes: 0 },
          { label: 'Draw', votes: 0 },
          { label: pred.away_team, votes: 0 },
        ]),
        is_active: true,
        ends_at: pollEndsAt.toISOString(),
      });

      if (insertError) {
        console.error('Error creating poll:', insertError);
      } else {
        pollsCreated++;
        console.log(`Created poll for ${pred.home_team} vs ${pred.away_team}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, polls_created: pollsCreated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Poll generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
