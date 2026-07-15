import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { Loader2, CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props { open: boolean; onClose: () => void; plan: string; price: number; }

export const PaymentDialog = ({ open, onClose, plan, price }: Props) => {
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      const sessionResult = await supabase.auth.getSession();
      const session = sessionResult?.data?.session ?? null;
      if (!session?.access_token) { toast.error('Please sign in first'); setLoading(false); return; }
      const data = await callEdgeFn('stripe-payment', { plan, currency: 'usd' }, session.access_token) as { url?: string; error?: string };
      if (data?.url) {
        window.open(data.url, '_blank');
        onClose();
      } else throw new Error(data?.error ?? 'Payment failed');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Payment failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary"/>Card Payment</DialogTitle>
          <DialogDescription>Pay securely via Stripe</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold capitalize">{plan} Plan</p>
              <p className="text-sm text-muted-foreground">1 month access</p>
            </div>
            <Badge className="text-base px-3 py-1">${(price/100).toFixed(2)}</Badge>
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            {['Secure Stripe checkout','Cancel anytime','Instant activation'].map(f => (
              <div key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600"/>{f}</div>
            ))}
          </div>
          <Button onClick={pay} disabled={loading} className="w-full gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin"/>Processing...</> : <><CreditCard className="h-4 w-4"/>Pay ${(price/100).toFixed(2)}</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
