import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Crown, CreditCard, Smartphone, Globe, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MpesaPaymentDialog } from './MpesaPaymentDialog';
import { Link } from 'react-router-dom';

interface PaymentDialogProps {
  plan: string; priceKes: number; priceUsd: number;
  children?: React.ReactNode; onSuccess?: () => void;
}

export const PaymentDialog = ({ plan, priceKes, priceUsd, children, onSuccess }: PaymentDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'stripe' | 'mpesa' | null>(null);

  const handleStripe = async () => {
    if (!user) { toast.error('Sign in first'); return; }
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const { data, error } = await supabase.functions.invoke('stripe-payment', {
        body: { plan, currency: 'usd', successUrl: `${window.location.origin}/shop?success=true`, cancelUrl: window.location.href },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error || !data?.url) throw new Error(data?.error || 'Failed to create payment');
      window.location.href = data.url;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Payment failed');
    } finally { setLoading(false); }
  };

  if (!user) return (
    <DialogTrigger asChild>
      {children || <Button>Upgrade</Button>}
    </DialogTrigger>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button className="gap-2"><Crown className="h-4 w-4" />Upgrade</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" />Choose Payment Method</DialogTitle>
          <DialogDescription>Select how you'd like to pay for the {plan.toUpperCase()} plan</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* Stripe - International */}
          <button onClick={handleStripe} disabled={loading}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left group">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : <Globe className="h-5 w-5 text-blue-600" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold">Card / International</p>
              <p className="text-sm text-muted-foreground">Visa, Mastercard, Apple Pay • ${(priceUsd / 100).toFixed(2)} USD</p>
            </div>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 px-2 py-0.5 rounded-full">Global</span>
          </button>

          {/* M-Pesa - Africa */}
          <MpesaPaymentDialog purpose="premium_subscription" amount={priceKes} title={`${plan.toUpperCase()} Plan — M-Pesa`} onSuccess={() => { setOpen(false); onSuccess?.(); }}>
            <button className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-green-500/50 hover:bg-green-50/10 transition-all text-left">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">M-Pesa</p>
                <p className="text-sm text-muted-foreground">Safaricom STK Push • KES {priceKes}</p>
              </div>
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 px-2 py-0.5 rounded-full">Kenya</span>
            </button>
          </MpesaPaymentDialog>
        </div>
        <p className="text-xs text-center text-muted-foreground">Secure payments • Cancel anytime</p>
      </DialogContent>
    </Dialog>
  );
};
