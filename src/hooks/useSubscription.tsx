import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Subscription { id: string; plan: string; status: string; expires_at: string; price_kes: number; }

export const SUBSCRIPTION_PLANS = [
  { id: 'basic', name: 'Basic', price: 299, features: ['10 AI predictions/day', 'Basic stats', '5 leagues'] },
  { id: 'pro',   name: 'Pro',   price: 599, features: ['Unlimited predictions', '40+ leagues', 'Value bets', 'Live alerts'] },
  { id: 'vip',   name: 'VIP',   price: 999, features: ['Everything in Pro', 'Correct score', 'AI chat unlimited', 'Ad-free'] },
];

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setSubscription(null); return; }
    setLoading(true);
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()  // NOT .single() — avoids 406 when no subscription exists
      .then(({ data, error }) => {
        if (error) console.warn('subscription:', error.message);
        setSubscription(data ?? null);
        setLoading(false);
      });
  }, [user?.id]);

  const isPremium = () => {
    if (!subscription) return false;
    return subscription.status === 'active' && new Date(subscription.expires_at) > new Date();
  };

  return { subscription, isPremium, loading };
};
