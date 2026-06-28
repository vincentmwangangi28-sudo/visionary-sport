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
    setLoading(true);
    supabase.from('subscriptions')
      .select('*').eq('user_id', user.id).eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false }).limit(1).single()
      .then(({ data }) => { setSubscription(data); setLoading(false); });
  }, [user]);

  const isPremium = () => {
    if (!user) return false;
    if (!subscription) return false;
    return subscription.status === 'active' && new Date(subscription.expires_at) > new Date();
  };

  return { subscription, isPremium, loading };
};
