import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Medal, Award, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ReferralLeader {
  user_id: string;
  uses_count: number;
  profile: {
    full_name: string | null;
    email: string;
  } | null;
}

export const ReferralLeaderboard = () => {
  const [leaders, setLeaders] = useState<ReferralLeader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      // Get referral codes first
      const { data: referralData, error: referralError } = await supabase
        .from('referral_codes')
        .select('user_id, uses_count')
        .order('uses_count', { ascending: false })
        .limit(10);

      if (referralError) {
        console.error('Error loading referral codes:', referralError);
        setLoading(false);
        return;
      }

      if (!referralData || referralData.length === 0) {
        setLeaders([]);
        setLoading(false);
        return;
      }

      // Get profiles for these users
      const userIds = referralData.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Map profiles to referral data
      const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      setLeaders(referralData.map(r => ({
        user_id: r.user_id,
        uses_count: r.uses_count || 0,
        profile: profileMap.get(r.user_id) || null,
      })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-orange-600" />;
    return <span className="font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-400/20 to-transparent border-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-orange-500/20 to-transparent border-orange-500/30';
    return 'bg-muted/30';
  };

  const maskEmail = (email: string) => {
    if (!email) return 'Anonymous';
    return email.replace(/(.{2}).*(@.*)/, '$1***$2');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Referral Champions
            </CardTitle>
            <CardDescription>Top referrers earning the most coins</CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {leaders.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No referrals yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((leader, index) => (
              <div
                key={leader.user_id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:scale-[1.02] ${getRankStyle(index)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {leader.profile?.full_name || maskEmail(leader.profile?.email || '')}
                    </p>
                    {index < 3 && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {index === 0 ? '👑 Champion' : index === 1 ? '🥈 Elite' : '🥉 Rising Star'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-500">
                    {leader.uses_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">referrals</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Motivational message */}
        <div className="mt-4 p-3 bg-primary/5 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            🎯 Invite friends and climb the leaderboard! Each referral = 50 coins
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
