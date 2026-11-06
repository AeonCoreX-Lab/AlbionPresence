import { deriveElapsedMs, formatClock, formatDuration, formatRelativeTime } from '../src/utils/time';

describe('formatClock', () => {
  it('always uses HH:MM:SS', () => {
    expect(formatClock(0)).toBe('00:00:00');
    expect(formatClock(5_075_000)).toBe('01:24:35');
    expect(formatClock(100 * 3_600_000)).toBe('100:00:00');
  });

  it('treats invalid input as zero', () => {
    expect(formatClock(-1)).toBe('00:00:00');
    expect(formatClock(Number.NaN)).toBe('00:00:00');
  });
});

describe('formatDuration', () => {
  it('formats under an hour as MM:SS', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(9_000)).toBe('00:09');
    expect(formatDuration(65_000)).toBe('01:05');
    expect(formatDuration(59 * 60_000 + 59_000)).toBe('59:59');
  });

  it('formats one hour and above as H:MM:SS', () => {
    expect(formatDuration(3_600_000)).toBe('1:00:00');
    expect(formatDuration(3_600_000 + 61_000)).toBe('1:01:01');
    expect(formatDuration(26 * 3_600_000)).toBe('26:00:00');
  });

  it('truncates partial seconds', () => {
    expect(formatDuration(1_999)).toBe('00:01');
  });

  it('treats negative and non-finite input as zero', () => {
    expect(formatDuration(-5_000)).toBe('00:00');
    expect(formatDuration(Number.NaN)).toBe('00:00');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('00:00');
  });
});

describe('deriveElapsedMs', () => {
  it('is zero while no session is running', () => {
    expect(deriveElapsedMs({ phase: 'inactive', elapsedMs: 5_000 }, 100, 9_000)).toBe(0);
  });

  it('extrapolates from the native baseline while active', () => {
    expect(deriveElapsedMs({ phase: 'active', elapsedMs: 10_000 }, 1_000, 3_500)).toBe(12_500);
  });

  it('keeps counting during the grace period (same session)', () => {
    expect(deriveElapsedMs({ phase: 'grace', elapsedMs: 10_000 }, 0, 2_000)).toBe(12_000);
  });

  it('never goes backwards if the monotonic clock looks reversed', () => {
    expect(deriveElapsedMs({ phase: 'active', elapsedMs: 10_000 }, 5_000, 1_000)).toBe(10_000);
  });

  it('ignores invalid native values', () => {
    expect(deriveElapsedMs({ phase: 'active', elapsedMs: Number.NaN }, 0, 1_000)).toBe(1_000);
    expect(deriveElapsedMs({ phase: 'active', elapsedMs: -50 }, 0, 0)).toBe(0);
  });
});

describe('formatRelativeTime', () => {
  const now = 1_000_000_000;

  it('shows Never when nothing was published', () => {
    expect(formatRelativeTime(null, now)).toBe('Never');
  });

  it('handles recent and clock-skewed times', () => {
    expect(formatRelativeTime(now - 2_000, now)).toBe('Just now');
    expect(formatRelativeTime(now + 30_000, now)).toBe('Just now');
  });

  it('uses seconds, minutes, hours and days', () => {
    expect(formatRelativeTime(now - 30_000, now)).toBe('30s ago');
    expect(formatRelativeTime(now - 3 * 60_000, now)).toBe('3 min ago');
    expect(formatRelativeTime(now - 2 * 3_600_000, now)).toBe('2 h ago');
    expect(formatRelativeTime(now - 3 * 86_400_000, now)).toBe('3 d ago');
  });
});
