import { useEffect, useState } from 'react';

/**
 * Wall-clock "now" that refreshes on an interval. Display-only: used to keep
 * relative labels such as "3 min ago" from going stale.
 */
export function useNow(intervalMs: number, enabled: boolean = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return now;
}
