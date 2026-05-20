import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Smartphone, Loader2, CheckCircle, XCircle, Crown } from 'lucide-react';

interface MpesaPaymentDialogProps {
  purpose: 'premium_subscription' | 'coin_purchase' | 'tip';
  amount?: number;
  title?: string;
  description?: string;
  buttonText?: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

type PaymentStatus = 'idle' | 'pending' | 'polling' | 'success' | 'failed';

export const MpesaPaymentDialog = ({
  purpose, amount: fixedAmount, title = 'M-Pesa Payment',
  description, buttonText = 'Pay with M-Pesa', onSuccess, children,
}: MpesaPaymentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState(fixedAmount?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll transaction status after STK push
  useEffect(() => {
    if (status !== 'polling' || !transactionId) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 20; // 60s total

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const { data } = await supabase
          .from('transactions')
          .select('status')
          .eq('id', transactionId)
          .single();

        if (data?.status === 'completed') {
          clearInterval(pollRef.current!);
          setStatus('success');
          onSuccess?.();
        } else if (data?.status === 'failed') {
          clearInterval(pollRef.current!);
          setStatus('failed');
        } else if (attempts >= MAX_ATTEMPTS) {
          clearInterval(pollRef.current!);
          setStatus('failed');
        }
      } catch { /* ignore transient errors */ }
    }, 3000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status, transactionId, onSuccess]);

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

    try {
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: { phone, amount: paymentAmount, purpose },
      });

      if (error) throw error;

      if (data.success) {
        toast({ title: 'Check Your Phone', description: 'Enter your M-Pesa PIN to complete the payment' });
        setTransactionId(data.data?.transactionId ?? null);
        setStatus('polling');
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error: any) {
      toast({ title: 'Payment Failed', description: error.message || 'Something went wrong.', variant: 'destructive' });
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      if (pollRef.current) clearInterval(pollRef.current);
      setTimeout(() => { setStatus('idle'); setTransactionId(null); }, 300);
    }
    setOpen(val);
  };

  const purposeDetails = {
    premium_subscription: { icon: Crown, defaultAmount: 500, description: 'Unlock premium predictions with higher confidence scores.' },
    coin_purchase: { icon: CreditCard, defaultAmount: 100, description: 'Purchase coins to unlock predictions and enter contests.' },
    tip: { icon: Smartphone, defaultAmount: 50, description: 'Support PredictPro with a tip.' },
  };
  const details = purposeDetails[purpose];
  const Icon = details.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {children || <Button className="bg-primary hover:bg-primary/90 gap-2"><Smartphone className="h-4 w-4" />{buttonText}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" />{title}</DialogTitle>
          <DialogDescription>{description || details.description}</DialogDescription>
        </DialogHeader>

        {status === 'success' && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <div><h3 className="text-lg font-semibold">Payment Confirmed!</h3>
              <p className="text-muted-foreground">Your payment was successful. Enjoy your purchase!</p></div>
            <Button onClick={() => handleClose(false)}>Done</Button>
          </div>
        )}

        {status === 'failed' && (
          <div className="py-8 text-center space-y-4">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <div><h3 className="text-lg font-semibold">Payment Failed</h3>
              <p className="text-muted-foreground">The payment was not completed. Please try again.</p></div>
            <Button variant="outline" onClick={() => setStatus('idle')}>Try Again</Button>
          </div>
        )}

        {status === 'polling' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
            <div><h3 className="text-lg font-semibold">Waiting for Payment…</h3>
              <p className="text-muted-foreground">Enter your M-Pesa PIN on your phone. This may take up to 60 seconds.</p></div>
          </div>
        )}

        {(status === 'idle' || status === 'pending') && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input id="phone" placeholder="0712345678 or 254712345678" value={phone}
                onChange={(e) => setPhone(e.target.value)} disabled={loading} />
              <p className="text-xs text-muted-foreground">Enter your Safaricom M-Pesa number</p>
            </div>

            {!fixedAmount && (
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input id="amount" type="number" placeholder={details.defaultAmount.toString()} value={amount}
                  onChange={(e) => setAmount(e.target.value)} min={10} disabled={loading} />
              </div>
            )}

            {fixedAmount && (
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Amount to pay</p>
                <p className="text-2xl font-bold text-primary">KES {fixedAmount}</p>
              </div>
            )}

            <Button onClick={handlePayment} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending STK Push…</> : <><Smartphone className="h-4 w-4 mr-2" />Pay KES {fixedAmount || amount || details.defaultAmount}</>}
            </Button>

            <p className="text-xs text-center text-muted-foreground">Secure payment powered by Lipana • M-Pesa</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
