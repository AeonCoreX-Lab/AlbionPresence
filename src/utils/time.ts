import type { SessionPhase } from '../types/presence';

/** Formats a duration like Discord's elapsed timer: `MM:SS`, or `H:MM:SS` from one hour. */
export function formatDuration(ms: number): string {
  const safeMs = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Always `HH:MM:SS`, matching the dashboard timer design. */
export function formatClock(ms: number): string {
  const safeMs = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export interface ElapsedSource {
  phase: SessionPhase;
  /** Elapsed time reported by native when the state was captured. */
  elapsedMs: number;
}

/**
 * Derives the displayed elapsed time from a native snapshot.
 *
 * This is display-only. Native owns the authoritative timer; the UI
 * extrapolates between native updates using a monotonic clock
 * (`performance.now()`), and every native update replaces the baseline.
 */
export function deriveElapsedMs(
  source: ElapsedSource,
  receivedAtMonotonicMs: number,
  nowMonotonicMs: number,
): number {
  if (source.phase === 'inactive') {
    return 0;
  }
  const base = Number.isFinite(source.elapsedMs) ? Math.max(0, source.elapsedMs) : 0;
  const drift = Math.max(0, nowMonotonicMs - receivedAtMonotonicMs);
  return base + (Number.isFinite(drift) ? drift : 0);
}

/** Short relative time for "last synchronised", e.g. `3 min ago`. */
export function formatRelativeTime(thenMs: number | null, nowMs: number): string {
  if (thenMs === null || !Number.isFinite(thenMs)) {
    return 'Never';
  }
  const seconds = Math.floor((nowMs - thenMs) / 1000);
  if (seconds < 5) {
    return 'Just now';
  }
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} h ago`;
  }
  return `${Math.floor(hours / 24)} d ago`;
}
