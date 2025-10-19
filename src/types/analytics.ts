import { PostureReading, PostureStatus } from '@/components/SpineGuard/types';

export interface DailyPostureData {
  date: string; // YYYY-MM-DD format
  totalSessions: number;
  totalMinutes: number;
  goodCount: number;
  moderateCount: number;
  poorCount: number;
  hourlyBreakdown: HourlyPostureData[];
  averageScore: number;
}

export interface HourlyPostureData {
  hour: number; // 0-23
  goodCount: number;
  moderateCount: number;
  poorCount: number;
  totalReadings: number;
}

export interface DetailedSessionData {
  date: string; // YYYY-MM-DD format
  timestamp: number;
  startTime: number;
  endTime: number;
  readings: PostureReading[];
  goodCount: number;
  moderateCount: number;
  poorCount: number;
  score: number;
}

export interface HistoricalData {
  detailedSessions: DetailedSessionData[]; // Last 15 days of detailed data
  dailySummaries: DailyPostureData[]; // Aggregated data older than 15 days
  streakData: StreakData;
}

export interface StreakData {
  currentStreak: number; // Consecutive good days
  longestStreak: number;
  lastGoodDay: string | null; // YYYY-MM-DD
  totalGoodDays: number;
}

export interface ComparisonData {
  current: DailyPostureData;
  previous: DailyPostureData;
  percentageChange: {
    goodPosture: number;
    score: number;
    totalMinutes: number;
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}
