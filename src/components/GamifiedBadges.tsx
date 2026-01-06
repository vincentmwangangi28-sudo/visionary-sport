import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Target, Star, Clock, Zap, Award, Crown } from "lucide-react";

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface GamifiedBadgesProps {
  correctPredictions?: number;
  currentStreak?: number;
  totalPredictions?: number;
  earlyBirdCount?: number;
  contestWins?: number;
}

export const GamifiedBadges = ({
  correctPredictions = 0,
  currentStreak = 0,
  totalPredictions = 0,
  earlyBirdCount = 0,
  contestWins = 0,
}: GamifiedBadgesProps) => {
  const badges: UserBadge[] = [
    {
      id: 'first-win',
      name: 'First Win',
      description: 'Get your first correct prediction',
      icon: Star,
      unlocked: correctPredictions >= 1,
      progress: Math.min(correctPredictions, 1),
      maxProgress: 1,
      rarity: 'common',
    },
    {
      id: 'streak-master',
      name: 'Streak Master',
      description: 'Achieve a 5-prediction winning streak',
      icon: Flame,
      unlocked: currentStreak >= 5,
      progress: Math.min(currentStreak, 5),
      maxProgress: 5,
      rarity: 'rare',
    },
    {
      id: 'sharpshooter',
      name: 'Sharpshooter',
      description: 'Get 10 correct high-confidence predictions',
      icon: Target,
      unlocked: correctPredictions >= 10,
      progress: Math.min(correctPredictions, 10),
      maxProgress: 10,
      rarity: 'rare',
    },
    {
      id: 'top-predictor',
      name: 'Top Predictor',
      description: 'Make 50 total predictions',
      icon: Trophy,
      unlocked: totalPredictions >= 50,
      progress: Math.min(totalPredictions, 50),
      maxProgress: 50,
      rarity: 'epic',
    },
    {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'Make predictions 24h before 10 matches',
      icon: Clock,
      unlocked: earlyBirdCount >= 10,
      progress: Math.min(earlyBirdCount, 10),
      maxProgress: 10,
      rarity: 'rare',
    },
    {
      id: 'lightning-fast',
      name: 'Lightning Fast',
      description: 'Win 3 predictions in a single day',
      icon: Zap,
      unlocked: false, // Would need daily tracking
      progress: 0,
      maxProgress: 3,
      rarity: 'epic',
    },
    {
      id: 'contest-champion',
      name: 'Contest Champion',
      description: 'Win a prediction contest',
      icon: Award,
      unlocked: contestWins >= 1,
      progress: Math.min(contestWins, 1),
      maxProgress: 1,
      rarity: 'legendary',
    },
    {
      id: 'legend',
      name: 'Legend',
      description: 'Achieve 100 correct predictions',
      icon: Crown,
      unlocked: correctPredictions >= 100,
      progress: Math.min(correctPredictions, 100),
      maxProgress: 100,
      rarity: 'legendary',
    },
  ];

  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      case 'epic':
        return 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50';
      case 'rare':
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/50';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Legendary</Badge>;
      case 'epic':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">Epic</Badge>;
      case 'rare':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Rare</Badge>;
      default:
        return <Badge variant="outline">Common</Badge>;
    }
  };

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Achievement Badges
          </CardTitle>
          <Badge variant="secondary">
            {unlockedCount}/{badges.length} Unlocked
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge) => {
            const IconComponent = badge.icon;
            return (
              <div
                key={badge.id}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-300
                  ${badge.unlocked 
                    ? getRarityStyles(badge.rarity) + ' hover:scale-105' 
                    : 'bg-muted/20 border-border/30 opacity-50'
                  }
                `}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`
                    p-3 rounded-full 
                    ${badge.unlocked ? 'bg-primary/20' : 'bg-muted'}
                  `}>
                    <IconComponent className={`
                      w-6 h-6 
                      ${badge.unlocked ? 'text-primary' : 'text-muted-foreground'}
                    `} />
                  </div>
                  <h4 className="font-semibold text-sm">{badge.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {badge.description}
                  </p>
                  {!badge.unlocked && (
                    <div className="w-full space-y-1">
                      <Progress 
                        value={(badge.progress / badge.maxProgress) * 100} 
                        className="h-1"
                      />
                      <span className="text-xs text-muted-foreground">
                        {badge.progress}/{badge.maxProgress}
                      </span>
                    </div>
                  )}
                  {badge.unlocked && getRarityBadge(badge.rarity)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
