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

interface ContestEntryResult {
  success: boolean;
  error?: string;
  current_coins?: number;
  new_balance?: number;
  message?: string;
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
      // Use atomic function to prevent race conditions
      const { data, error } = await supabase.rpc('enter_contest_atomic', {
        _contest_id: contest.id,
        _entry_fee: contest.entry_fee
      });

      if (error) throw error;

      const result = data as unknown as ContestEntryResult;

      if (!result.success) {
        switch (result.error) {
          case 'insufficient_coins':
            toast.error(`Insufficient coins. You have ${result.current_coins} coins but need ${contest.entry_fee}.`);
            break;
          case 'already_entered':
            toast.error('You have already entered this contest');
            break;
          case 'unauthorized':
            toast.error('Please sign in to enter contests');
            break;
          default:
            toast.error('Failed to enter contest. Please try again.');
        }
        setLoading(false);
        return;
      }

      toast.success(`Successfully entered contest! New balance: ${result.new_balance} coins`);
      setOpen(false);
    } catch (error) {
      console.error('Error entering contest:', error);
      toast.error('Failed to enter contest. Please try again.');
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
