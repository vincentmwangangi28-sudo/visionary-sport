import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SmsSubscription {
  id: string;
  phone_number: string;
  country_code: string;
  is_active: boolean;
  alerts_enabled: boolean;
}

export function useSmsSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SmsSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('sms_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Error fetching SMS subscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (phoneNumber: string, countryCode: string = '+254') => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error: insertError } = await supabase
        .from('sms_subscriptions')
        .upsert({
          user_id: user.id,
          phone_number: phoneNumber.replace(/^\+?\d{1,3}/, ''), // Remove country code if included
          country_code: countryCode,
          is_active: true,
          alerts_enabled: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSubscription(data);
      return { success: true };
    } catch (err) {
      console.error('Error subscribing to SMS:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const toggleAlerts = async () => {
    if (!user || !subscription) return { success: false, error: 'No subscription' };

    try {
      const { error: updateError } = await supabase
        .from('sms_subscriptions')
        .update({ alerts_enabled: !subscription.alerts_enabled })
        .eq('id', subscription.id);

      if (updateError) throw updateError;

      setSubscription({ ...subscription, alerts_enabled: !subscription.alerts_enabled });
      return { success: true };
    } catch (err) {
      console.error('Error toggling alerts:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const unsubscribe = async () => {
    if (!user || !subscription) return { success: false, error: 'No subscription' };

    try {
      const { error: updateError } = await supabase
        .from('sms_subscriptions')
        .update({ is_active: false })
        .eq('id', subscription.id);

      if (updateError) throw updateError;

      setSubscription({ ...subscription, is_active: false });
      return { success: true };
    } catch (err) {
      console.error('Error unsubscribing:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return {
    subscription,
    loading,
    error,
    subscribe,
    toggleAlerts,
    unsubscribe,
    refetch: fetchSubscription
  };
}
