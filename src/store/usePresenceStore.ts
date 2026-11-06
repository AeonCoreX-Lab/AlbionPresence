import { create } from 'zustand';
import type { NativeState } from '../types/presence';

export type NativeStatus = 'checking' | 'available' | 'unavailable';

export interface PresenceStoreState {
  nativeStatus: NativeStatus;
  /** Last state reported by the native layer (the source of truth). */
  native: NativeState | null;
  /** `performance.now()` when `native` was received; baseline for display extrapolation. */
  receivedAtMs: number;
  lastError: string | null;
  applyNativeState: (state: NativeState) => void;
  markNativeUnavailable: () => void;
  setError: (message: string | null) => void;
}

/**
 * The store only mirrors native state. It never creates sessions or timers of
 * its own, so JS cannot produce a duplicate session.
 */
export const usePresenceStore = create<PresenceStoreState>()((set) => ({
  nativeStatus: 'checking',
  native: null,
  receivedAtMs: 0,
  lastError: null,
  applyNativeState: (state) =>
    set({ nativeStatus: 'available', native: state, receivedAtMs: performance.now(), lastError: null }),
  markNativeUnavailable: () => set({ nativeStatus: 'unavailable', native: null }),
  setError: (message) => set({ lastError: message }),
}));
