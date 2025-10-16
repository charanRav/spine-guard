import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Settings as SettingsIcon } from 'lucide-react';
import { CameraFeed } from '@/components/SpineGuard/CameraFeed';
import { StatusPill } from '@/components/SpineGuard/StatusPill';
import { CalibrationPanel } from '@/components/SpineGuard/CalibrationPanel';
import { AdvicePanel } from '@/components/SpineGuard/AdvicePanel';
import { SessionChart } from '@/components/SpineGuard/SessionChart';
import { SettingsPanel } from '@/components/SpineGuard/SettingsPanel';
import { AchievementsPanel } from '@/components/SpineGuard/AchievementsPanel';
import { BreakReminderPanel } from '@/components/SpineGuard/BreakReminderPanel';
import { PostureScoreCard } from '@/components/SpineGuard/PostureScoreCard';
import { DetectionQuality } from '@/components/SpineGuard/DetectionQuality';
import { PostureModeToggle } from '@/components/SpineGuard/PostureModeToggle';
import { useToast } from '@/hooks/use-toast';
import {
  PostureStatus,
  CalibrationData,
  SessionData,
  Settings,
  PoseLandmarks,
  PostureReading,
} from '@/components/SpineGuard/types';

const STORAGE_KEYS = {
  CALIBRATION: 'spineGuard_calibration',
  SETTINGS: 'spineGuard_settings',
  SESSION: 'spineGuard_session',
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  sensitivity: 0.5,
  nudgesEnabled: true,
  soundEnabled: false,
  showOverlay: true,
  breakReminders: true,
  breakInterval: 45,
  voiceEnabled: false,
  postureMode: 'sitting',
};

const DEFAULT_ACHIEVEMENTS = [
  { id: 'first-session', title: 'First Steps', description: 'Complete your first monitoring session', icon: 'star', unlocked: false },
  { id: 'good-streak-5', title: 'Steady Start', description: 'Maintain good posture for 5 minutes', icon: 'target', unlocked: false },
  { id: 'good-streak-15', title: 'Getting Strong', description: 'Maintain good posture for 15 minutes', icon: 'zap', unlocked: false },
  { id: 'good-streak-30', title: 'Posture Master', description: 'Maintain good posture for 30 minutes', icon: 'trophy', unlocked: false },
  { id: 'calibrated', title: 'Personalized', description: 'Complete your calibration', icon: 'award', unlocked: false },
  { id: 'week-warrior', title: 'Consistency King', description: 'Use Spine Guard for 7 days', icon: 'crown', unlocked: false },
];

