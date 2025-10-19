import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyPostureData, HourlyPostureData } from '@/types/analytics';
import { Clock } from 'lucide-react';

interface PostureHeatmapProps {
  dailyData: DailyPostureData[];
}

export const PostureHeatmap = ({ dailyData }: PostureHeatmapProps) => {
  // Aggregate hourly data across all days
  const hourlyAggregated: { [hour: number]: HourlyPostureData } = {};

  dailyData.forEach((day) => {
    day.hourlyBreakdown.forEach((hourData) => {
      if (!hourlyAggregated[hourData.hour]) {
        hourlyAggregated[hourData.hour] = {
          hour: hourData.hour,
          goodCount: 0,
          moderateCount: 0,
          poorCount: 0,
          totalReadings: 0,
        };
      }
      hourlyAggregated[hourData.hour].goodCount += hourData.goodCount;
      hourlyAggregated[hourData.hour].moderateCount += hourData.moderateCount;
      hourlyAggregated[hourData.hour].poorCount += hourData.poorCount;
      hourlyAggregated[hourData.hour].totalReadings += hourData.totalReadings;
    });
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getIntensityColor = (hour: number): string => {
    const data = hourlyAggregated[hour];
    if (!data || data.totalReadings === 0) return 'bg-muted/20';

    const poorPercentage = (data.poorCount / data.totalReadings) * 100;
    
    if (poorPercentage >= 60) return 'bg-status-poor';
    if (poorPercentage >= 40) return 'bg-status-poor/70';
    if (poorPercentage >= 20) return 'bg-status-moderate';
    if (poorPercentage >= 10) return 'bg-status-moderate/70';
    return 'bg-status-good';
  };

  const getHourStats = (hour: number): string => {
    const data = hourlyAggregated[hour];
    if (!data || data.totalReadings === 0) return 'No data';
    
    const poorPercentage = ((data.poorCount / data.totalReadings) * 100).toFixed(0);
    const goodPercentage = ((data.goodCount / data.totalReadings) * 100).toFixed(0);
    
    return `${hour}:00 - Good: ${goodPercentage}%, Poor: ${poorPercentage}%`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Posture Heatmap</CardTitle>
        </div>
        <CardDescription>
          Which hours you slouch most (darker red = more slouching)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-good" />
              <span>Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-moderate" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-status-poor" />
              <span>Poor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted/20 border" />
              <span>No data</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="grid grid-cols-12 gap-2">
            {hours.map((hour) => (
              <div
                key={hour}
                className="group relative"
                title={getHourStats(hour)}
              >
                <div
                  className={`aspect-square rounded-md ${getIntensityColor(
                    hour
                  )} transition-transform hover:scale-110 cursor-pointer`}
                />
                <div className="text-center mt-1 text-xs text-muted-foreground">
                  {hour}
                </div>
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-popover text-popover-foreground text-xs rounded-lg p-2 shadow-lg border whitespace-nowrap">
                    {getHourStats(hour)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time labels */}
          <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground text-center pt-2 border-t">
            <div>Morning (6-12)</div>
            <div>Afternoon (12-18)</div>
            <div>Evening (18-24)</div>
            <div>Night (0-6)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
