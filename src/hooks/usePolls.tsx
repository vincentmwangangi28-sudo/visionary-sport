import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Poll {
  id: string;
  question: string;
  match_id: string | null;
  options: { label: string; votes: number }[];
  is_active: boolean;
  ends_at: string | null;
  created_at: string;
}

interface PollVote {
  poll_id: string;
  option_index: number;
}

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Parse options JSON
      const parsedPolls = (data || []).map((poll: any) => ({
        ...poll,
        options: typeof poll.options === 'string' ? JSON.parse(poll.options) : poll.options || [],
      }));

      setPolls(parsedPolls);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('poll_id, option_index')
        .eq('user_id', user.id);

      if (error) throw error;

      const votesMap: Record<string, number> = {};
      (data || []).forEach((vote: PollVote) => {
        votesMap[vote.poll_id] = vote.option_index;
      });
      setUserVotes(votesMap);
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  const vote = async (pollId: string, optionIndex: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Must be logged in to vote');
    }

    // Check if already voted
    if (userVotes[pollId] !== undefined) {
      throw new Error('You have already voted on this poll');
    }

    const { error } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: pollId,
        user_id: user.id,
        option_index: optionIndex,
      });

    if (error) throw error;

    // Update local state
    setUserVotes(prev => ({ ...prev, [pollId]: optionIndex }));
    
    // Refetch polls to get updated vote counts
    await fetchPolls();
  };

  useEffect(() => {
    fetchPolls();
    fetchUserVotes();

    // Real-time subscription
    const channel = supabase
      .channel('polls-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => {
        fetchPolls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { polls, loading, vote, userVotes, refetch: fetchPolls };
}
