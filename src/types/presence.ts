/**
 * Domain types used by the UI. The native Android layer owns the
 * authoritative values; these types describe what it reports.
 */

export type MonitoringState =
  | 'stopped'
  | 'running'
  | 'permission-missing'
  | 'restricted'
  | 'error';

/** `grace` = the game app left the foreground and the session is still being held open. */
export type SessionPhase = 'inactive' | 'active' | 'grace';

/**
 * `published` is only reported after Discord's SDK confirmed a presence update.
 * Nothing in this app shows a connected state before that confirmation.
 */
export type DiscordState =
  | 'idle'
  | 'initializing'
  | 'published'
  | 'retrying'
  | 'unavailable'
  | 'error';

export interface SessionInfo {
  phase: SessionPhase;
  sessionId: string | null;
  /** Wall-clock start of the session (epoch ms), used for Discord's start timestamp. */
  startedAtMs: number | null;
  /** Elapsed time at the moment native captured this state. */
  elapsedMs: number;
}

export interface NativeState {
  monitoring: MonitoringState;
  session: SessionInfo;
  discord: DiscordState;
  discordError: string | null;
  /** Epoch ms of the last presence update Discord confirmed. */
  lastPublishedAtMs: number | null;
  usagePermissionGranted: boolean;
  gamePackage: string;
  gameInstalled: boolean;
}

export type Tone = 'ok' | 'warning' | 'error' | 'muted' | 'neutral';

export interface StatusDescription {
  label: string;
  tone: Tone;
}
