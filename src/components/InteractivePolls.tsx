import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePolls } from '@/hooks/usePolls';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export function InteractivePolls() {
  const { polls, loading, vote, userVotes } = usePolls();
  const { user } = useAuth();

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    try {
      await vote(pollId, optionIndex);
      toast.success('Vote recorded! 🗳️');
      
      // GA4 tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'poll_vote', {
          'event_category': 'Engagement',
          'poll_id': pollId,
          'option_index': optionIndex,
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to vote');
    }
  };

  const getTotalVotes = (options: { label: string; votes: number }[]) => {
    return options.reduce((sum, opt) => sum + opt.votes, 0);
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Match Polls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (polls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Match Polls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No active polls at the moment. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Match Polls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {polls.map(poll => {
          const hasVoted = userVotes[poll.id] !== undefined;
          const totalVotes = getTotalVotes(poll.options);

          return (
            <div key={poll.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold">{poll.question}</h4>
                {poll.ends_at && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Ends {format(new Date(poll.ends_at), 'MMM d, HH:mm')}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {poll.options.map((option, index) => {
                  const percentage = getVotePercentage(option.votes, totalVotes);
                  const isUserVote = userVotes[poll.id] === index;

                  return (
                    <div key={index} className="space-y-1">
                      {hasVoted ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className={isUserVote ? 'font-semibold text-primary' : ''}>
                              {option.label}
                              {isUserVote && <CheckCircle2 className="h-4 w-4 inline ml-1" />}
                            </span>
                            <span>{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" aria-label={`${option.label}: ${percentage}%`} />
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleVote(poll.id, index)}
                        >
                          {option.label}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
