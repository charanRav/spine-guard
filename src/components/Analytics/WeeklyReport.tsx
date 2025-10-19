import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyPostureData } from '@/types/analytics';
import { CalendarDays, Award, Clock, Target } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface WeeklyReportProps {
  data: DailyPostureData[];
}

export const WeeklyReport = ({ data }: WeeklyReportProps) => {
  const totalMinutes = data.reduce((sum, d) => sum + d.totalMinutes, 0);
  const totalSessions = data.reduce((sum, d) => sum + d.totalSessions, 0);
  const averageScore = data.length > 0
    ? data.reduce((sum, d) => sum + d.averageScore, 0) / data.length
    : 0;

  const activeDays = data.filter((d) => d.totalSessions > 0).length;

  const chartData = data.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    score: day.averageScore,
  }));

  const chartConfig = {
    score: {
      label: 'Score',
      color: 'hsl(var(--primary))',
    },
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
          <CalendarDays className="h-5 w-5 text-primary" />
          <CardTitle>Weekly Summary</CardTitle>
        </div>
        <CardDescription>Last 7 days performance overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Avg Score</span>
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(0)}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Active Days</span>
            </div>
            <div className="text-2xl font-bold text-accent">
              {activeDays}/7
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Time</span>
            </div>
            <div className="text-2xl font-bold">
              {(totalMinutes / 60).toFixed(1)}h
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/20 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sessions</span>
            </div>
            <div className="text-2xl font-bold">
              {totalSessions}
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div>
          <h4 className="text-sm font-medium mb-4">Weekly Trend</h4>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-score)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
