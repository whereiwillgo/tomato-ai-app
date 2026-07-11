import { Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { TimerStatus } from '../../types';
import { Button } from '../common/Button';

interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
  onReset: () => void;
}

export function TimerControls({ status, onStart, onPause, onSkip, onReset }: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 w-full">
      {status === 'idle' || status === 'completed' ? (
        <Button size="lg" onClick={onStart} className="flex-1 sm:flex-none">
          <Play size={20} className="mr-1.5 sm:mr-2" />
          开始
        </Button>
      ) : status === 'running' ? (
        <Button size="lg" onClick={onPause} className="flex-1 sm:flex-none">
          <Pause size={20} className="mr-1.5 sm:mr-2" />
          暂停
        </Button>
      ) : status === 'paused' ? (
        <Button size="lg" onClick={onStart} className="flex-1 sm:flex-none">
          <Play size={20} className="mr-1.5 sm:mr-2" />
          继续
        </Button>
      ) : status === 'break' ? (
        <Button size="lg" onClick={onStart} variant="secondary" className="flex-1 sm:flex-none">
          <Play size={20} className="mr-1.5 sm:mr-2" />
          跳过休息
        </Button>
      ) : null}
      
      <Button variant="outline" size="lg" onClick={onSkip} className="flex-1 sm:flex-none">
        <SkipForward size={20} className="mr-1.5 sm:mr-2" />
        跳过
      </Button>
      
      <Button variant="ghost" size="lg" onClick={onReset} className="flex-shrink-0">
        <RotateCcw size={20} />
      </Button>
    </div>
  );
}
