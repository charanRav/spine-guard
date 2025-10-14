import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Coffee, Clock } from 'lucide-react';
import { BreakReminder } from './types';

interface BreakReminderPanelProps {
  breakData: BreakReminder;
  breakInterval: number;
}

export const BreakReminderPanel = ({ breakData, breakInterval }: BreakReminderPanelProps) => {
  const timeUntilBreak = Math.max(0, breakData.nextBreak - Date.now());
  const minutesUntilBreak = Math.floor(timeUntilBreak / 60000);
  const sittingMinutes = Math.floor((Date.now() - breakData.lastBreak) / 60000);
  const progress = Math.min(100, (sittingMinutes / breakInterval) * 100);

  return (
    <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-amber-500/20 rounded-full">
          <Coffee className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Break Time</h3>
          <p className="text-sm text-muted-foreground">
            {minutesUntilBreak > 0
              ? `Next break in ${minutesUntilBreak} min`
              : 'Time for a break!'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Progress value={progress} className="h-2" />
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{sittingMinutes} min sitting</span>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {Math.floor(progress)}%
          </span>
        </div>
      </div>
    </Card>
  );
};
