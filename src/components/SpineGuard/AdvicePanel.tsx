import { PostureStatus } from './types';
import { Card } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface AdvicePanelProps {
  status: PostureStatus;
}

const adviceMap: Record<PostureStatus, { title: string; tips: string[] }> = {
  Good: {
    title: 'Excellent Posture!',
    tips: [
      'Keep up the great work! Your spine will thank you.',
      'Remember to take a micro-break in 30 minutes.',
      'Stay hydrated and keep those shoulders relaxed.',
    ],
  },
  Moderate: {
    title: 'Small Adjustment Needed',
    tips: [
      'Roll your shoulders back gently.',
      'Sit up tall for 30 seconds and take a deep breath.',
      'Check that your screen is at eye level.',
      'Make sure your feet are flat on the floor.',
    ],
  },
  Poor: {
    title: 'Time for a Reset',
    tips: [
      'Stand up and stretch for 30 seconds.',
      'Pull your shoulder blades together 3 times, hold for 10s each.',
      'Walk around for a minute to reset your posture.',
      'Do neck rolls: 5 slow circles in each direction.',
      'Adjust your chair height or screen position.',
    ],
  },
  Uncalibrated: {
    title: 'Get Started',
    tips: [
      'Complete the calibration to get personalized feedback.',
      'Make sure your camera has a clear view of your upper body.',
      'Sit in your usual working position before calibrating.',
    ],
  },
};

export const AdvicePanel = ({ status }: AdvicePanelProps) => {
  const advice = adviceMap[status];

  return (
    <Card className="p-6 bg-gradient-card">
      <div className="flex items-start gap-3 mb-4">
        <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
        <h2 className="text-xl font-semibold text-foreground">{advice.title}</h2>
      </div>
      
      <ul className="space-y-3">
        {advice.tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-foreground">
            <span className="text-primary font-bold min-w-[20px]">{index + 1}.</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
