import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User, UserX } from 'lucide-react';

interface CalibrationPanelProps {
  onCaptureNeutral: () => void;
  onCaptureSlouch: () => void;
  hasNeutral: boolean;
  hasSlouch: boolean;
  currentAngle: number;
}

export const CalibrationPanel = ({
  onCaptureNeutral,
  onCaptureSlouch,
  hasNeutral,
  hasSlouch,
  currentAngle,
}: CalibrationPanelProps) => {
  return (
    <Card className="p-6 bg-gradient-card">
      <h2 className="text-xl font-semibold mb-4 text-foreground">
        Personalized Calibration
      </h2>
      
      <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
        <p className="text-sm font-medium text-foreground mb-2">✨ Gesture Control Enabled</p>
        <p className="text-xs text-muted-foreground">
          Make a <strong>right hand fist ✊</strong> for neutral position or a <strong>left hand fist ✊</strong> for slouch position.
          You can also use the buttons below.
        </p>
      </div>

      <p className="text-muted-foreground text-sm mb-6">
        Help Spine Guard learn your unique posture. Sit comfortably in your best posture,
        then capture your neutral position. Next, slouch naturally and capture that too.
      </p>

      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-foreground mb-2">Step 1: Neutral Position</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Sit upright with shoulders back and spine aligned.
            </p>
            <Button
              onClick={onCaptureNeutral}
              variant={hasNeutral ? 'secondary' : 'default'}
              className="w-full"
            >
              <User className="w-4 h-4 mr-2" />
              {hasNeutral ? '✓ Neutral Captured' : 'Capture Neutral'}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-4 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex-1">
            <h3 className="font-medium text-foreground mb-2">Step 2: Slouch Position</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Slump naturally forward as you might when tired.
            </p>
            <Button
              onClick={onCaptureSlouch}
              variant={hasSlouch ? 'secondary' : 'outline'}
              className="w-full"
              disabled={!hasNeutral}
            >
              <UserX className="w-4 h-4 mr-2" />
              {hasSlouch ? '✓ Slouch Captured' : 'Capture Slouch'}
            </Button>
          </div>
        </div>

        {hasNeutral && hasSlouch && (
          <div className="mt-4 p-4 bg-status-good/10 rounded-lg border border-status-good/20">
            <p className="text-sm font-medium text-status-good">
              ✓ Calibration Complete! Spine Guard is now personalized for you.
            </p>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          Current angle: {currentAngle.toFixed(1)}°
        </div>
      </div>
    </Card>
  );
};
