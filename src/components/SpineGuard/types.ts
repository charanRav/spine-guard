export type PostureStatus = 'Good' | 'Moderate' | 'Poor' | 'Uncalibrated';

export interface CalibrationData {
  neutral: number;
  slouch: number;
  goodThreshold: number;
  moderateThreshold: number;
}

export interface PostureReading {
  timestamp: number;
  angle: number;
  status: PostureStatus;
}

export interface SessionData {
  startTime: number;
  readings: PostureReading[];
  goodCount: number;
  moderateCount: number;
  poorCount: number;
}

export interface Settings {
  theme: 'light' | 'dark';
  sensitivity: number;
  nudgesEnabled: boolean;
  soundEnabled: boolean;
  showOverlay: boolean;
  breakReminders: boolean;
  breakInterval: number;
  voiceEnabled: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface BreakReminder {
  lastBreak: number;
  nextBreak: number;
  sittingTime: number;
}

export interface PoseLandmarks {
  leftShoulder: { x: number; y: number; z: number };
  rightShoulder: { x: number; y: number; z: number };
  leftHip: { x: number; y: number; z: number };
  rightHip: { x: number; y: number; z: number };
}
