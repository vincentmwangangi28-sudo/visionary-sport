import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface WhatsAppSubscription {
  id: string;
  phoneNumber: string;
  countryCode: string;
  isActive: boolean;
  subscribedAt: string;
  lastMessageSentAt: string | null;
  messageCount: number;
}

export const useWhatsAppSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<WhatsAppSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('whatsapp_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching WhatsApp subscription:', error);
      }

      if (data) {
        setSubscription({
          id: data.id,
          phoneNumber: data.phone_number,
          countryCode: data.country_code,
          isActive: data.is_active,
          subscribedAt: data.subscribed_at,
          lastMessageSentAt: data.last_message_sent_at,
          messageCount: data.message_count || 0,
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

  const subscribe = async (phoneNumber: string, countryCode: string = '+254'): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Please login first' };

    // Validate phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      return { success: false, message: 'Invalid phone number' };
    }

    try {
      const { error } = await supabase
        .from('whatsapp_subscriptions')
        .upsert({
          user_id: user.id,
          phone_number: cleanPhone,
          country_code: countryCode,
          is_active: true,
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      await fetchSubscription();
      return { success: true, message: 'Successfully subscribed to WhatsApp updates!' };
    } catch (error: unknown) {
      console.error('Error subscribing:', error);
      const message = error instanceof Error && error.message.includes('unique') 
        ? 'This phone number is already registered' 
        : 'Failed to subscribe';
      return { success: false, message };
    }
  };

  const unsubscribe = async (): Promise<{ success: boolean; message: string }> => {
    if (!user || !subscription) return { success: false, message: 'No active subscription' };

    try {
      const { error } = await supabase
        .from('whatsapp_subscriptions')
        .update({ 
          is_active: false,
          unsubscribed_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (error) throw error;

      await fetchSubscription();
      return { success: true, message: 'Successfully unsubscribed' };
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return { success: false, message: 'Failed to unsubscribe' };
    }
  };

  const resubscribe = async (): Promise<{ success: boolean; message: string }> => {
    if (!user || !subscription) return { success: false, message: 'No subscription found' };

    try {
      const { error } = await supabase
        .from('whatsapp_subscriptions')
        .update({ 
          is_active: true,
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null
        })
        .eq('id', subscription.id);

      if (error) throw error;

      await fetchSubscription();
      return { success: true, message: 'Successfully resubscribed!' };
    } catch (error) {
      console.error('Error resubscribing:', error);
      return { success: false, message: 'Failed to resubscribe' };
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  return { 
    subscription, 
    loading, 
    subscribe, 
    unsubscribe, 
    resubscribe,
    refetch: fetchSubscription 
  };
};
