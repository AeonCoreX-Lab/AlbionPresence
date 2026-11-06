import type {
  DiscordState,
  MonitoringState,
  NativeState,
  SessionPhase,
} from '../types/presence';

/**
 * Wire format sent by the native module. It is deliberately flat and uses
 * sentinels (`''`, `-1`) instead of null so the Turbo Module codegen spec stays
 * simple. This interface mirrors `NativeStateWire` in
 * `specs/NativeAlbionPresence.ts`; assigning one to the other is checked by the
 * compiler in `services/native.ts`.
 */
export interface RawNativeState {
  monitoringState: string;
  session: {
    phase: string;
    sessionId: string;
    startedAtWallClockMs: number;
    elapsedMs: number;
  };
  discordState: string;
  discordError: string;
  lastPublishedAtWallClockMs: number;
  usagePermissionGranted: boolean;
  gamePackage: string;
  gameInstalled: boolean;
}

const MONITORING_STATES: readonly MonitoringState[] = [
  'stopped',
  'running',
  'permission-missing',
  'restricted',
  'error',
];
const SESSION_PHASES: readonly SessionPhase[] = ['inactive', 'active', 'grace'];
const DISCORD_STATES: readonly DiscordState[] = [
  'idle',
  'initializing',
  'published',
  'retrying',
  'unavailable',
  'error',
];

function pick<T extends string>(allowed: readonly T[], value: string, fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function nullIfNegative(value: number): number | null {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Converts the wire format into domain types. Unknown values never look
 * healthy: an unrecognised monitoring or Discord state maps to `error`, and an
 * unrecognised session phase maps to `inactive`.
 */
export function toNativeState(raw: RawNativeState): NativeState {
  return {
    monitoring: pick(MONITORING_STATES, raw.monitoringState, 'error'),
    session: {
      phase: pick(SESSION_PHASES, raw.session.phase, 'inactive'),
      sessionId: raw.session.sessionId === '' ? null : raw.session.sessionId,
      startedAtMs: nullIfNegative(raw.session.startedAtWallClockMs),
      elapsedMs: Number.isFinite(raw.session.elapsedMs) ? Math.max(0, raw.session.elapsedMs) : 0,
    },
    discord: pick(DISCORD_STATES, raw.discordState, 'error'),
    discordError: raw.discordError === '' ? null : raw.discordError,
    lastPublishedAtMs: nullIfNegative(raw.lastPublishedAtWallClockMs),
    usagePermissionGranted: raw.usagePermissionGranted,
    gamePackage: raw.gamePackage,
    gameInstalled: raw.gameInstalled,
  };
}
