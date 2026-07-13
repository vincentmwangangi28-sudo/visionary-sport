import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFn } from '@/lib/callEdgeFunction';
import { Loader2, Smartphone, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props { open: boolean; onClose: () => void; plan: string; price: number; }

export const MpesaPaymentDialog = ({ open, onClose, plan, price }: Props) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const pay = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) { toast.error('Enter a valid Safaricom number'); return; }
    const formatted = cleaned.startsWith('0') ? '254' + cleaned.slice(1) : cleaned.startsWith('254') ? cleaned : '254' + cleaned;
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const data = await callEdgeFn('mpesa-stk-push', { phone: formatted, amount: price, plan }, session?.access_token) as { success?: boolean; error?: string };
      if (data?.success) { setSent(true); toast.success('STK Push sent! Enter your M-Pesa PIN.'); }
      else throw new Error(data?.error ?? 'M-Pesa request failed');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'M-Pesa failed. Try again.');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-green-600"/>M-Pesa Payment</DialogTitle>
          <DialogDescription>Lipana M-Pesa STK Push</DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7 text-green-600"/>
            </div>
            <p className="font-semibold">STK Push Sent!</p>
            <p className="text-sm text-muted-foreground">Check your phone and enter your M-Pesa PIN to complete payment.</p>
            <Button onClick={onClose} variant="outline" className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 flex items-center justify-between">
              <div><p className="font-semibold capitalize">{plan} Plan</p><p className="text-sm text-muted-foreground">1 month · KES</p></div>
              <Badge className="bg-green-600 text-white text-base px-3 py-1">KES {price}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Safaricom Number</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712 345 678" type="tel"/>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3"/>Enter the M-Pesa registered number
              </p>
            </div>
            <Button onClick={pay} disabled={loading || !phone} className="w-full gap-2 bg-green-600 hover:bg-green-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin"/>Sending...</> : <><Smartphone className="h-4 w-4"/>Send STK Push</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
