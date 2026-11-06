import { toNativeState, type RawNativeState } from '../src/services/nativeMapper';

function raw(overrides: Partial<RawNativeState> = {}): RawNativeState {
  return {
    monitoringState: 'running',
    session: { phase: 'active', sessionId: 'abc', startedAtWallClockMs: 1_700_000_000_000, elapsedMs: 4_000 },
    discordState: 'published',
    discordError: '',
    lastPublishedAtWallClockMs: 1_700_000_001_000,
    usagePermissionGranted: true,
    gamePackage: 'example.game',
    gameInstalled: true,
    ...overrides,
  };
}

describe('toNativeState', () => {
  it('maps a healthy active state', () => {
    const state = toNativeState(raw());
    expect(state.monitoring).toBe('running');
    expect(state.session.phase).toBe('active');
    expect(state.session.sessionId).toBe('abc');
    expect(state.session.startedAtMs).toBe(1_700_000_000_000);
    expect(state.discord).toBe('published');
    expect(state.discordError).toBe(null);
    expect(state.lastPublishedAtMs).toBe(1_700_000_001_000);
  });

  it('maps sentinels to null', () => {
    const state = toNativeState(
      raw({
        session: { phase: 'inactive', sessionId: '', startedAtWallClockMs: -1, elapsedMs: 0 },
        lastPublishedAtWallClockMs: -1,
        discordError: '',
      }),
    );
    expect(state.session.sessionId).toBe(null);
    expect(state.session.startedAtMs).toBe(null);
    expect(state.lastPublishedAtMs).toBe(null);
  });

  it('never reports unknown states as healthy', () => {
    const state = toNativeState(
      raw({
        monitoringState: 'something-new',
        discordState: 'connected-ish',
        session: { phase: 'weird', sessionId: '', startedAtWallClockMs: -1, elapsedMs: 0 },
      }),
    );
    expect(state.monitoring).toBe('error');
    expect(state.discord).toBe('error');
    expect(state.session.phase).toBe('inactive');
  });

  it('keeps the Discord error text', () => {
    expect(toNativeState(raw({ discordState: 'error', discordError: 'init failed' })).discordError).toBe(
      'init failed',
    );
  });

  it('clamps invalid elapsed values', () => {
    const state = toNativeState(
      raw({ session: { phase: 'active', sessionId: 'x', startedAtWallClockMs: 1, elapsedMs: -9 } }),
    );
    expect(state.session.elapsedMs).toBe(0);
  });
});
