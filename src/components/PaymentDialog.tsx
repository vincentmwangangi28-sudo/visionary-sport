import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { Loader2, CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface PaymentDialogProps {
  open?: boolean;
  onClose?: () => void;
  plan?: string;
  price?: number;
  priceUsd?: number;
  priceKes?: number;
  children?: React.ReactNode;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open: controlledOpen,
  onClose: controlledOnClose,
  plan = 'pro',
  price,
  priceUsd,
  children,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleClose = () => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  const effectivePriceCents = price ?? priceUsd ?? 999;

  const pay = async () => {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        toast.error('Please sign in first');
        return;
      }
      const data = await callEdgeFn(
        'stripe-payment',
        { plan, currency: 'usd', amount: effectivePriceCents },
        session.access_token
      ) as { url?: string; error?: string };

      if (data?.url) {
        window.open(data.url, '_blank');
        handleClose();
      } else {
        throw new Error(data?.error ?? 'Payment failed');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isControlled && children && (
        <span onClick={() => setInternalOpen(true)} className="contents cursor-pointer">
          {children}
        </span>
      )}

      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Card Payment
            </DialogTitle>
            <DialogDescription>Pay securely via Stripe Checkout</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-4 flex items-center justify-between border">
              <div>
                <p className="font-semibold capitalize text-sm">{plan} Plan</p>
                <p className="text-xs text-muted-foreground">1 month access · Auto-renews</p>
              </div>
              <Badge className="text-base font-mono px-3 py-1">
                ${(effectivePriceCents / 100).toFixed(2)}
              </Badge>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {['Secure 256-bit encrypted checkout', 'Cancel anytime with one click', 'Instant VIP unlock'].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <Button onClick={pay} disabled={loading} className="w-full gap-2 font-bold" size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to Stripe...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pay ${(effectivePriceCents / 100).toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
