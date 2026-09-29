import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  expires_at: string;
  expiresAt?: string;
  price_kes: number;
}

export const SUBSCRIPTION_PLANS = [
  { id: 'basic', name: 'Basic', price: 299, predictionsPerDay: 10, color: '#3b82f6', features: ['10 AI predictions/day', 'Basic stats', '5 leagues'] },
  { id: 'pro',   name: 'Pro',   price: 599, predictionsPerDay: -1, color: '#10b981', features: ['Unlimited predictions', '40+ leagues', 'Value bets', 'Live alerts'] },
  { id: 'vip',   name: 'VIP',   price: 999, predictionsPerDay: -1, color: '#f59e0b', features: ['Everything in Pro', 'Correct score', 'AI chat unlimited', 'Ad-free'] },
];

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) { setSubscription(null); return; }
    setLoading(true);
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()  // NOT .single() — avoids 406 when no subscription exists
      .then(({ data, error }) => {
        if (error) console.warn('subscription:', error.message);
        setSubscription(data ? { ...data, expiresAt: data.expires_at } : null);
        setLoading(false);
      });
  }, [userId]);

  const isPremium = () => {
    if (!subscription) return false;
    return subscription.status === 'active' && new Date(subscription.expires_at) > new Date();
  };

  const activateSubscription = async (planId: string) => {
    const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[1];
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      plan: selectedPlan.id,
      status: 'active',
      expires_at: expiresAt,
      expiresAt,
      price_kes: selectedPlan.price,
    };
    setSubscription(newSub);
    return newSub;
  };

  const plan = subscription?.plan ?? 'free';

  return {
    subscription,
    plan,
    isPremium,
    loading,
    activateSubscription,
    subscribe: activateSubscription,
  };
};
