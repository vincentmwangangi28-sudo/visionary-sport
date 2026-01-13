import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Flame, Target, Users, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  description: string;
  earned_at: string;
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  first_prediction: <Star className="h-5 w-5" />,
  predictions_10: <Target className="h-5 w-5" />,
  predictions_50: <Target className="h-5 w-5" />,
  predictions_100: <Trophy className="h-5 w-5" />,
  streak_3: <Flame className="h-5 w-5" />,
  streak_5: <Flame className="h-5 w-5" />,
  streak_10: <Flame className="h-5 w-5" />,
  accuracy_70: <Target className="h-5 w-5" />,
  accuracy_80: <Target className="h-5 w-5" />,
  early_bird: <Star className="h-5 w-5" />,
  referrer_5: <Users className="h-5 w-5" />,
  contest_winner: <Trophy className="h-5 w-5" />,
};

const BADGE_COLORS: Record<string, string> = {
  first_prediction: 'from-blue-500 to-blue-600',
  predictions_10: 'from-green-500 to-green-600',
  predictions_50: 'from-purple-500 to-purple-600',
  predictions_100: 'from-yellow-500 to-yellow-600',
  streak_3: 'from-orange-500 to-red-500',
  streak_5: 'from-orange-600 to-red-600',
  streak_10: 'from-red-500 to-pink-600',
  accuracy_70: 'from-teal-500 to-green-500',
  accuracy_80: 'from-emerald-500 to-green-600',
  early_bird: 'from-amber-500 to-yellow-500',
  referrer_5: 'from-indigo-500 to-purple-500',
  contest_winner: 'from-yellow-500 to-amber-600',
};

export const UserBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user]);

  const fetchBadges = async () => {
    try {
      const { data } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user?.id)
        .order('earned_at', { ascending: false });

      setBadges(data || []);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Sign in to view your badges
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Your Badges
          <Badge variant="secondary" className="ml-auto">
            {badges.length} Earned
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <div className="text-center py-6">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No badges yet. Keep predicting to earn your first badge!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`relative p-3 rounded-lg bg-gradient-to-br ${BADGE_COLORS[badge.badge_type] || 'from-gray-500 to-gray-600'} text-white text-center transform hover:scale-105 transition-transform cursor-pointer`}
                title={badge.description}
              >
                <div className="flex justify-center mb-1">
                  {BADGE_ICONS[badge.badge_type] || <Award className="h-5 w-5" />}
                </div>
                <p className="text-xs font-semibold truncate">{badge.badge_name}</p>
                <p className="text-[10px] opacity-75">
                  {format(new Date(badge.earned_at), 'MMM d')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Progress Section */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            🎯 Make predictions to unlock more badges!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