const Index = () => {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<PostureStatus>('Uncalibrated');
  const [currentAngle, setCurrentAngle] = useState(0);
  const [smoothedAngle, setSmoothedAngle] = useState(0);
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sessionData, setSessionData] = useState<SessionData>({
    startTime: Date.now(),
    readings: [],
    goodCount: 0,
    moderateCount: 0,
    poorCount: 0,
  });
  const [achievements, setAchievements] = useState(DEFAULT_ACHIEVEMENTS);
  const [breakData, setBreakData] = useState({
    lastBreak: Date.now(),
    nextBreak: Date.now() + DEFAULT_SETTINGS.breakInterval * 60000,
    sittingTime: 0,
  });
  const [goodStreakStart, setGoodStreakStart] = useState<number | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [neckAngle, setNeckAngle] = useState<number | undefined>(undefined);

  // Load saved data on mount
  useEffect(() => {
    const savedCalibration = localStorage.getItem(STORAGE_KEYS.CALIBRATION);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const savedAchievements = localStorage.getItem('spineGuard_achievements');
    
    if (savedCalibration) {
      setCalibration(JSON.parse(savedCalibration));
    }
    
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      document.documentElement.classList.toggle('dark', parsed.theme === 'dark');
      setBreakData(prev => ({
        ...prev,
        nextBreak: Date.now() + parsed.breakInterval * 60000,
      }));
    }
    
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }
  }, []);

  // Break reminder check
  useEffect(() => {
    if (!isActive || !settings.breakReminders) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= breakData.nextBreak) {
        toast({
          title: '☕ Break Time!',
          description: 'You\'ve been sitting for a while. Take a 2-minute break!',
          variant: 'default',
        });
        
        if (settings.voiceEnabled) {
          const utterance = new SpeechSynthesisUtterance('Time for a break! Stand up and stretch.');
          speechSynthesis.speak(utterance);
        }
        
        setBreakData({
          lastBreak: now,
          nextBreak: now + settings.breakInterval * 60000,
          sittingTime: 0,
        });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isActive, settings.breakReminders, settings.breakInterval, settings.voiceEnabled, breakData.nextBreak, toast]);

  // Achievement unlocking
  const unlockAchievement = useCallback((achievementId: string) => {
    setAchievements(prev => {
      const updated = prev.map(a => 
        a.id === achievementId && !a.unlocked
          ? { ...a, unlocked: true, unlockedAt: Date.now() }
          : a
      );
      localStorage.setItem('spineGuard_achievements', JSON.stringify(updated));
      
      const achievement = updated.find(a => a.id === achievementId);
      if (achievement && !prev.find(a => a.id === achievementId)?.unlocked) {
        toast({
          title: '🏆 Achievement Unlocked!',
          description: achievement.title,
        });
      }
      
      return updated;
    });
  }, [toast]);

  // Calculate posture from landmarks
  const calculatePosture = useCallback(
    (landmarks: PoseLandmarks, confidence: number, neckAngleValue?: number) => {
      setDetectionConfidence(confidence);
      setNeckAngle(neckAngleValue);
      // Calculate midpoints
      const shoulderMid = {
        x: (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2,
        y: (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2,
      };
      const hipMid = {
        x: (landmarks.leftHip.x + landmarks.rightHip.x) / 2,
        y: (landmarks.leftHip.y + landmarks.rightHip.y) / 2,
      };

      // Calculate vector and angle from vertical
      const dx = Math.abs(shoulderMid.x - hipMid.x);
      const dy = Math.abs(shoulderMid.y - hipMid.y);
      const angle = (Math.atan2(dx, dy) * 180) / Math.PI;

      setCurrentAngle(angle);

      // EWMA smoothing (alpha based on sensitivity)
      const alpha = 0.1 + settings.sensitivity * 0.1;
      const newSmoothed = alpha * angle + (1 - alpha) * smoothedAngle;
      setSmoothedAngle(newSmoothed);

      // Determine status
      let status: PostureStatus = 'Uncalibrated';
      
      if (calibration) {
        if (newSmoothed <= calibration.goodThreshold) {
          status = 'Good';
        } else if (newSmoothed <= calibration.moderateThreshold) {
          status = 'Moderate';
        } else {
          status = 'Poor';
        }
      } else {
        // Fallback heuristics if not calibrated (adjusted for mode)
        const baseGood = settings.postureMode === 'sitting' ? 6 : 8;
        const baseModerate = settings.postureMode === 'sitting' ? 12 : 15;
        
        if (newSmoothed <= baseGood) {
          status = 'Good';
        } else if (newSmoothed <= baseModerate) {
          status = 'Moderate';
        } else {
          status = 'Poor';
        }
      }

      // Update status and track
      if (status !== currentStatus) {
        setCurrentStatus(status);
        
        // Show nudge if enabled and status worsens
        if (settings.nudgesEnabled && status === 'Poor') {
          toast({
            title: '❗ Posture Alert',
            description: 'Time for a stretch break!',
            variant: 'destructive',
          });
          
          if (settings.voiceEnabled) {
            const utterance = new SpeechSynthesisUtterance('Posture alert. Please sit up straight.');
            speechSynthesis.speak(utterance);
          }
        }
      }

      // Track good posture streak
      if (status === 'Good') {
        if (!goodStreakStart) {
          setGoodStreakStart(Date.now());
        } else {
          const streakMinutes = (Date.now() - goodStreakStart) / 60000;
          if (streakMinutes >= 5 && !achievements.find(a => a.id === 'good-streak-5')?.unlocked) {
            unlockAchievement('good-streak-5');
          }
          if (streakMinutes >= 15 && !achievements.find(a => a.id === 'good-streak-15')?.unlocked) {
            unlockAchievement('good-streak-15');
          }
          if (streakMinutes >= 30 && !achievements.find(a => a.id === 'good-streak-30')?.unlocked) {
            unlockAchievement('good-streak-30');
          }
        }
      } else {
        setGoodStreakStart(null);
      }

      // Record reading
      const reading: PostureReading = {
        timestamp: Date.now(),
        angle: newSmoothed,
        status,
      };

      setSessionData((prev) => {
        const newCounts = {
          goodCount: prev.goodCount + (status === 'Good' ? 1 : 0),
          moderateCount: prev.moderateCount + (status === 'Moderate' ? 1 : 0),
          poorCount: prev.poorCount + (status === 'Poor' ? 1 : 0),
        };

        return {
          ...prev,
          ...newCounts,
          readings: [...prev.readings.slice(-100), reading], // Keep last 100
        };
      });
      
      // Unlock first session achievement
      if (!achievements.find(a => a.id === 'first-session')?.unlocked) {
        unlockAchievement('first-session');
      }
    },
    [smoothedAngle, calibration, settings, currentStatus, toast, goodStreakStart, achievements, unlockAchievement]
  );

  const handleCaptureNeutral = useCallback(() => {
    const neutral = currentAngle;
    const newCalibration: CalibrationData = {
      neutral,
      slouch: calibration?.slouch || neutral + 10,
      goodThreshold: 0,
      moderateThreshold: 0,
    };

    if (calibration?.slouch) {
      const diff = Math.max(0.1, calibration.slouch - neutral);
      newCalibration.goodThreshold = neutral + diff * 0.4;
      newCalibration.moderateThreshold = neutral + diff * 0.75;
    }

    setCalibration(newCalibration);
    localStorage.setItem(STORAGE_KEYS.CALIBRATION, JSON.stringify(newCalibration));
    
    toast({
      title: '✓ Neutral Position Captured',
      description: `Angle: ${neutral.toFixed(1)}°`,
    });
  }, [currentAngle, calibration, toast]);

  const handleCaptureSlouch = useCallback(() => {
    if (!calibration) return;

    const slouch = currentAngle;
    const diff = Math.max(0.1, slouch - calibration.neutral);
    
    const newCalibration: CalibrationData = {
      ...calibration,
      slouch,
      goodThreshold: calibration.neutral + diff * 0.4,
      moderateThreshold: calibration.neutral + diff * 0.75,
    };

    setCalibration(newCalibration);
    localStorage.setItem(STORAGE_KEYS.CALIBRATION, JSON.stringify(newCalibration));
    
    toast({
      title: '✓ Calibration Complete',
      description: 'Spine Guard is now personalized for you!',
    });
    
    unlockAchievement('calibrated');
  }, [currentAngle, calibration, toast, unlockAchievement]);

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  };

  const handleExportSession = () => {
    const csv = [
      'Timestamp,Angle,Status',
      ...sessionData.readings.map(
        (r) => `${new Date(r.timestamp).toISOString()},${r.angle.toFixed(2)},${r.status}`
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spine-guard-session-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: '✓ Session Exported',
      description: 'Your session data has been downloaded.',
    });
  };

  const toggleActive = () => {
    if (!isActive) {
      // Reset session on start
      setSessionData({
        startTime: Date.now(),
        readings: [],
        goodCount: 0,
        moderateCount: 0,
        poorCount: 0,
      });
    }
    setIsActive(!isActive);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-hero">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground">
                Spine Guard
              </h1>
              <p className="text-sm text-primary-foreground/80 mt-1">
                Your friendly posture coach · Local & Private
              </p>
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-full"
            >
              <SettingsIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Camera & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Pill */}
            <div className="flex justify-center">
              <StatusPill status={currentStatus} />
            </div>

            {/* Camera Feed */}
            <CameraFeed
              isActive={isActive}
              showOverlay={settings.showOverlay}
              onPoseDetected={calculatePosture}
            />

            {/* Controls */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={toggleActive}
                size="lg"
                variant={isActive ? 'destructive' : 'default'}
                className="px-8"
              >
                {isActive ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Monitoring
                  </>
                )}
              </Button>
            </div>

            {/* Session Chart */}
            {sessionData.readings.length > 0 && (
              <SessionChart sessionData={sessionData} />
            )}
          </div>

          {/* Right Column - Panels */}
          <div className="space-y-6">
            {showSettings ? (
              <SettingsPanel
                settings={settings}
                onSettingsChange={handleSettingsChange}
                onExportSession={handleExportSession}
              />
            ) : (
              <>
                <PostureModeToggle 
                  mode={settings.postureMode}
                  onModeChange={(mode) => handleSettingsChange({ ...settings, postureMode: mode })}
                />
                <DetectionQuality 
                  confidence={detectionConfidence}
                  neckAngle={neckAngle}
                  mode={settings.postureMode}
                />
                <CalibrationPanel
                  onCaptureNeutral={handleCaptureNeutral}
                  onCaptureSlouch={handleCaptureSlouch}
                  hasNeutral={!!calibration?.neutral}
                  hasSlouch={!!calibration?.slouch}
                  currentAngle={currentAngle}
                />
                <AdvicePanel status={currentStatus} />
              </>
            )}
          </div>
        </div>

        {/* Additional Stats Section */}
        {isActive && (
          <div className="grid lg:grid-cols-3 gap-6 mt-8">
            <PostureScoreCard sessionData={sessionData} />
            {settings.breakReminders && (
              <BreakReminderPanel 
                breakData={breakData}
                breakInterval={settings.breakInterval}
              />
            )}
            <AchievementsPanel achievements={achievements} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            🔒 Privacy-first · All processing happens locally in your browser
          </p>
          <p className="mt-2">
            No data is uploaded or stored on any server
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
