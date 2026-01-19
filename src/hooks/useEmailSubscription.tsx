import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface EmailSubscription {
  id: string;
  email: string;
  frequency: string;
  is_active: boolean;
  preferences: {
    predictions: boolean;
    news: boolean;
    alerts: boolean;
  };
  last_sent_at: string | null;
}

export function useEmailSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<EmailSubscription | null>(null);
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
        .from('email_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data) {
        setSubscription({
          ...data,
          preferences: typeof data.preferences === 'string' 
            ? JSON.parse(data.preferences) 
            : data.preferences || { predictions: true, news: true, alerts: true }
        });
      }
    } catch (err) {
      console.error('Error fetching email subscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async (email: string, frequency: 'daily' | 'weekly' = 'daily') => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error: insertError } = await supabase
        .from('email_subscriptions')
        .upsert({
          user_id: user.id,
          email,
          frequency,
          is_active: true,
          preferences: { predictions: true, news: true, alerts: true }
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setSubscription({
          ...data,
          preferences: typeof data.preferences === 'string' 
            ? JSON.parse(data.preferences) 
            : data.preferences
        });
      }
      return { success: true };
    } catch (err) {
      console.error('Error subscribing:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const updatePreferences = async (preferences: Partial<EmailSubscription['preferences']>) => {
    if (!user || !subscription) return { success: false, error: 'No subscription' };

    try {
      const updatedPreferences = { ...subscription.preferences, ...preferences };
      const { error: updateError } = await supabase
        .from('email_subscriptions')
        .update({ preferences: updatedPreferences })
        .eq('id', subscription.id);

      if (updateError) throw updateError;

      setSubscription({ ...subscription, preferences: updatedPreferences });
      return { success: true };
    } catch (err) {
      console.error('Error updating preferences:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const unsubscribe = async () => {
    if (!user || !subscription) return { success: false, error: 'No subscription' };

    try {
      const { error: updateError } = await supabase
        .from('email_subscriptions')
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
    updatePreferences,
    unsubscribe,
    refetch: fetchSubscription
  };
}
