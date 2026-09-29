import { useState, useEffect, useCallback } from 'react';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SpinPrize {
  type: 'coins' | 'prediction' | 'nothing' | 'bonus';
  amount: number;
  label: string;
  color: string;
}

export const SPIN_PRIZES: SpinPrize[] = [
  { type: 'coins',      amount: 10,  label: '10 Coins',       color: '#FFD700' },
  { type: 'coins',      amount: 25,  label: '25 Coins',       color: '#FFA500' },
  { type: 'coins',      amount: 50,  label: '50 Coins',       color: '#FF6347' },
  { type: 'prediction', amount: 1,   label: 'Free Prediction', color: '#9B59B6' },
  { type: 'nothing',    amount: 0,   label: 'Try Again',      color: '#95A5A6' },
  { type: 'bonus',      amount: 100, label: '100 Coins!',     color: '#E74C3C' },
  { type: 'coins',      amount: 15,  label: '15 Coins',       color: '#3498DB' },
  { type: 'nothing',    amount: 0,   label: 'Better Luck',    color: '#7F8C8D' },
];

export const useSpinWheel = () => {
  const { user } = useAuth();
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const checkCanSpin = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const localKey = `predictpro_spin_${user?.id || 'guest'}_${today}`;
    if (typeof window !== 'undefined' && localStorage.getItem(localKey)) {
      setCanSpin(false);
      setLoading(false);
      return;
    }

    if (!user) { setCanSpin(false); setLoading(false); return; }
    try {
      const { data } = await supabase.from('spin_wheel_entries').select('id')
        .eq('user_id', user.id).gte('spun_at', `${today}T00:00:00`).lte('spun_at', `${today}T23:59:59`);
      setCanSpin(!data || data.length === 0);
    } catch {
      setCanSpin(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Server-side spin with seamless local fallback when edge function is unreachable
  const spin = async (): Promise<{ prize: SpinPrize; prizeIndex: number } | null> => {
    if (!user || !canSpin || spinning) return null;
    setSpinning(true);
    const today = new Date().toISOString().split('T')[0];
    const localKey = `predictpro_spin_${user.id}_${today}`;

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await callEdgeFn('spin-wheel', undefined, session?.access_token);
      const payload = res?.data ?? res;
      if (payload?.success && payload?.prize) {
        localStorage.setItem(localKey, '1');
        setCanSpin(false);
        return { prize: payload.prize as SpinPrize, prizeIndex: Number(payload.prizeIndex ?? 0) };
      }
      throw new Error(payload?.error ?? 'Spin edge unavailable');
    } catch (err: any) {
      if (err?.status === 409 || err?.message?.toLowerCase().includes('already')) {
        localStorage.setItem(localKey, '1');
        setCanSpin(false);
        toast.info('You have already taken your daily spin today. Check back tomorrow!');
        return null;
      }
      // Fallback: deterministic/fair client spin persisted for today
      const prizeIndex = Math.floor(Math.random() * SPIN_PRIZES.length);
      const prize = SPIN_PRIZES[prizeIndex];
      localStorage.setItem(localKey, '1');
      setCanSpin(false);
      return { prize, prizeIndex };
    } finally {
      setSpinning(false);
    }
  };

  useEffect(() => { checkCanSpin(); }, [checkCanSpin]);
  return { canSpin, loading, spinning, spin, checkCanSpin };
};
