import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Smartphone, Loader2, CheckCircle, Crown } from 'lucide-react';

interface MpesaPaymentDialogProps {
  purpose: 'premium_subscription' | 'coin_purchase' | 'tip';
  amount?: number;
  title?: string;
  description?: string;
  buttonText?: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export const MpesaPaymentDialog = ({
  purpose,
  amount: fixedAmount,
  title = 'M-Pesa Payment',
  description,
  buttonText = 'Pay with M-Pesa',
  onSuccess,
  children,
}: MpesaPaymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState(fixedAmount?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success'>('idle');

  const handlePayment = async () => {
    if (!phone) {
      toast({ title: 'Error', description: 'Please enter your M-Pesa phone number', variant: 'destructive' });
      return;
    }

    const paymentAmount = fixedAmount || parseInt(amount);
    if (!paymentAmount || paymentAmount < 10) {
      toast({ title: 'Error', description: 'Minimum amount is KES 10', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setStatus('pending');

    // Track GA4 event
    if (typeof gtag !== 'undefined') {
      gtag('event', 'payment_initiated', {
        event_category: 'Payments',
        event_label: purpose,
        value: paymentAmount,
        payment_method: 'mpesa',
      });
    }

    try {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: { phone, amount: paymentAmount, purpose },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Check Your Phone',
          description: 'Enter your M-Pesa PIN to complete the payment',
        });
        setStatus('success');
        
        // Track successful initiation
        if (typeof gtag !== 'undefined') {
          gtag('event', 'stk_push_sent', {
            event_category: 'Payments',
            event_label: purpose,
            value: paymentAmount,
          });
        }

        // Wait a few seconds then close
        setTimeout(() => {
          setOpen(false);
          setStatus('idle');
          onSuccess?.();
        }, 5000);
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const purposeDetails = {
    premium_subscription: {
      icon: Crown,
      defaultAmount: 500,
      description: 'Unlock premium predictions with higher confidence scores and detailed analysis.',
    },
    coin_purchase: {
      icon: CreditCard,
      defaultAmount: 100,
      description: 'Purchase coins to unlock predictions and enter contests.',
    },
    tip: {
      icon: Smartphone,
      defaultAmount: 50,
      description: 'Support PredictPro with a tip.',
    },
  };

  const details = purposeDetails[purpose];
  const Icon = details.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Smartphone className="h-4 w-4" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description || details.description}
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-primary mx-auto animate-pulse" />
            <div>
              <h3 className="text-lg font-semibold">STK Push Sent!</h3>
              <p className="text-muted-foreground">
                Check your phone and enter your M-Pesa PIN to complete the payment.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                placeholder="0712345678 or 254712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your Safaricom M-Pesa number
              </p>
            </div>

            {!fixedAmount && (
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={details.defaultAmount.toString()}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={10}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum amount is KES 10
                </p>
              </div>
            )}

            {fixedAmount && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Amount to pay</p>
                <p className="text-2xl font-bold text-primary">KES {fixedAmount}</p>
              </div>
            )}

            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending STK Push...
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Pay KES {fixedAmount || amount || details.defaultAmount}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Lipana • M-Pesa
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Declare gtag for TypeScript
declare function gtag(...args: any[]): void;
