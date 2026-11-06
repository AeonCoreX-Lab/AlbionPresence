import { describeDetection, describeDiscord, describePublishing } from '../src/utils/status';
import type { NativeState } from '../src/types/presence';

function state(overrides: Partial<NativeState> = {}): NativeState {
  return {
    monitoring: 'running',
    session: { phase: 'inactive', sessionId: null, startedAtMs: null, elapsedMs: 0 },
    discord: 'idle',
    discordError: null,
    lastPublishedAtMs: null,
    usagePermissionGranted: true,
    gamePackage: 'example.game',
    gameInstalled: true,
    ...overrides,
  };
}

describe('describeDetection', () => {
  it('is honest when the native module is missing', () => {
    expect(describeDetection(null, false).tone).toBe('muted');
    expect(describeDetection(null, true).tone).toBe('muted');
  });

  it('asks for Usage Access when it is missing', () => {
    expect(describeDetection(state({ monitoring: 'permission-missing' }), true).label).toContain('Usage Access');
  });

  it('only claims the game app is active, never that the player is in-game', () => {
    const active = describeDetection(
      state({ session: { phase: 'active', sessionId: 's', startedAtMs: 1, elapsedMs: 1 } }),
      true,
    );
    expect(active.tone).toBe('ok');
    expect(active.label).toBe('Albion Online app is active');
  });

  it('reports a missing game package', () => {
    const result = describeDetection(state({ gameInstalled: false }), true);
    expect(result.tone).toBe('warning');
    expect(result.label).toContain('example.game');
  });

  it('shows grace as a warning, not as active', () => {
    const grace = describeDetection(
      state({ session: { phase: 'grace', sessionId: 's', startedAtMs: 1, elapsedMs: 1 } }),
      true,
    );
    expect(grace.tone).toBe('warning');
  });

  it('reports detection off and errors', () => {
    expect(describeDetection(state({ monitoring: 'stopped' }), true).label).toBe('Detection is off');
    expect(describeDetection(state({ monitoring: 'error' }), true).tone).toBe('error');
    expect(describeDetection(state({ monitoring: 'restricted' }), true).tone).toBe('warning');
  });
});

describe('describeDiscord', () => {
  it('only shows a healthy tone for confirmed presence', () => {
    expect(describeDiscord(state({ discord: 'published' }), true).tone).toBe('ok');
    for (const discord of ['idle', 'initializing', 'retrying', 'unavailable', 'error'] as const) {
      expect(describeDiscord(state({ discord }), true).tone).not.toBe('ok');
    }
  });

  it('includes the error text when there is one', () => {
    expect(describeDiscord(state({ discord: 'error', discordError: 'boom' }), true).label).toContain('boom');
  });

  it('is not connected without the native module', () => {
    expect(describeDiscord(null, false).label).toBe('Not connected');
  });
});

describe('describePublishing', () => {
  it('publishes only when Discord confirmed and a session exists', () => {
    const active = { phase: 'active', sessionId: 's', startedAtMs: 1, elapsedMs: 1 } as const;
    expect(describePublishing(state({ discord: 'published', session: active }), true).tone).toBe('ok');
    expect(describePublishing(state({ discord: 'published' }), true).tone).toBe('muted');
    expect(describePublishing(state({ discord: 'retrying', session: active }), true).tone).toBe('muted');
  });
});
