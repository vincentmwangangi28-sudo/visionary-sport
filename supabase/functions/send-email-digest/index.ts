import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active email subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("email_subscriptions")
      .select("*")
      .eq("is_active", true);

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    console.log(`📧 Found ${subscriptions?.length || 0} active email subscriptions`);

    // Get today's predictions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: predictions, error: predError } = await supabase
      .from("predictions")
      .select("*")
      .gte("match_date", today.toISOString())
      .lt("match_date", tomorrow.toISOString())
      .order("confidence", { ascending: false })
      .limit(10);

    if (predError) {
      console.error("Error fetching predictions:", predError);
    }

    // Get latest accuracy stats
    const { data: accuracy } = await supabase
      .from("platform_accuracy")
      .select("*")
      .order("date", { ascending: false })
      .limit(1)
      .single();

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions || []) {
      try {
        const predictionsHtml = predictions?.map(p => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; font-weight: 600;">${p.home_team} vs ${p.away_team}</td>
            <td style="padding: 12px;">${p.league}</td>
            <td style="padding: 12px; color: #10b981; font-weight: bold;">${p.prediction}</td>
            <td style="padding: 12px; text-align: center;">
              <span style="background: ${p.confidence >= 75 ? '#10b981' : p.confidence >= 60 ? '#f59e0b' : '#ef4444'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                ${p.confidence}%
              </span>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="4" style="padding: 20px; text-align: center;">No predictions available today</td></tr>';

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>PredictPro Daily Digest</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🔮 PredictPro</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Daily Predictions Digest</p>
              </div>
              
              <div style="padding: 30px;">
                <h2 style="color: #1f2937; margin-top: 0;">Today's Top Predictions</h2>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 12px; text-align: left;">Match</th>
                      <th style="padding: 12px; text-align: left;">League</th>
                      <th style="padding: 12px; text-align: left;">Prediction</th>
                      <th style="padding: 12px; text-align: center;">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${predictionsHtml}
                  </tbody>
                </table>
                
                ${accuracy ? `
                  <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin-top: 20px;">
                    <h3 style="color: #166534; margin: 0 0 10px;">📊 Platform Accuracy</h3>
                    <p style="margin: 0; color: #15803d; font-size: 24px; font-weight: bold;">${accuracy.accuracy_percent?.toFixed(1)}%</p>
                    <p style="margin: 5px 0 0; color: #166534; font-size: 14px;">${accuracy.correct_predictions} correct out of ${accuracy.total_predictions}</p>
                  </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://predictpro.guru" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600;">View All Predictions</a>
                </div>
              </div>
              
              <div style="background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                <p style="margin: 0;">You're receiving this because you subscribed to PredictPro daily digest.</p>
                <p style="margin: 10px 0 0;">
                  <a href="https://predictpro.guru/settings" style="color: #10b981;">Manage preferences</a> | 
                  <a href="https://predictpro.guru/unsubscribe" style="color: #10b981;">Unsubscribe</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Use Resend API directly via fetch
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "PredictPro <predictions@predictpro.guru>",
            to: [sub.email],
            subject: `🔮 Your Daily Predictions - ${new Date().toLocaleDateString()}`,
            html: emailHtml,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          console.error(`Failed to send to ${sub.email}:`, errorData);
          failed++;
        } else {
          sent++;
          // Update last sent timestamp
          await supabase
            .from("email_subscriptions")
            .update({ last_sent_at: new Date().toISOString() })
            .eq("id", sub.id);
        }
      } catch (err) {
        console.error(`Error processing subscription ${sub.id}:`, err);
        failed++;
      }
    }

    console.log(`📧 Email digest complete: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: subscriptions?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email digest error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
