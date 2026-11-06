/**
 * Typography tokens.
 *
 * The visual direction calls for medieval-inspired type. Until an
 * open-licensed display font is bundled (it needs to be added as a project
 * asset and its licence recorded), headings use the platform serif so the
 * app stays legible and has no network dependency.
 */
const serif = 'serif';

export const typography = {
  title: { fontFamily: serif, fontSize: 24, fontWeight: '700', letterSpacing: 0.4 },
  heading: { fontFamily: serif, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  body: { fontSize: 15, fontWeight: '400' },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '400', letterSpacing: 0.2 },
  timer: { fontFamily: serif, fontSize: 40, fontWeight: '700', letterSpacing: 1 },
} as const;
