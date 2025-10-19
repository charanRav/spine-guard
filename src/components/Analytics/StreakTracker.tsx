import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StreakData } from '@/types/analytics';
import { Flame, Trophy, Calendar, Target } from 'lucide-react';

interface StreakTrackerProps {
  streakData: StreakData;
}

export const StreakTracker = ({ streakData }: StreakTrackerProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-status-good/20 bg-gradient-to-br from-card to-status-good/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-4 w-4 text-status-good" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-status-good">
            {streakData.currentStreak} {streakData.currentStreak === 1 ? 'day' : 'days'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Keep it up! 🔥
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
          <Trophy className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {streakData.longestStreak} {streakData.longestStreak === 1 ? 'day' : 'days'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Personal best 🏆
          </p>
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Good Days</CardTitle>
          <Target className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">
            {streakData.totalGoodDays}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Days with &gt;60% good posture
          </p>
        </CardContent>
      </Card>

      <Card className="border-muted bg-gradient-to-br from-card to-muted/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Last Good Day</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {streakData.lastGoodDay
              ? new Date(streakData.lastGoodDay).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Most recent achievement
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
