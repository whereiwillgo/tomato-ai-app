import { TimerStatus } from '../../types';

interface TimerDisplayProps {
  seconds: number;
  status: TimerStatus;
  currentPomodoro: number;
}

export function TimerDisplay({ seconds, status, currentPomodoro }: TimerDisplayProps) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  const totalSeconds = status === 'break' ? (currentPomodoro % 4 === 0 ? 15 * 60 : 5 * 60) : 25 * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - seconds) / totalSeconds) * 100 : 0;
  
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 320 320">
          <circle
            cx="160"
            cy="160"
            r="120"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="12"
          />
          <circle
            cx="160"
            cy="160"
            r="120"
            fill="none"
            stroke={status === 'break' ? '#3b82f6' : 'url(#timerGradient)'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-4xl sm:text-5xl md:text-6xl font-bold ${
            status === 'break' ? 'text-blue-600' : 'text-gray-800'
          }`}>
            {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
          </div>
          <div className={`text-sm sm:text-base md:text-lg font-medium mt-2 ${
            status === 'break' ? 'text-blue-500' : 'text-gray-500'
          }`}>
            {status === 'break' ? '休息时间' : '专注时间'}
          </div>
          <div className="text-xs sm:text-sm text-gray-400 mt-1">
            第 {currentPomodoro} 个番茄
          </div>
        </div>
      </div>
    </div>
  );
}
