import { colors } from '../theme';
import type { Tone } from '../types/presence';

export function toneColor(tone: Tone): string {
  switch (tone) {
    case 'ok':
      return colors.ok;
    case 'warning':
      return colors.warning;
    case 'error':
      return colors.error;
    case 'muted':
      return colors.muted;
    case 'neutral':
      return colors.violet;
  }
}
