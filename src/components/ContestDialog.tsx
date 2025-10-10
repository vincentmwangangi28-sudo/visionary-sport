import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Coins, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Contest {
  id: string;
  name: string;
  description: string;
  entry_fee: number;
  prize_pool: number;
  start_date: string;
  end_date: string;
}

export const ContestDialog = ({ contest }: { contest: Contest }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleEnterContest = async () => {
    if (!user) {
      toast.error('Please sign in to enter contests');
      return;
    }

    setLoading(true);
    try {
      // Check if user has enough coins
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.coins < contest.entry_fee) {
        toast.error('Insufficient coins. Please purchase more coins.');
        return;
      }

      // Deduct coins and create contest entry
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ coins: profile.coins - contest.entry_fee })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { error: entryError } = await supabase
        .from('contest_entries')
        .insert({
          contest_id: contest.id,
          user_id: user.id,
          score: 0
        });

      if (entryError) {
        if (entryError.code === '23505') {
          toast.error('You have already entered this contest');
        } else {
          throw entryError;
        }
        return;
      }

      // Record transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'contest_entry',
        amount: -contest.entry_fee,
        payment_method: 'coins',
        status: 'completed',
        metadata: { contest_id: contest.id, contest_name: contest.name }
      });

      toast.success('Successfully entered contest!');
      setOpen(false);
    } catch (error) {
      console.error('Error entering contest:', error);
      toast.error('Failed to enter contest');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero">Enter Contest</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contest.name}</DialogTitle>
          <DialogDescription>{contest.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Entry Fee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{contest.entry_fee}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Prize Pool
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{contest.prize_pool}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
          <Button 
            onClick={handleEnterContest} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? 'Entering...' : `Enter for ${contest.entry_fee} coins`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
