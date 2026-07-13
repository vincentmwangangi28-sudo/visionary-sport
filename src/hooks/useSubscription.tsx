import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Subscription { id: string; plan: string; status: string; expires_at: string; price_kes: number; }

export const SUBSCRIPTION_PLANS = [
  { id: 'basic', name: 'Basic',  price: 299, features: ['10 AI predictions/day','Basic stats','5 leagues'] },
  { id: 'pro',   name: 'Pro',    price: 599, features: ['Unlimited predictions','Advanced stats','40+ leagues','Value bets','Live alerts'] },
  { id: 'vip',   name: 'VIP',    price: 999, features: ['Everything in Pro','Correct score','AI chat unlimited','Prediction insurance','Ad-free'] },
];

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setSubscription(null); return; }
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        // Fetch latest subscription record for user and compute expiry client-side
        const { data, error } = await supabase.from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .order('expires_at', { ascending: false })
          .limit(1)
          .single();
        if (error) { console.error('subscription fetch error', error); if (mounted) setSubscription(null); }
        else if (mounted) setSubscription(data ?? null);
      } catch (err) {
        console.error('subscription fetch exception', err);
        if (mounted) setSubscription(null);
      } finally { if (mounted) setLoading(false); }
    })();

    return () => { mounted = false; };
  }, [user]);

  const isPremium = () => {
    if (!user || !subscription) return false;
    try {
      const exp = new Date(subscription.expires_at).getTime();
      return subscription.status === 'active' && !Number.isNaN(exp) && exp > Date.now();
    } catch {
      return false;
    }
  };

  return { subscription, isPremium, loading };
};
