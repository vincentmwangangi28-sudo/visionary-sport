import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Subscription {
  id: string;
  plan: 'basic' | 'pro' | 'vip';
  priceKes: number;
  startsAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface SubscriptionPlan {
  id: 'basic' | 'pro' | 'vip';
  name: string;
  price: number;
  features: string[];
  predictionsPerDay: number;
  color: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 299,
    predictionsPerDay: 5,
    color: 'from-blue-500 to-blue-600',
    features: [
      '5 Premium predictions/day',
      'Basic match analysis',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 599,
    predictionsPerDay: 15,
    color: 'from-purple-500 to-purple-600',
    features: [
      '15 Premium predictions/day',
      'Advanced AI analysis',
      'Priority support',
      'Performance tracking',
    ],
  },
  {
    id: 'vip',
    name: 'VIP',
    price: 999,
    predictionsPerDay: -1, // Unlimited
    color: 'from-amber-500 to-amber-600',
    features: [
      'Unlimited predictions',
      'VIP tipster insights',
      '24/7 Priority support',
      'Exclusive contests',
      'Early access features',
    ],
  },
];

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      }

      if (data) {
        setSubscription({
          id: data.id,
          plan: data.plan as 'basic' | 'pro' | 'vip',
          priceKes: data.price_kes,
          startsAt: data.starts_at,
          expiresAt: data.expires_at,
          status: data.status as 'active' | 'expired' | 'cancelled',
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (plan: SubscriptionPlan): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Please login first' };

    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: plan.id,
          price_kes: plan.price,
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      await fetchSubscription();
      return { success: true, message: `Successfully subscribed to ${plan.name} plan!` };
    } catch (error) {
      console.error('Error subscribing:', error);
      return { success: false, message: 'Failed to subscribe' };
    }
  };

  const cancelSubscription = async (): Promise<{ success: boolean; message: string }> => {
    if (!user || !subscription) return { success: false, message: 'No active subscription' };

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id);

      if (error) throw error;

      setSubscription(null);
      return { success: true, message: 'Subscription cancelled' };
    } catch (error) {
      console.error('Error cancelling:', error);
      return { success: false, message: 'Failed to cancel subscription' };
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  return { subscription, loading, plans: SUBSCRIPTION_PLANS, subscribe, cancelSubscription, refetch: fetchSubscription };
};
