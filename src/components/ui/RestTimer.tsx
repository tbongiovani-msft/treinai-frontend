import { type FC } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useCountdown } from '@/hooks/useCountdown';

interface RestTimerProps {
  /** Rest duration in seconds */
  durationSeconds: number;
  /** Callback when rest period finishes */
  onFinish?: () => void;
  /** Optional label */
  label?: string;
  /** Additional classes */
  className?: string;
}

/**
 * RestTimer — countdown timer for rest periods between sets.
 * Shows a circular progress indicator and plays visual cue when done.
 */
export const RestTimer: FC<RestTimerProps> = ({
  durationSeconds,
  onFinish,
  label = 'Descanso',
  className,
}) => {
  const countdown = useCountdown({ durationSeconds, onFinish });

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>

      {/* Countdown display */}
      <div
        className={cn(
          'text-xl font-mono tabular-nums',
          countdown.isRunning && 'text-blue-600',
          countdown.isPaused && 'text-yellow-500 animate-pulse',
          countdown.isFinished && 'text-green-600 font-bold',
          countdown.isIdle && 'text-gray-400'
        )}
      >
        {countdown.isFinished ? '✓ Pronto!' : countdown.formatted}
      </div>

      {/* Progress bar */}
      {(countdown.isRunning || countdown.isPaused) && (
        <div className="w-full max-w-[160px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-200 rounded-full"
            style={{ width: `${countdown.progress * 100}%` }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        {countdown.isIdle && (
          <Button variant="outline" size="sm" onClick={countdown.start}>
            <Play className="h-3 w-3" />
            Iniciar descanso
          </Button>
        )}

        {countdown.isRunning && (
          <Button variant="ghost" size="sm" onClick={countdown.pause}>
            <Pause className="h-3 w-3" />
          </Button>
        )}

        {countdown.isPaused && (
          <Button variant="outline" size="sm" onClick={countdown.resume}>
            <Play className="h-3 w-3" />
          </Button>
        )}

        {countdown.isFinished && (
          <Button variant="ghost" size="sm" onClick={countdown.reset}>
            <RotateCcw className="h-3 w-3" />
            Repetir
          </Button>
        )}
      </div>
    </div>
  );
};

export default RestTimer;
