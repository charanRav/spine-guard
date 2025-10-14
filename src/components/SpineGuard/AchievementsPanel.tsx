import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Award, Zap, Crown } from 'lucide-react';
import { Achievement } from './types';

interface AchievementsPanelProps {
  achievements: Achievement[];
}

const iconMap: Record<string, any> = {
  trophy: Trophy,
  star: Star,
  target: Target,
  award: Award,
  zap: Zap,
  crown: Crown,
};

export const AchievementsPanel = ({ achievements }: AchievementsPanelProps) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Achievements
        </h3>
        <Badge variant="secondary" className="font-mono">
          {unlockedCount}/{achievements.length}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => {
          const Icon = iconMap[achievement.icon] || Trophy;
          return (
            <div
              key={achievement.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                achievement.unlocked
                  ? 'bg-primary/10 border-primary shadow-lg shadow-primary/20'
                  : 'bg-muted/50 border-muted opacity-50'
              }`}
            >
              <Icon
                className={`w-6 h-6 mb-2 ${
                  achievement.unlocked ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <h4 className="font-semibold text-xs mb-1">{achievement.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {achievement.description}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
