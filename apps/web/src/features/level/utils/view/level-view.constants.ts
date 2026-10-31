import type { StepId } from '@shared/types'

/** Why a level can't be played, said plainly with the way on. */
export const UNAVAILABLE_REASONS = {
  locked: "It's locked until you have the skills it needs. The Kernel Map shows what to play first.",
  missing: 'There is no level at this address.',
} as const

/** The story sections the Guide shows for a step, in order of preference: a step without its own falls back. */
export const SECTION_FOR_STEP: Readonly<Record<StepId, readonly string[]>> = {
  scene: ['scene'],
  see: ['see-it', 'scene'],
  build: ['build-it', 'see-it', 'scene'],
  watch: ['watch-it', 'debrief'],
  card: ['debrief', 'watch-it'],
}
