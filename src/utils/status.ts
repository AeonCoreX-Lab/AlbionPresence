import type { NativeState, StatusDescription } from '../types/presence';

/**
 * Foreground detection only proves the game app is in front. It cannot tell
 * whether the player is logged in, at the login screen, or disconnected, so
 * the wording below never claims more than "app active".
 */
export function describeDetection(
  native: NativeState | null,
  nativeAvailable: boolean,
): StatusDescription {
  if (!nativeAvailable || native === null) {
    return { label: 'Native monitor unavailable in this build', tone: 'muted' };
  }
  switch (native.monitoring) {
    case 'permission-missing':
      return { label: 'Usage Access permission needed', tone: 'warning' };
    case 'restricted':
      return { label: 'Background monitoring restricted by the system', tone: 'warning' };
    case 'error':
      return { label: 'Monitoring error', tone: 'error' };
    case 'stopped':
      return { label: 'Detection is off', tone: 'muted' };
    case 'running':
      break;
  }
  if (!native.gameInstalled) {
    return { label: `Albion Online not found (${native.gamePackage})`, tone: 'warning' };
  }
  switch (native.session.phase) {
    case 'active':
      return { label: 'Albion Online app is active', tone: 'ok' };
    case 'grace':
      return { label: 'Albion Online left the foreground, waiting briefly', tone: 'warning' };
    case 'inactive':
      return { label: 'Watching for Albion Online', tone: 'neutral' };
  }
}

export function describeDiscord(
  native: NativeState | null,
  nativeAvailable: boolean,
): StatusDescription {
  if (!nativeAvailable || native === null) {
    return { label: 'Not connected', tone: 'muted' };
  }
  switch (native.discord) {
    case 'idle':
      return { label: 'Not connected yet', tone: 'muted' };
    case 'initializing':
      return { label: 'Connecting to Discord', tone: 'neutral' };
    case 'published':
      return { label: 'Connected, presence confirmed by Discord', tone: 'ok' };
    case 'retrying':
      return { label: 'Discord unavailable, retrying', tone: 'warning' };
    case 'unavailable':
      return { label: 'Discord app not available', tone: 'warning' };
    case 'error':
      return {
        label: native.discordError ? `Error: ${native.discordError}` : 'Discord error',
        tone: 'error',
      };
  }
}

export function describePublishing(
  native: NativeState | null,
  nativeAvailable: boolean,
): StatusDescription {
  if (!nativeAvailable || native === null) {
    return { label: 'Not publishing', tone: 'muted' };
  }
  if (native.discord === 'published' && native.session.phase !== 'inactive') {
    return { label: 'Publishing "Albion Online"', tone: 'ok' };
  }
  return { label: 'Not publishing', tone: 'muted' };
}
