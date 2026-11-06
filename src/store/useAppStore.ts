import { create } from 'zustand';

interface AppStoreState {
  onboardingCompleted: boolean;
  completeOnboarding: () => void;
}

/**
 * App-level UI state.
 *
 * KNOWN LIMITATION: `onboardingCompleted` is held in memory only, so the intro
 * is shown on every launch. Persistent settings are owned by the native layer
 * (SharedPreferences/DataStore) and arrive in Phase 4.
 */
export const useAppStore = create<AppStoreState>()((set) => ({
  onboardingCompleted: false,
  completeOnboarding: () => set({ onboardingCompleted: true }),
}));
