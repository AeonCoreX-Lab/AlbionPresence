/**
 * Turbo Native Module spec for AlbionPresence.
 *
 * The native Android layer owns the authoritative monitoring, session and
 * Discord state. JavaScript only mirrors what native reports.
 *
 * Codegen notes:
 *  - Codegen cannot express string-literal unions or nullable numbers well, so
 *    the wire format uses plain `string`/`number` with sentinels
 *    (`''` = none, `-1` = none). `src/services/nativeMapper.ts` converts these
 *    into the domain types and never treats an unknown value as healthy.
 *  - Events use the classic `addListener`/`removeListeners` pair and are
 *    delivered through `NativeEventEmitter` as `AlbionPresenceStateChanged`
 *    with a full `NativeStateWire` payload.
 *  - `getMonitoringState()` returns the full state snapshot (a superset of the
 *    suggested API), so one call refreshes the whole UI.
 *
 * UNVERIFIED: this file has not been through codegen yet (no network access in
 * the authoring environment). Check it against the React Native version's
 * Turbo Native Module documentation on first build.
 */
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type SessionWire = {
  /** 'inactive' | 'active' | 'grace' */
  phase: string;
  /** '' when there is no session. */
  sessionId: string;
  /** Wall-clock session start (epoch ms), -1 when there is no session. */
  startedAtWallClockMs: number;
  /** Elapsed time when this snapshot was taken. */
  elapsedMs: number;
};

export type NativeStateWire = {
  /** 'stopped' | 'running' | 'permission-missing' | 'restricted' | 'error' */
  monitoringState: string;
  session: SessionWire;
  /** 'idle' | 'initializing' | 'published' | 'retrying' | 'unavailable' | 'error' */
  discordState: string;
  /** '' when there is no error. Must never contain tokens or credentials. */
  discordError: string;
  /** Epoch ms of the last Discord-confirmed update, -1 if none. */
  lastPublishedAtWallClockMs: number;
  usagePermissionGranted: boolean;
  gamePackage: string;
  gameInstalled: boolean;
};

export interface Spec extends TurboModule {
  checkUsagePermission(): Promise<boolean>;
  /** Opens the system Usage Access settings. The result is observed by re-checking. */
  requestUsagePermission(): Promise<void>;
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  getMonitoringState(): Promise<NativeStateWire>;
  getCurrentSession(): Promise<SessionWire>;
  getElapsedTime(): Promise<number>;
  getDiscordConnectionState(): Promise<string>;
  updatePresence(): Promise<void>;
  clearPresence(): Promise<void>;

  // Required by NativeEventEmitter.
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

/** `null` when the native module is not part of the running build. */
export default TurboModuleRegistry.get<Spec>('AlbionPresence');
