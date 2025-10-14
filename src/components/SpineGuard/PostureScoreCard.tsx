import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SessionData } from './types';

interface PostureScoreCardProps {
  sessionData: SessionData;
}

export const PostureScoreCard = ({ sessionData }: PostureScoreCardProps) => {
  const total = sessionData.goodCount + sessionData.moderateCount + sessionData.poorCount;
  
  if (total === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Posture Score</h3>
          <p className="text-sm text-muted-foreground">Start monitoring to see your score</p>
        </div>
      </Card>
    );
  }

  const score = Math.round(
    ((sessionData.goodCount * 100 + sessionData.moderateCount * 60 + sessionData.poorCount * 20) / total)
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-status-good';
    if (score >= 60) return 'text-status-moderate';
    return 'text-status-poor';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Work';
  };

  const getTrendIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-5 h-5 text-status-good" />;
    if (score >= 60) return <Minus className="w-5 h-5 text-status-moderate" />;
    return <TrendingDown className="w-5 h-5 text-status-poor" />;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Posture Score</h3>
        {getTrendIcon(score)}
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{getScoreLabel(score)}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-status-good">{sessionData.goodCount}</div>
            <div className="text-xs text-muted-foreground">Good</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-status-moderate">{sessionData.moderateCount}</div>
            <div className="text-xs text-muted-foreground">Moderate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-status-poor">{sessionData.poorCount}</div>
            <div className="text-xs text-muted-foreground">Poor</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
