import { PostureStatus } from './types';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

interface StatusPillProps {
  status: PostureStatus;
  className?: string;
}

const statusConfig = {
  Good: {
    icon: CheckCircle2,
    label: '✅ Good — keep it up!',
    color: 'status-good',
    textColor: 'status-good-foreground',
  },
  Moderate: {
    icon: AlertTriangle,
    label: '⚠️ Slight slouch — sit taller',
    color: 'status-moderate',
    textColor: 'status-moderate-foreground',
  },
  Poor: {
    icon: AlertCircle,
    label: '❗ Need a reset — stand & stretch',
    color: 'status-poor',
    textColor: 'status-poor-foreground',
  },
  Uncalibrated: {
    icon: HelpCircle,
    label: '📏 Please calibrate',
    color: 'muted',
    textColor: 'muted-foreground',
  },
};

export const StatusPill = ({ status, className = '' }: StatusPillProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-4 py-2.5 rounded-full
        bg-${config.color} text-${config.textColor}
        shadow-md status-transition
        ${status === 'Good' ? 'pulse-glow' : ''}
        ${className}
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{config.label}</span>
    </div>
  );
};
