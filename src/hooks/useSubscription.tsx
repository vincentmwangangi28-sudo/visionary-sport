
export const SUBSCRIPTION_PLANS = [
  { id: 'basic', name: 'Basic',  price: 299, features: ['5 predictions/day', 'Basic stats', 'Email support'] },
  { id: 'pro',   name: 'Pro',    price: 599, features: ['Unlimited predictions', 'Advanced stats', 'Priority support', 'Live match alerts'] },
  { id: 'vip',   name: 'VIP',    price: 999, features: ['Everything in Pro', 'Expert analysis', '1-on-1 support', 'Early access', 'Ad-free'] },
];

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  expires_at: string;
  price_kes: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) { setSubscription(null); setLoading(false); return; }
    const { data } = await supabase.from('subscriptions').select('*')
      .eq('user_id', user.id).eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false }).limit(1).maybeSingle();
    setSubscription(data);
    setLoading(false);
  };

  // Activate via edge function — requires completed transactionId
  const activateSubscription = async (plan: string, transactionId: string) => {
    if (!user) throw new Error('Not authenticated');
    const session = (await supabase.auth.getSession()).data.session;
    const { data, error } = await supabase.functions.invoke('activate-subscription', {
      body: { plan, transactionId },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error || !data?.success) {
      const msg = data?.error ?? 'Subscription activation failed';
      toast.error(msg);
      throw new Error(msg);
    }
    toast.success(`${plan.toUpperCase()} plan activated! Enjoy premium predictions.`);
    await fetchSubscription();
    return data;
  };

  const isPremium = () => {
    if (!subscription) return false;
    return ['pro', 'vip', 'basic'].includes(subscription.plan) &&
      new Date(subscription.expires_at) > new Date();
  };

  const isVIP = () => subscription?.plan === 'vip' && isPremium();

  useEffect(() => { fetchSubscription(); }, [user]);
  return { subscription, loading, activateSubscription, isPremium, isVIP, refetch: fetchSubscription };
};
