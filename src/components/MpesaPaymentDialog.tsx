import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { Loader2, Smartphone, Check, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

export interface MpesaPaymentDialogProps {
  open?: boolean;
  onClose?: () => void;
  plan?: string;
  price?: number;
  amount?: number;
  title?: string;
  buttonText?: string;
  purpose?: string;
  children?: React.ReactNode;
}

export const MpesaPaymentDialog: React.FC<MpesaPaymentDialogProps> = ({
  open: controlledOpen,
  onClose: controlledOnClose,
  plan = 'pro',
  price,
  amount,
  title,
  buttonText,
  purpose = 'premium_subscription',
  children,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [provider, setProvider] = useState<'mpesa' | 'wavave'>('mpesa');

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleClose = () => {
    if (isControlled) {
      controlledOnClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  const effectivePrice = price ?? amount ?? 500;

  const pay = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) {
      toast.error(provider === 'mpesa' ? 'Enter a valid Safaricom number' : 'Enter a valid mobile number');
      return;
    }
    const formatted = cleaned.startsWith('0')
      ? '254' + cleaned.slice(1)
      : cleaned.startsWith('254')
      ? cleaned
      : '254' + cleaned;

    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;

      if (provider === 'wavave') {
        let data: { success?: boolean; error?: string } | null = null;
        try {
          data = await callEdgeFn('wavave-express', { phone: formatted, amount: effectivePrice, purpose, plan }, session?.access_token);
        } catch {
          data = await callEdgeFn('paywave-express', { phone: formatted, amount: effectivePrice, purpose, plan }, session?.access_token);
        }
        if (data?.success) {
          setSent(true);
          toast.success('Prompt sent! Check your phone to complete payment.');
        } else {
          throw new Error(data?.error ?? 'Payment request failed');
        }
      } else {
        const data = await callEdgeFn(
          'mpesa-stk-push',
          { phone: formatted, amount: effectivePrice, plan, purpose },
          session?.access_token
        ) as { success?: boolean; error?: string };

        if (data?.success) {
          setSent(true);
          toast.success('STK Push sent! Enter your M-Pesa PIN.');
        } else {
          throw new Error(data?.error ?? 'M-Pesa request failed');
        }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button when uncontrolled */}
      {!isControlled && (
        children ? (
          <span onClick={() => setInternalOpen(true)} className="contents cursor-pointer">
            {children}
          </span>
        ) : (
          <Button
            onClick={() => setInternalOpen(true)}
            className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            <Smartphone className="h-4 w-4" />
            {buttonText || `Pay KES ${effectivePrice}`}
          </Button>
        )
      )}

      <Dialog open={isOpen} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {provider === 'mpesa' ? (
                <Smartphone className="h-5 w-5 text-green-600" />
              ) : (
                <Zap className="h-5 w-5 text-blue-600" />
              )}
              {title || (provider === 'mpesa' ? 'M-Pesa Payment' : 'PayWave / Wavave Express')}
            </DialogTitle>
            <DialogDescription>
              {provider === 'mpesa'
                ? 'Safaricom M-Pesa STK push notification'
                : 'Instant payment across all Kenyan mobile networks'}
            </DialogDescription>
          </DialogHeader>

          {sent ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <p className="font-semibold text-lg">Payment Prompt Sent!</p>
              <p className="text-sm text-muted-foreground">
                Check your phone screen and enter your PIN to authorize the payment.
              </p>
              <Button onClick={handleClose} variant="outline" className="w-full mt-2">
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Payment Provider Toggle */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/50 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setProvider('mpesa')}
                  className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all ${
                    provider === 'mpesa'
                      ? 'bg-background shadow-xs text-foreground font-bold border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5 text-green-600" />
                  M-Pesa (Daraja)
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('wavave')}
                  className={`py-1.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all ${
                    provider === 'wavave'
                      ? 'bg-background shadow-xs text-foreground font-bold border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  Wavave Express
                </button>
              </div>

              <div className="bg-muted/40 rounded-xl p-3.5 flex items-center justify-between border">
                <div>
                  <p className="font-semibold capitalize text-sm">{plan} Plan</p>
                  <p className="text-xs text-muted-foreground">1 month access · Full AI picks</p>
                </div>
                <Badge className="bg-primary text-primary-foreground text-sm font-mono px-2.5 py-0.5">
                  KES {effectivePrice.toLocaleString()}
                </Badge>
              </div>

              <div>
                <label htmlFor="mobile-phone-input" className="text-sm font-medium mb-1.5 block">
                  {provider === 'mpesa' ? 'Safaricom Phone Number' : 'Mobile Number (All Networks)'}
                </label>
                <Input
                  id="mobile-phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  type="tel"
                  aria-label="Mobile phone number for payment"
                />
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {provider === 'mpesa' ? 'Registered M-Pesa line' : 'Works with Safaricom, Airtel, Equity & more'}
                </p>
              </div>

              <Button
                onClick={pay}
                disabled={loading || !phone}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Prompt...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    Send Payment Prompt
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
