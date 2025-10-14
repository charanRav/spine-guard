import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { SessionData } from './types';

interface SessionChartProps {
  sessionData: SessionData;
}

declare global {
  interface Window {
    Chart: any;
  }
}

export const SessionChart = ({ sessionData }: SessionChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;

    // Destroy previous chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const labels = sessionData.readings.map((r) => {
      const date = new Date(r.timestamp);
      return date.toLocaleTimeString();
    });

    const data = sessionData.readings.map((r) => r.angle);

    chartInstanceRef.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Torso Angle (degrees)',
            data,
            borderColor: 'rgb(14, 165, 233)',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `${context.parsed.y.toFixed(1)}°`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Angle from Vertical',
            },
          },
          x: {
            display: false,
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [sessionData]);

  const total = sessionData.goodCount + sessionData.moderateCount + sessionData.poorCount;
  const goodPercent = total > 0 ? (sessionData.goodCount / total) * 100 : 0;
  const moderatePercent = total > 0 ? (sessionData.moderateCount / total) * 100 : 0;
  const poorPercent = total > 0 ? (sessionData.poorCount / total) * 100 : 0;

  return (
    <Card className="p-6 bg-gradient-card">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Session Summary</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-status-good/10 rounded-lg">
          <div className="text-2xl font-bold text-status-good">{goodPercent.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground mt-1">Good Posture</div>
        </div>
        <div className="text-center p-3 bg-status-moderate/10 rounded-lg">
          <div className="text-2xl font-bold text-status-moderate">{moderatePercent.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground mt-1">Moderate</div>
        </div>
        <div className="text-center p-3 bg-status-poor/10 rounded-lg">
          <div className="text-2xl font-bold text-status-poor">{poorPercent.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground mt-1">Poor</div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 relative">
        <canvas ref={chartRef} />
      </div>

      {/* Session Info */}
      <div className="mt-4 text-sm text-muted-foreground">
        Session started: {new Date(sessionData.startTime).toLocaleString()}
      </div>
    </Card>
  );
};
