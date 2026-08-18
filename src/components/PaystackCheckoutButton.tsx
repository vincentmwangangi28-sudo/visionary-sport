import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { Loader2, CreditCard, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface Props { plan: 'basic' | 'pro' | 'vip'; className?: string; }

const PRICING: Record<string, { display: string; note: string }> = {
  KE: { display: 'KES 500', note: 'Card or M-Pesa' },
  NG: { display: 'NGN 3,000', note: 'Card or Mobile Money' },
  DEFAULT: { display: '$5', note: 'Card' },
};

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const PaystackCheckoutButton = ({ plan, className = '' }: Props) => {
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState('DEFAULT');

  useEffect(() => {
    // Set by middleware.ts (Vercel Edge, reads x-vercel-ip-country) — instant,
    // no client-side geolocation roundtrip needed.
    const c = readCookie('pp_country');
    if (c && PRICING[c]) setCountry(c);
  }, []);

  const pricing = PRICING[country] ?? PRICING.DEFAULT;

  const pay = async () => {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) { toast.error('Please sign in first'); setLoading(false); return; }
      const data = await callEdgeFn(
        'paystack-initialize',
        { plan, country, callback_url: `${window.location.origin}/shop?paystack=success` },
        session.access_token
      ) as { authorization_url?: string; error?: string };
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else throw new Error(data?.error ?? 'Could not start checkout');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Payment failed to start');
      setLoading(false);
    }
  };

  return (
    <Button onClick={pay} disabled={loading} className={`gap-2 ${className}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : country === 'KE' ? <Smartphone className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
      Pay {pricing.display} <span className="opacity-70 text-xs">· {pricing.note}</span>
    </Button>
  );
};
