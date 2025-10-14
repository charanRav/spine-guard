import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Settings as SettingsType } from './types';
import { Download, Moon, Sun, Bell, Volume2, Eye, Coffee, Mic } from 'lucide-react';

interface SettingsPanelProps {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
  onExportSession: () => void;
}

export const SettingsPanel = ({
  settings,
  onSettingsChange,
  onExportSession,
}: SettingsPanelProps) => {
  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    onSettingsChange({ ...settings, theme: newTheme });
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <Card className="p-6 bg-gradient-card">
      <h2 className="text-xl font-semibold mb-6 text-foreground">Settings</h2>
      
      <div className="space-y-6">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.theme === 'light' ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
            <Label htmlFor="theme-toggle" className="cursor-pointer">
              Dark Mode
            </Label>
          </div>
          <Switch
            id="theme-toggle"
            checked={settings.theme === 'dark'}
            onCheckedChange={toggleTheme}
          />
        </div>

        {/* Sensitivity Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sensitivity</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(settings.sensitivity * 100)}%
            </span>
          </div>
          <Slider
            value={[settings.sensitivity * 100]}
            onValueChange={([value]) =>
              onSettingsChange({ ...settings, sensitivity: value / 100 })
            }
            min={10}
            max={100}
            step={10}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Higher sensitivity = more strict posture detection
          </p>
        </div>

        {/* Nudges Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="nudges-toggle" className="cursor-pointer">
            Enable Nudges
          </Label>
          <Switch
            id="nudges-toggle"
            checked={settings.nudgesEnabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, nudgesEnabled: checked })
            }
          />
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-toggle" className="cursor-pointer">
            Sound Alerts
          </Label>
          <Switch
            id="sound-toggle"
            checked={settings.soundEnabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, soundEnabled: checked })
            }
          />
        </div>

        {/* Overlay Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="overlay-toggle" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Skeleton Overlay
          </Label>
          <Switch
            id="overlay-toggle"
            checked={settings.showOverlay}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, showOverlay: checked })
            }
          />
        </div>

        {/* Break Reminders Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="break-reminders" className="flex items-center gap-2">
            <Coffee className="w-4 h-4" />
            Break Reminders
          </Label>
          <Switch
            id="break-reminders"
            checked={settings.breakReminders}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, breakReminders: checked })
            }
          />
        </div>

        {/* Break Interval Slider (show only if break reminders enabled) */}
        {settings.breakReminders && (
          <div className="space-y-2 pl-6 border-l-2 border-primary/20">
            <Label>Break Interval: {settings.breakInterval} minutes</Label>
            <Slider
              value={[settings.breakInterval]}
              onValueChange={([value]) =>
                onSettingsChange({ ...settings, breakInterval: value })
              }
              min={15}
              max={90}
              step={15}
            />
            <p className="text-xs text-muted-foreground">
              Get reminded to take breaks
            </p>
          </div>
        )}

        {/* Voice Alerts Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="voice-enabled" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice Alerts
          </Label>
          <Switch
            id="voice-enabled"
            checked={settings.voiceEnabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, voiceEnabled: checked })
            }
          />
        </div>

        {/* Export Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={onExportSession}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Session Data (CSV)
          </Button>
        </div>
      </div>
    </Card>
  );
};
