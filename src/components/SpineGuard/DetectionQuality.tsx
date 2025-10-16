import { Card } from '@/components/ui/card';
import { Signal, SignalHigh, SignalLow, SignalMedium } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DetectionQualityProps {
  confidence: number;
  neckAngle?: number;
  mode: 'sitting' | 'standing';
}

export const DetectionQuality = ({ confidence, neckAngle, mode }: DetectionQualityProps) => {
  const getQualityIcon = () => {
    if (confidence >= 0.8) return <SignalHigh className="w-5 h-5 text-status-good" />;
    if (confidence >= 0.5) return <SignalMedium className="w-5 h-5 text-status-moderate" />;
    return <SignalLow className="w-5 h-5 text-status-poor" />;
  };

  const getQualityText = () => {
    if (confidence >= 0.8) return 'Excellent';
    if (confidence >= 0.5) return 'Good';
    return 'Low';
  };

  const getQualityColor = () => {
    if (confidence >= 0.8) return 'bg-status-good';
    if (confidence >= 0.5) return 'bg-status-moderate';
    return 'bg-status-poor';
  };

  return (
    <Card className="p-4 bg-card">
      <div className="space-y-4">
        {/* Detection Quality */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getQualityIcon()}
              <span className="text-sm font-medium">Detection Quality</span>
            </div>
            <span className="text-xs text-muted-foreground">{getQualityText()}</span>
          </div>
          <Progress value={confidence * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {(confidence * 100).toFixed(0)}% confidence
          </p>
        </div>

        {/* Mode Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Mode</span>
          <span className="text-sm font-medium capitalize">{mode}</span>
        </div>

        {/* Neck Angle */}
        {neckAngle !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Neck Angle</span>
            <span className="text-sm font-medium">{neckAngle.toFixed(1)}°</span>
          </div>
        )}

        {/* Tips */}
        {confidence < 0.5 && (
          <div className="p-2 bg-status-poor/10 rounded-md border border-status-poor/20">
            <p className="text-xs text-status-poor">
              💡 Tip: Ensure good lighting and position yourself fully in frame
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
