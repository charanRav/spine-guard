import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Armchair, User } from 'lucide-react';

interface PostureModeToggleProps {
  mode: 'sitting' | 'standing';
  onModeChange: (mode: 'sitting' | 'standing') => void;
}

export const PostureModeToggle = ({ mode, onModeChange }: PostureModeToggleProps) => {
  return (
    <Card className="p-4 bg-card">
      <h3 className="text-sm font-medium mb-3">Posture Mode</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={mode === 'sitting' ? 'default' : 'outline'}
          onClick={() => onModeChange('sitting')}
          className="flex flex-col h-auto py-3 gap-2"
        >
          <Armchair className="w-5 h-5" />
          <span className="text-xs">Sitting</span>
        </Button>
        <Button
          variant={mode === 'standing' ? 'default' : 'outline'}
          onClick={() => onModeChange('standing')}
          className="flex flex-col h-auto py-3 gap-2"
        >
          <User className="w-5 h-5" />
          <span className="text-xs">Standing</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        {mode === 'sitting' 
          ? 'Optimized for desk work and seated posture'
          : 'Optimized for standing desk or upright position'}
      </p>
    </Card>
  );
};
