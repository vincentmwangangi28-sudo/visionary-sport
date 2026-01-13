import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BADGE_DEFINITIONS = [
  { type: 'first_prediction', name: 'First Step', description: 'Made your first prediction', requirement: 1 },
  { type: 'predictions_10', name: 'Predictor', description: 'Made 10 predictions', requirement: 10 },
  { type: 'predictions_50', name: 'Expert Predictor', description: 'Made 50 predictions', requirement: 50 },
  { type: 'predictions_100', name: 'Master Predictor', description: 'Made 100 predictions', requirement: 100 },
  { type: 'streak_3', name: 'Hot Streak', description: '3 correct predictions in a row', requirement: 3 },
  { type: 'streak_5', name: 'Fire Streak', description: '5 correct predictions in a row', requirement: 5 },
  { type: 'streak_10', name: 'Legendary Streak', description: '10 correct predictions in a row', requirement: 10 },
  { type: 'accuracy_70', name: 'Sharp Eye', description: '70%+ accuracy rate', requirement: 70 },
  { type: 'accuracy_80', name: 'Eagle Eye', description: '80%+ accuracy rate', requirement: 80 },
  { type: 'early_bird', name: 'Early Bird', description: 'Placed a prediction before 8 AM', requirement: 1 },
  { type: 'referrer_5', name: 'Influencer', description: 'Referred 5 friends', requirement: 5 },
  { type: 'contest_winner', name: 'Champion', description: 'Won a prediction contest', requirement: 1 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let badgesAwarded = 0;

    // Get all users with prediction history
    const { data: users } = await supabase
      .from('predictions_history')
      .select('user_id')
      .limit(1000);

    const uniqueUserIds = [...new Set(users?.map(u => u.user_id) || [])];

    for (const userId of uniqueUserIds) {
      // Get user's prediction stats
      const { data: history } = await supabase
        .from('predictions_history')
        .select('*')
        .eq('user_id', userId);

      if (!history) continue;

      const totalPredictions = history.length;
      const correctPredictions = history.filter(h => h.is_correct === true).length;
      const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

      // Get user's streaks
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get referral count
      const { data: referrals } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', userId)
        .eq('status', 'completed');

      const referralCount = referrals?.length || 0;

      // Check and award badges
      const badgesToAward: Array<{ type: string; name: string; description: string }> = [];

      // Prediction count badges
      if (totalPredictions >= 1) badgesToAward.push(BADGE_DEFINITIONS.find(b => b.type === 'first_prediction')!);
      if (totalPredictions >= 10) badgesToAward.push(BADGE_DEFINITIONS.find(b => b.type === 'predictions_10')!);
      if (totalPredictions >= 50) badgesToAward.push(BADGE_DEFINITIONS.find(b => b.type === 'predictions_50')!);
      if (totalPredictions >= 100) badgesToAward.push(BADGE_DEFINITIONS.find(b => b.type === 'predictions_100')!);

      // Streak badges
      const longestStreak = streakData?.longest_streak || 0;
      if (longestStreak >= 3) badgesToAward.push(BADGE_DEFINITIONS.find(b => b.type === 'streak_3')!);
      if (longestStreak >= 5) badgesToAward.push(BADGE_DEFINITIONS.find(b => b.type === 'streak_5')!);
      if (longestStreak >= 10) badgesToAward.push(BADGE_DEFINITIONS.find(b => b.type === 'streak_10')!);

      // Accuracy badges (minimum 10 predictions)
      if (totalPredictions >= 10) {
        if (accuracy >= 70) badgesToAward.push(BADGE_DEFINITIONS.find(b => b.type === 'accuracy_70')!);
        if (accuracy >= 80) badgesToAward.push(BADGE_DEFINITIONS.find(b => b.type === 'accuracy_80')!);
      }

      // Referral badges
      if (referralCount >= 5) badgesToAward.push(BADGE_DEFINITIONS.find(b => b.type === 'referrer_5')!);

      // Award badges (upsert to avoid duplicates)
      for (const badge of badgesToAward.filter(Boolean)) {
        const { error } = await supabase
          .from('user_badges')
          .upsert({
            user_id: userId,
            badge_type: badge.type,
            badge_name: badge.name,
            description: badge.description
          }, {
            onConflict: 'user_id,badge_type'
          });

        if (!error) badgesAwarded++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      count: badgesAwarded,
      usersProcessed: uniqueUserIds.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Award badges error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
