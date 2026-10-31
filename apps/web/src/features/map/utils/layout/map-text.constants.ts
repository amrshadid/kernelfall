/** Average glyph widths in px: SVG text doesn't wrap, so the layout wraps by these, erring wide. */
export const GLYPH = {
  /** 12px caps, tracked. */
  kicker: 8.2,
  /** 26px Archivo, wide and heavy. */
  zone: 17,
  /** 14px Archivo. */
  caption: 7.6,
  /** 12px IBM Plex Mono. */
  mono: 7.3,
  /** 16px Archivo, semi-wide, bold. */
  region: 10,
  /** 12px Archivo. */
  meta: 6.6,
  /** 13px Archivo, condensed. */
  label: 6.4,
} as const
