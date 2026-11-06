import { useEffect, useState } from 'react';
import { usePresenceStore } from '../store/usePresenceStore';
import { deriveElapsedMs } from '../utils/time';

/**
 * Elapsed session time for display.
 *
 * The authoritative timer lives in native code. This hook extrapolates from
 * the last native snapshot, and the 1 s interval only repaints the UI. It is
 * not a timer of record, and a native update replaces the baseline.
 */
export function useElapsedMs(): number {
  const phase = usePresenceStore((s) => s.native?.session.phase ?? 'inactive');
  const elapsedMs = usePresenceStore((s) => s.native?.session.elapsedMs ?? 0);
  const receivedAtMs = usePresenceStore((s) => s.receivedAtMs);
  const [nowMs, setNowMs] = useState(() => performance.now());

  useEffect(() => {
    if (phase === 'inactive') {
      return undefined;
    }
    setNowMs(performance.now());
    const id = setInterval(() => setNowMs(performance.now()), 1000);
    return () => clearInterval(id);
  }, [phase, receivedAtMs]);

  return deriveElapsedMs({ phase, elapsedMs }, receivedAtMs, nowMs);
}
