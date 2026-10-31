export interface SpeakerInfo {
  readonly id: string
  readonly name: string
  /** The real term, e.g. "PID 1, the first userspace process". */
  readonly term: string
  /** Which portrait to draw, or null for a voice without one. */
  readonly portrait: 'init' | 'watchdog' | null
}
