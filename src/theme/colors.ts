/**
 * AlbionPresence palette.
 *
 * Values marked "sampled" were measured from the approved UI mockup
 * (docs/DESIGN.md). The rest were chosen to sit with them: ivory and gold
 * highlights, violet accent, no heavy glow.
 */
export const colors = {
  background: '#09081D', // sampled
  backgroundRaised: '#0D0D1D', // sampled (tab bar)
  surface: '#131331', // sampled (cards)
  surfaceRaised: '#1C1B34', // sampled (secondary button)
  surfaceBorder: '#2B2A52',

  ivory: '#F3EBD8',
  ivoryMuted: '#B9B3A3',
  gold: '#C9A24B',
  goldDim: '#8F7433',

  violet: '#6041E2', // sampled (primary button)
  violetSoft: '#9B87FF', // violet for text/icons on dark backgrounds (contrast)
  violetDeep: '#4B3FB5',

  ok: '#29E657', // sampled (status dot)
  warning: '#E0A94A',
  error: '#E0685F',
  muted: '#9A98B8',
} as const;

export type ColorName = keyof typeof colors;
