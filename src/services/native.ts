import { NativeEventEmitter } from 'react-native';
import NativeAlbionPresence from '../../specs/NativeAlbionPresence';
import type { NativeState } from '../types/presence';
import { toNativeState, type RawNativeState } from './nativeMapper';

/** Event name emitted by the native module with a full state snapshot. */
export const STATE_EVENT = 'AlbionPresenceStateChanged';

export interface Subscription {
  remove(): void;
}

/** Typed facade over the Turbo Native Module. */
export interface NativeApi {
  getState(): Promise<NativeState>;
  checkUsagePermission(): Promise<boolean>;
  requestUsagePermission(): Promise<void>;
  startMonitoring(): Promise<void>;
  stopMonitoring(): Promise<void>;
  updatePresence(): Promise<void>;
  clearPresence(): Promise<void>;
  addStateListener(listener: (state: NativeState) => void): Subscription;
}

let cached: NativeApi | null | undefined;

/**
 * Returns the native API, or `null` when this build does not include the
 * native module. Callers must show that honestly instead of faking data.
 */
export function getNativeApi(): NativeApi | null {
  if (cached !== undefined) {
    return cached;
  }
  const native = NativeAlbionPresence;
  if (native == null) {
    cached = null;
    return cached;
  }
  const emitter = new NativeEventEmitter(native);
  cached = {
    async getState() {
      return toNativeState(await native.getMonitoringState());
    },
    checkUsagePermission: () => native.checkUsagePermission(),
    requestUsagePermission: () => native.requestUsagePermission(),
    startMonitoring: () => native.startMonitoring(),
    stopMonitoring: () => native.stopMonitoring(),
    updatePresence: () => native.updatePresence(),
    clearPresence: () => native.clearPresence(),
    addStateListener(listener) {
      const subscription = emitter.addListener(STATE_EVENT, (payload: RawNativeState) => {
        listener(toNativeState(payload));
      });
      return { remove: () => subscription.remove() };
    },
  };
  return cached;
}
