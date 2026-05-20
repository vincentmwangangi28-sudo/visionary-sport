import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const CRON_SECRET = Deno.env.get('CRON_SECRET');
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  // Find subscriptions expiring in 3 days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);

  const { data: expiringSubs, error } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan, expires_at, profiles!inner(email, full_name)')
    .eq('status', 'active')
    .gte('expires_at', tomorrow.toISOString())
    .lte('expires_at', threeDaysFromNow.toISOString());

  if (error) {
    console.error('Error fetching expiring subs:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  for (const sub of expiringSubs ?? []) {
    const profile = (sub as any).profiles;
    const expiryDate = new Date(sub.expires_at).toLocaleDateString('en-KE', { dateStyle: 'long' });

    if (RESEND_API_KEY && profile?.email) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'PredictPro <noreply@predictpro.co.ke>',
          to: profile.email,
          subject: `Your ${sub.plan} subscription expires on ${expiryDate}`,
          html: `
            <h2>Hi ${profile.full_name ?? 'there'}!</h2>
            <p>Your <strong>${sub.plan}</strong> PredictPro subscription expires on <strong>${expiryDate}</strong>.</p>
            <p>Renew now to keep enjoying premium AI predictions without interruption.</p>
            <a href="https://predictpro.co.ke/shop" style="background:#6d28d9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
              Renew Subscription
            </a>
            <p style="color:#888;font-size:12px">You're receiving this because you have an active subscription on PredictPro.</p>
          `,
        }),
      });
      sent++;
    }

    // Log notification
    await supabase.from('notifications').insert({
      user_id: sub.user_id,
      type: 'subscription_expiry_reminder',
      message: `Your ${sub.plan} plan expires on ${expiryDate}. Renew to keep your access.`,
      metadata: { subscription_id: sub.id, expires_at: sub.expires_at },
    }).then(() => {});
  }

  console.log(`Sent ${sent} expiry reminder emails for ${expiringSubs?.length ?? 0} expiring subscriptions`);
  return new Response(JSON.stringify({ processed: expiringSubs?.length ?? 0, emailsSent: sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
