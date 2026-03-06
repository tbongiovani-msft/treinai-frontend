import { type FC } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useTimer, formatTimeLong, type TimerStatus } from '@/hooks/useTimer';

interface TimerProps {
  /** Unique key for localStorage persistence (required for page-refresh survival). */
  storageKey?: string;
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional label displayed above the timer */
  label?: string;
  /** Callback when timer stops */
  onStop?: (totalSeconds: number) => void;
  /** Callback every second */
  onTick?: (elapsedSeconds: number) => void;
  /** If true, shows only the display (no buttons) — useful for a global workout timer */
  displayOnly?: boolean;
  /** Additional classes */
  className?: string;
}

const sizeStyles: Record<string, { time: string; button: 'sm' | 'md' | 'lg' }> = {
  sm: { time: 'text-lg font-mono', button: 'sm' },
  md: { time: 'text-2xl font-mono', button: 'md' },
  lg: { time: 'text-4xl font-mono font-bold', button: 'md' },
};

const statusColors: Record<TimerStatus, string> = {
  idle: 'text-gray-400',
  running: 'text-green-600',
  paused: 'text-yellow-500 animate-pulse',
  stopped: 'text-gray-600',
};

/**
 * Timer/Cronômetro — reusable component with Start/Pause/Stop/Reset.
 * Persists state in localStorage (survives page refresh).
 *
 * Usage:
 * ```tsx
 * <Timer storageKey="treino-geral" size="lg" label="Tempo total" onStop={handleStop} />
 * <Timer storageKey={`exercicio-${exercicioId}`} size="sm" onStop={handleExStop} />
 * ```
 */
export const Timer: FC<TimerProps> = ({
  storageKey,
  size = 'md',
  label,
  onStop,
  onTick,
  displayOnly = false,
  className,
}) => {
  const timer = useTimer({ storageKey, onStop, onTick });
  const styles = sizeStyles[size];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {label && (
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      )}

      {/* Time display */}
      <div className={cn(styles.time, statusColors[timer.status])}>
        {formatTimeLong(timer.elapsedSeconds)}
      </div>

      {/* Controls */}
      {!displayOnly && (
        <div className="flex items-center gap-2">
          {timer.canStart && (
            <Button
              variant="primary"
              size={styles.button}
              onClick={timer.start}
              title="Iniciar"
            >
              <Play className="h-4 w-4" />
              Iniciar
            </Button>
          )}

          {timer.isRunning && (
            <>
              <Button
                variant="secondary"
                size={styles.button}
                onClick={timer.pause}
                title="Pausar"
              >
                <Pause className="h-4 w-4" />
                Pausar
              </Button>
              <Button
                variant="danger"
                size={styles.button}
                onClick={timer.stop}
                title="Concluir"
              >
                <Square className="h-4 w-4" />
                Concluir
              </Button>
            </>
          )}

          {timer.isPaused && (
            <>
              <Button
                variant="primary"
                size={styles.button}
                onClick={timer.resume}
                title="Retomar"
              >
                <Play className="h-4 w-4" />
                Retomar
              </Button>
              <Button
                variant="danger"
                size={styles.button}
                onClick={timer.stop}
                title="Concluir"
              >
                <Square className="h-4 w-4" />
                Concluir
              </Button>
            </>
          )}

          {timer.isStopped && (
            <Button
              variant="ghost"
              size={styles.button}
              onClick={timer.reset}
              title="Resetar"
            >
              <RotateCcw className="h-4 w-4" />
              Resetar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Timer;
