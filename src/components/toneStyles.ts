import { colors } from '../theme';
import type { Tone } from '../types/presence';
import { toneColor } from './toneColor';

/** Card background and border for a status tone (subtle tint, no glow). */
export function toneSurface(tone: Tone): { backgroundColor: string; borderColor: string } {
  switch (tone) {
    case 'ok':
      return { backgroundColor: 'rgba(41, 230, 87, 0.08)', borderColor: 'rgba(41, 230, 87, 0.45)' };
    case 'warning':
      return { backgroundColor: 'rgba(224, 169, 74, 0.08)', borderColor: 'rgba(224, 169, 74, 0.45)' };
    case 'error':
      return { backgroundColor: 'rgba(224, 104, 95, 0.08)', borderColor: 'rgba(224, 104, 95, 0.45)' };
    case 'muted':
    case 'neutral':
      return { backgroundColor: colors.surface, borderColor: colors.surfaceBorder };
  }
}

/** Title text colour: coloured for ok/warning/error, quiet otherwise. */
export function toneTitleColor(tone: Tone): string {
  switch (tone) {
    case 'ok':
    case 'warning':
    case 'error':
      return toneColor(tone);
    case 'muted':
      return colors.ivoryMuted;
    case 'neutral':
      return colors.ivory;
  }
}
