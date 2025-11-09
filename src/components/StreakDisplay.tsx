import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useStreakData } from "@/hooks/useStreakData";
import { Flame, TrendingUp, Award } from "lucide-react";

export const StreakDisplay = () => {
  const { streakData, loading } = useStreakData();

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32"></div>
          <div className="h-12 bg-muted rounded w-24"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <div className="space-y-6">
        {/* Current Streak */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-foreground">Current Streak</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">
              {streakData.currentStreak}
            </span>
            <span className="text-muted-foreground">wins in a row</span>
          </div>
        </div>

        {/* Longest Streak */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-foreground">Best Streak</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-secondary">
              {streakData.longestStreak}
            </span>
            <span className="text-muted-foreground text-sm">all-time record</span>
          </div>
        </div>

        {/* Badges */}
        {streakData.badges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-foreground">Badges Earned</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {streakData.badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm px-3 py-1"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {streakData.currentStreak === 0 && (
          <p className="text-sm text-muted-foreground">
            Start your winning streak today! Get 3 correct predictions to unlock your first badge.
          </p>
        )}
        {streakData.currentStreak > 0 && streakData.currentStreak < 3 && (
          <p className="text-sm text-muted-foreground">
            🔥 Keep it up! {3 - streakData.currentStreak} more to unlock the "Hot Hand" badge!
          </p>
        )}
        {streakData.currentStreak >= 3 && streakData.currentStreak < 5 && (
          <p className="text-sm text-muted-foreground">
            🎯 You're on fire! {5 - streakData.currentStreak} more to become a "Sharp Shooter"!
          </p>
        )}
        {streakData.currentStreak >= 5 && (
          <p className="text-sm text-muted-foreground">
            🌟 Incredible streak! Keep going to become a legend!
          </p>
        )}
      </div>
    </Card>
  );
};
