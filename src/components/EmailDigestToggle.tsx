import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

export const EmailDigestToggle = () => {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.from('profiles').select('email_digest_opt_in').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        setEnabled(data?.email_digest_opt_in ?? true);
        setLoading(false);
      });
  }, [user?.id]);

  const toggle = async (val: boolean) => {
    if (!user) return;
    setEnabled(val);
    const { error } = await supabase.from('profiles').update({ email_digest_opt_in: val }).eq('id', user.id);
    if (error) { toast.error('Failed to update preference'); setEnabled(!val); }
    else toast.success(val ? 'Daily picks email enabled' : 'Daily picks email disabled');
  };

  if (!user || loading) return null;

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Daily Picks Email</p>
            <p className="text-xs text-muted-foreground">Top 3 AI predictions every morning at 7AM EAT</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={toggle} aria-label="Toggle daily picks email" />
      </CardContent>
    </Card>
  );
};
