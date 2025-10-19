import {
  HistoricalData,
  DetailedSessionData,
  DailyPostureData,
  HourlyPostureData,
  StreakData,
} from '@/types/analytics';
import { SessionData } from '@/components/SpineGuard/types';

const STORAGE_KEY = 'spineGuard_analytics';
const GOOD_DAY_THRESHOLD = 0.6; // 60% good posture = good day

export const getHistoricalData = (): HistoricalData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      detailedSessions: [],
      dailySummaries: [],
      streakData: {
        currentStreak: 0,
        longestStreak: 0,
        lastGoodDay: null,
        totalGoodDays: 0,
      },
    };
  }
  return JSON.parse(stored);
};

export const saveSessionToHistory = (sessionData: SessionData): void => {
  if (sessionData.readings.length === 0) return;

  const history = getHistoricalData();
  const today = new Date().toISOString().split('T')[0];
  
  const sessionScore = calculateScore(
    sessionData.goodCount,
    sessionData.moderateCount,
    sessionData.poorCount
  );

  const newSession: DetailedSessionData = {
    date: today,
    timestamp: Date.now(),
    startTime: sessionData.startTime,
    endTime: Date.now(),
    readings: sessionData.readings,
    goodCount: sessionData.goodCount,
    moderateCount: sessionData.moderateCount,
    poorCount: sessionData.poorCount,
    score: sessionScore,
  };

  // Add to detailed sessions
  history.detailedSessions.push(newSession);

  // Clean up old detailed data (keep only last 15 days)
  const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
  const oldSessions = history.detailedSessions.filter(
    (s) => s.timestamp < fifteenDaysAgo
  );
  
  // Aggregate old sessions into daily summaries
  oldSessions.forEach((session) => {
    aggregateSessionToDaily(history, session);
  });

  // Keep only recent detailed sessions
  history.detailedSessions = history.detailedSessions.filter(
    (s) => s.timestamp >= fifteenDaysAgo
  );

  // Update streak data
  history.streakData = calculateStreaks(history);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

const aggregateSessionToDaily = (
  history: HistoricalData,
  session: DetailedSessionData
): void => {
  const existingSummary = history.dailySummaries.find(
    (s) => s.date === session.date
  );

  if (existingSummary) {
    // Update existing summary
    existingSummary.totalSessions++;
    existingSummary.totalMinutes += (session.endTime - session.startTime) / 60000;
    existingSummary.goodCount += session.goodCount;
    existingSummary.moderateCount += session.moderateCount;
    existingSummary.poorCount += session.poorCount;
    existingSummary.averageScore = calculateScore(
      existingSummary.goodCount,
      existingSummary.moderateCount,
      existingSummary.poorCount
    );

    // Update hourly breakdown
    session.readings.forEach((reading) => {
      const hour = new Date(reading.timestamp).getHours();
      let hourData = existingSummary.hourlyBreakdown.find((h) => h.hour === hour);
      
      if (!hourData) {
        hourData = { hour, goodCount: 0, moderateCount: 0, poorCount: 0, totalReadings: 0 };
        existingSummary.hourlyBreakdown.push(hourData);
      }

      hourData.totalReadings++;
      if (reading.status === 'Good') hourData.goodCount++;
      else if (reading.status === 'Moderate') hourData.moderateCount++;
      else if (reading.status === 'Poor') hourData.poorCount++;
    });
  } else {
    // Create new daily summary
    const hourlyBreakdown = createHourlyBreakdown(session.readings);
    
    history.dailySummaries.push({
      date: session.date,
      totalSessions: 1,
      totalMinutes: (session.endTime - session.startTime) / 60000,
      goodCount: session.goodCount,
      moderateCount: session.moderateCount,
      poorCount: session.poorCount,
      hourlyBreakdown,
      averageScore: session.score,
    });
  }

  // Sort summaries by date
  history.dailySummaries.sort((a, b) => b.date.localeCompare(a.date));
};

const createHourlyBreakdown = (readings: any[]): HourlyPostureData[] => {
  const breakdown: { [hour: number]: HourlyPostureData } = {};

  readings.forEach((reading) => {
    const hour = new Date(reading.timestamp).getHours();
    
    if (!breakdown[hour]) {
      breakdown[hour] = { hour, goodCount: 0, moderateCount: 0, poorCount: 0, totalReadings: 0 };
    }

    breakdown[hour].totalReadings++;
    if (reading.status === 'Good') breakdown[hour].goodCount++;
    else if (reading.status === 'Moderate') breakdown[hour].moderateCount++;
    else if (reading.status === 'Poor') breakdown[hour].poorCount++;
  });

  return Object.values(breakdown).sort((a, b) => a.hour - b.hour);
};

export const getDailyData = (date: string): DailyPostureData | null => {
  const history = getHistoricalData();
  const today = new Date().toISOString().split('T')[0];

  // Check if it's today or within last 15 days (detailed data)
  const sessionsForDate = history.detailedSessions.filter((s) => s.date === date);
  
  if (sessionsForDate.length > 0) {
    return aggregateSessionsToDaily(sessionsForDate, date);
  }

  // Check daily summaries
  return history.dailySummaries.find((s) => s.date === date) || null;
};

const aggregateSessionsToDaily = (
  sessions: DetailedSessionData[],
  date: string
): DailyPostureData => {
  let goodCount = 0;
  let moderateCount = 0;
  let poorCount = 0;
  let totalMinutes = 0;
  const allReadings: any[] = [];

  sessions.forEach((session) => {
    goodCount += session.goodCount;
    moderateCount += session.moderateCount;
    poorCount += session.poorCount;
    totalMinutes += (session.endTime - session.startTime) / 60000;
    allReadings.push(...session.readings);
  });

  const hourlyBreakdown = createHourlyBreakdown(allReadings);

  return {
    date,
    totalSessions: sessions.length,
    totalMinutes,
    goodCount,
    moderateCount,
    poorCount,
    hourlyBreakdown,
    averageScore: calculateScore(goodCount, moderateCount, poorCount),
  };
};

const calculateScore = (good: number, moderate: number, poor: number): number => {
  const total = good + moderate + poor;
  if (total === 0) return 0;
  return Math.round((good * 100 + moderate * 50) / total);
};

const calculateStreaks = (history: HistoricalData): StreakData => {
  const allDates = new Set<string>();
  
  // Collect all dates from detailed sessions and summaries
  history.detailedSessions.forEach((s) => allDates.add(s.date));
  history.dailySummaries.forEach((s) => allDates.add(s.date));

  const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastGoodDay: string | null = null;
  let totalGoodDays = 0;

  const today = new Date().toISOString().split('T')[0];
  let checkingCurrent = true;

  sortedDates.forEach((date, index) => {
    const dailyData = getDailyData(date);
    if (!dailyData) return;

    const isGoodDay = dailyData.averageScore >= GOOD_DAY_THRESHOLD * 100;

    if (isGoodDay) {
      totalGoodDays++;
      tempStreak++;
      
      if (!lastGoodDay) lastGoodDay = date;

      if (checkingCurrent && (date === today || index === 0)) {
        currentStreak = tempStreak;
      }
    } else {
      checkingCurrent = false;
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
    }
  });

  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    lastGoodDay,
    totalGoodDays,
  };
};

export const getDateRange = (days: number): DailyPostureData[] => {
  const history = getHistoricalData();
  const result: DailyPostureData[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dailyData = getDailyData(dateStr);
    if (dailyData) {
      result.push(dailyData);
    } else {
      // Add empty data for days without sessions
      result.push({
        date: dateStr,
        totalSessions: 0,
        totalMinutes: 0,
        goodCount: 0,
        moderateCount: 0,
        poorCount: 0,
        hourlyBreakdown: [],
        averageScore: 0,
      });
    }
  }

  return result.reverse();
};
