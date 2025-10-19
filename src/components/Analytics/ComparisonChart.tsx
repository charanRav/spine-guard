import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DailyPostureData } from '@/types/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonChartProps {
  data: DailyPostureData[];
  title: string;
  description: string;
}

export const ComparisonChart = ({ data, title, description }: ComparisonChartProps) => {
  const chartData = data.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    good: day.goodCount,
    moderate: day.moderateCount,
    poor: day.poorCount,
    score: day.averageScore,
  }));

  const chartConfig = {
    good: {
      label: 'Good',
      color: 'hsl(var(--status-good))',
    },
    moderate: {
      label: 'Moderate',
      color: 'hsl(var(--status-moderate))',
    },
    poor: {
      label: 'Poor',
      color: 'hsl(var(--status-poor))',
    },
  };

  // Calculate comparison metrics
  const getTrend = () => {
    if (data.length < 2) return { direction: 'neutral', change: 0 };
    
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const change = latest.averageScore - previous.averageScore;
    
    if (change > 5) return { direction: 'up', change };
    if (change < -5) return { direction: 'down', change };
    return { direction: 'neutral', change };
  };

  const trend = getTrend();

  const TrendIcon = 
    trend.direction === 'up' ? TrendingUp :
    trend.direction === 'down' ? TrendingDown : Minus;

  const trendColor = 
    trend.direction === 'up' ? 'text-status-good' :
    trend.direction === 'down' ? 'text-status-poor' : 
    'text-muted-foreground';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              {trend.change > 0 ? '+' : ''}{trend.change.toFixed(0)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
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
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar dataKey="good" fill="var(--color-good)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="moderate" fill="var(--color-moderate)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="poor" fill="var(--color-poor)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
