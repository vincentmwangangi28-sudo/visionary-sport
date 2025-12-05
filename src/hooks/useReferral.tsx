import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ReferralCode {
  code: string;
  usesCount: number;
}

export interface Referral {
  id: string;
  referredId: string;
  coinsEarned: number;
  status: string;
  createdAt: string;
}

export const useReferral = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);

  const fetchReferralData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user's referral code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('code, uses_count')
        .eq('user_id', user.id)
        .single();

      if (codeError && codeError.code !== 'PGRST116') {
        console.error('Error fetching referral code:', codeError);
      }

      if (codeData) {
        setReferralCode({
          code: codeData.code,
          usesCount: codeData.uses_count || 0,
        });
      }

      // Fetch referrals made by user
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        console.error('Error fetching referrals:', referralsError);
      }

      if (referralsData) {
        const mapped = referralsData.map((r) => ({
          id: r.id,
          referredId: r.referred_id,
          coinsEarned: r.coins_earned || 0,
          status: r.status || 'pending',
          createdAt: r.created_at,
        }));
        setReferrals(mapped);
        setTotalEarned(mapped.reduce((sum, r) => sum + (r.status === 'completed' ? r.coinsEarned : 0), 0));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyReferralCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Please login first' };

    try {
      // Find the referrer by code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('user_id, code')
        .eq('code', code.toUpperCase())
        .single();

      if (codeError || !codeData) {
        return { success: false, message: 'Invalid referral code' };
      }

      if (codeData.user_id === user.id) {
        return { success: false, message: 'Cannot use your own referral code' };
      }

      // Check if user already used a referral
      const { data: existingRef } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', user.id)
        .single();

      if (existingRef) {
        return { success: false, message: 'You have already used a referral code' };
      }

      // Create referral record
      const { error: refError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: codeData.user_id,
          referred_id: user.id,
          referral_code: code.toUpperCase(),
          status: 'completed',
        });

      if (refError) throw refError;

      // Update uses count
      await supabase
        .from('referral_codes')
        .update({ uses_count: (await supabase.from('referral_codes').select('uses_count').eq('code', code.toUpperCase()).single()).data?.uses_count + 1 || 1 })
        .eq('code', code.toUpperCase());

      // Award coins to both users (50 each)
      const { data: referrerProfile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', codeData.user_id)
        .single();

      const { data: referredProfile } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single();

      if (referrerProfile) {
        await supabase
          .from('profiles')
          .update({ coins: referrerProfile.coins + 50 })
          .eq('id', codeData.user_id);
      }

      if (referredProfile) {
        await supabase
          .from('profiles')
          .update({ coins: referredProfile.coins + 50 })
          .eq('id', user.id);
      }

      return { success: true, message: 'Referral applied! You earned 50 coins!' };
    } catch (error) {
      console.error('Error applying referral:', error);
      return { success: false, message: 'Failed to apply referral code' };
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, [user]);

  return { referralCode, referrals, totalEarned, loading, applyReferralCode, refetch: fetchReferralData };
};
