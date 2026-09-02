import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { Loader2, Smartphone, Check, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  plan: string;
  price: number;
}

/**
 * WavaveExpressPaymentDialog - Fast mobile money payment via Wavave Express
 * 
 * Features:
 * - Instant payment notifications
 * - Support for all Kenyan mobile networks
 * - Real-time transaction tracking
 * - Automatic subscription activation on success
 * 
 * @param open - Dialog visibility state
 * @param onClose - Callback when dialog closes
 * @param plan - Subscription plan ID (basic/pro/vip)
 * @param price - Amount in KES
 */
export const WavaveExpressPaymentDialog = ({ open, onClose, plan, price }: Props) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const pay = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) {
      toast.error('Enter a valid mobile number');
      return;
    }

    // Format phone number for Wavave (254XXXXXXXXX or +254XXXXXXXXX)
    const formatted = cleaned.startsWith('0')
      ? '254' + cleaned.slice(1)
      : cleaned.startsWith('254')
      ? cleaned
      : '254' + cleaned;

    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const data = await callEdgeFn(
        'wavave-express',
        { phone: formatted, amount: price, purpose: 'premium_subscription', plan },
        session?.access_token
      ) as { success?: boolean; error?: string; data?: { reference: string } };

      if (data?.success) {
        setSent(true);
        setReference(data.data?.reference || null);
        toast.success('🎉 Payment initiated! Check your phone for the prompt.');
      } else {
        throw new Error(data?.error ?? 'Payment request failed');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Wavave Express
          </DialogTitle>
          <DialogDescription>
            Fast & instant mobile money payment
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-lg">Payment Initiated!</p>
              <p className="text-sm text-muted-foreground">
                You'll receive a prompt on your phone. Complete the payment to activate your subscription.
              </p>
              {reference && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Ref: {reference}
                </Badge>
              )}
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-sm text-muted-foreground">
              ⏱️ Payment confirmation may take up to 30 seconds
            </div>
            <Button onClick={onClose} className="w-full" variant="default">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Provider info */}
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Wavave Express</p>
                <p className="text-xs text-muted-foreground">All networks (Safaricom, Airtel, etc.)</p>
              </div>
              <Zap className="h-5 w-5 text-amber-600" />
            </div>

            {/* Amount display */}
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">KES {price.toLocaleString()}</p>
            </div>

            {/* Phone input */}
            <div className="space-y-2">
              <label htmlFor="wavave-phone" className="text-sm font-medium">
                Mobile Number
              </label>
              <Input
                id="wavave-phone"
                type="tel"
                placeholder="+254712345678 or 0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground">
                Works with Safaricom, Airtel, and all Kenyan networks
              </p>
            </div>

            {/* Pay button */}
            <Button
              onClick={pay}
              disabled={loading || !phone}
              className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4" />
                  Send Payment Prompt
                </>
              )}
            </Button>

            {/* Security note */}
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                🔒 Secure payment via <strong>Wavave Express</strong>. Your phone number is never stored.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
