import { useState, useEffect, useCallback, useRef } from 'react';

export type CountdownStatus = 'idle' | 'running' | 'paused' | 'finished';

interface UseCountdownOptions {
  /** Duration in seconds */
  durationSeconds: number;
  /** Callback when countdown reaches zero */
  onFinish?: () => void;
}

export function useCountdown({ durationSeconds, onFinish }: UseCountdownOptions) {
  const [remainingMs, setRemainingMs] = useState(durationSeconds * 1000);
  const [status, setStatus] = useState<CountdownStatus>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);

  // Reset when duration changes
  useEffect(() => {
    setRemainingMs(durationSeconds * 1000);
    setStatus('idle');
    lastTickRef.current = null;
  }, [durationSeconds]);

  useEffect(() => {
    if (status !== 'running') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - (lastTickRef.current ?? now);
      lastTickRef.current = now;

      setRemainingMs((prev) => {
        const next = prev - delta;
        if (next <= 0) {
          setStatus('finished');
          onFinishRef.current?.();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  const start = useCallback(() => {
    setRemainingMs(durationSeconds * 1000);
    lastTickRef.current = Date.now();
    setStatus('running');
  }, [durationSeconds]);

  const pause = useCallback(() => {
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    lastTickRef.current = Date.now();
    setStatus('running');
  }, []);

  const reset = useCallback(() => {
    setRemainingMs(durationSeconds * 1000);
    setStatus('idle');
    lastTickRef.current = null;
  }, [durationSeconds]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progress = 1 - (remainingMs / (durationSeconds * 1000));

  return {
    remainingSeconds,
    remainingMs,
    status,
    /** 0 to 1 progress (1 = finished) */
    progress,
    formatted: formatCountdown(remainingSeconds),
    start,
    pause,
    resume,
    reset,
    isIdle: status === 'idle',
    isRunning: status === 'running',
    isPaused: status === 'paused',
    isFinished: status === 'finished',
  };
}

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
