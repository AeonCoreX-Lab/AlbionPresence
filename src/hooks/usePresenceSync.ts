import { useEffect } from 'react';
import { AppState } from 'react-native';
import { getNativeApi } from '../services/native';
import { usePresenceStore } from '../store/usePresenceStore';

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

/**
 * Keeps the store in sync with the native layer: reads the current state on
 * mount, subscribes to native state events, and refreshes whenever the app
 * returns to the foreground (for example after the user visits Usage Access
 * settings).
 */
export function usePresenceSync(): void {
  useEffect(() => {
    const api = getNativeApi();
    const { applyNativeState, markNativeUnavailable, setError } = usePresenceStore.getState();
    if (api === null) {
      markNativeUnavailable();
      return undefined;
    }

    let cancelled = false;
    const refresh = async () => {
      try {
        const state = await api.getState();
        if (!cancelled) {
          applyNativeState(state);
        }
      } catch (error) {
        if (!cancelled) {
          setError(messageOf(error));
        }
      }
    };

    void refresh();
    const stateSubscription = api.addStateListener(applyNativeState);
    const appStateSubscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void refresh();
      }
    });

    return () => {
      cancelled = true;
      stateSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);
}
