import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyPostureData } from '@/types/analytics';
import { Calendar, Clock, Activity, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DailyReportProps {
  data: DailyPostureData;
}

export const DailyReport = ({ data }: DailyReportProps) => {
  const total = data.goodCount + data.moderateCount + data.poorCount;
  const goodPercent = total > 0 ? (data.goodCount / total) * 100 : 0;
  const moderatePercent = total > 0 ? (data.moderateCount / total) * 100 : 0;
  const poorPercent = total > 0 ? (data.poorCount / total) * 100 : 0;

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-status-good';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-status-moderate';
    return 'text-status-poor';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Daily Report</CardTitle>
        </div>
        <CardDescription>
          {new Date(data.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border border-primary/20">
          <div className={`text-5xl font-bold ${getScoreColor(data.averageScore)}`}>
            {data.averageScore}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {getScoreLabel(data.averageScore)}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="text-lg font-semibold">
                {Math.round(data.totalMinutes)} min
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Activity className="h-5 w-5 text-accent" />
            <div>
              <div className="text-sm text-muted-foreground">Sessions</div>
              <div className="text-lg font-semibold">{data.totalSessions}</div>
            </div>
          </div>
        </div>

        {/* Posture Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Posture Breakdown
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-status-good">Good Posture</span>
                <span className="font-medium">{goodPercent.toFixed(0)}%</span>
              </div>
              <Progress value={goodPercent} className="h-2 bg-muted [&>div]:bg-status-good" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-status-moderate">Moderate</span>
                <span className="font-medium">{moderatePercent.toFixed(0)}%</span>
              </div>
              <Progress value={moderatePercent} className="h-2 bg-muted [&>div]:bg-status-moderate" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-status-poor">Poor Posture</span>
                <span className="font-medium">{poorPercent.toFixed(0)}%</span>
              </div>
              <Progress value={poorPercent} className="h-2 bg-muted [&>div]:bg-status-poor" />
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        {data.hourlyBreakdown.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Most Active Hours</h4>
            <div className="flex flex-wrap gap-2">
              {data.hourlyBreakdown
                .sort((a, b) => b.totalReadings - a.totalReadings)
                .slice(0, 3)
                .map((hour) => (
                  <div
                    key={hour.hour}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                  >
                    {hour.hour}:00
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
