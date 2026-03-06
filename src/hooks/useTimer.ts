import { useState, useEffect, useCallback, useRef } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'stopped';

interface UseTimerOptions {
  /** Unique key for localStorage persistence. If set, timer state survives page refresh. */
  storageKey?: string;
  /** Callback invoked every second while running. Receives elapsed seconds. */
  onTick?: (elapsedSeconds: number) => void;
  /** Callback when timer is explicitly stopped (not paused). Receives total elapsed seconds. */
  onStop?: (totalSeconds: number) => void;
}

interface TimerState {
  elapsedMs: number;
  status: TimerStatus;
  startedAt: number | null; // Date.now() when last resumed
}

const STORAGE_PREFIX = 'treinai_timer_';

function loadState(key: string): TimerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as TimerState;
  } catch {
    return null;
  }
}

function saveState(key: string, state: TimerState) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
  } catch {
    // quota exceeded — best effort
  }
}

function clearState(key: string) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // noop
  }
}

export function useTimer(options: UseTimerOptions = {}) {
  const { storageKey, onTick, onStop } = options;

  // Restore from localStorage if available
  const initial = storageKey ? loadState(storageKey) : null;

  const [elapsedMs, setElapsedMs] = useState(() => {
    if (!initial) return 0;
    // If it was running, add the time elapsed since we last saved
    if (initial.status === 'running' && initial.startedAt) {
      return initial.elapsedMs + (Date.now() - initial.startedAt);
    }
    return initial.elapsedMs;
  });

  const [status, setStatus] = useState<TimerStatus>(initial?.status ?? 'idle');
  const startedAtRef = useRef<number | null>(
    initial?.status === 'running' ? Date.now() : null
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTickRef = useRef(onTick);
  const onStopRef = useRef(onStop);

  // Keep refs up to date
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);
  useEffect(() => { onStopRef.current = onStop; }, [onStop]);

  // Persist state to localStorage
  useEffect(() => {
    if (!storageKey) return;
    saveState(storageKey, {
      elapsedMs,
      status,
      startedAt: startedAtRef.current,
    });
  }, [elapsedMs, status, storageKey]);

  // Tick loop
  useEffect(() => {
    if (status !== 'running') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const base = startedAtRef.current ?? now;
      setElapsedMs((prev) => {
        const newMs = prev + (now - base);
        startedAtRef.current = now;
        return newMs;
      });
      onTickRef.current?.(Math.floor(elapsedMs / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const start = useCallback(() => {
    startedAtRef.current = Date.now();
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    if (startedAtRef.current) {
      setElapsedMs((prev) => prev + (Date.now() - startedAtRef.current!));
    }
    startedAtRef.current = null;
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    startedAtRef.current = Date.now();
    setStatus('running');
  }, []);

  const stop = useCallback(() => {
    let total = elapsedMs;
    if (startedAtRef.current) {
      total += Date.now() - startedAtRef.current;
    }
    startedAtRef.current = null;
    setElapsedMs(total);
    setStatus('stopped');
    onStopRef.current?.(Math.floor(total / 1000));
    if (storageKey) clearState(storageKey);
  }, [elapsedMs, storageKey]);

  const reset = useCallback(() => {
    startedAtRef.current = null;
    setElapsedMs(0);
    setStatus('idle');
    if (storageKey) clearState(storageKey);
  }, [storageKey]);

  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  return {
    /** Total elapsed seconds */
    elapsedSeconds,
    /** Total elapsed milliseconds */
    elapsedMs,
    /** Current timer status */
    status,
    /** Formatted time as MM:SS */
    formatted: formatTime(elapsedSeconds),
    /** Start the timer (from idle) */
    start,
    /** Pause the timer */
    pause,
    /** Resume from paused */
    resume,
    /** Stop the timer (final) — triggers onStop callback */
    stop,
    /** Reset to zero / idle — clears localStorage */
    reset,
    /** Whether the timer can be started */
    canStart: status === 'idle',
    /** Whether the timer is currently running */
    isRunning: status === 'running',
    /** Whether the timer is paused */
    isPaused: status === 'paused',
    /** Whether the timer has been stopped (finished) */
    isStopped: status === 'stopped',
  };
}

/** Formats seconds as MM:SS */
export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Formats seconds as HH:MM:SS (for long sessions) */
export function formatTimeLong(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
