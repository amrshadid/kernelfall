import type { GameTuning } from '#types/definitions/config'
import { DEFAULT_GAME_TUNING } from '#types/definitions/config'
import type { LevelId } from '#types/definitions/level'
import type {
  LevelOutcome,
  LevelPhase,
  LevelRunEvent,
  LevelRunEventType,
  LevelRunState,
  RunCheckpoint,
} from '#types/definitions/runner'
import { nextHintTier, scoreWithHints } from '#utils/hints/index'

type Handler<T extends LevelRunEventType> = (
  state: LevelRunState,
  event: Extract<LevelRunEvent, { type: T }>,
  tuning: GameTuning
) => LevelRunState

type PhaseHandlers = { readonly [T in LevelRunEventType]?: Handler<T> }

const goTo =
  (phase: LevelPhase) =>
  (state: LevelRunState): LevelRunState => ({ ...state, phase })

const revealHint: Handler<'reveal_hint'> = (state) => ({
  ...state,
  hintsRevealed: state.hintsRevealed + 1,
})

const submit: Handler<'submit'> = (state, { verdict }, tuning) => {
  const attempted = { ...state, attempts: state.attempts + 1, lastVerdict: verdict }
  if (!verdict.passed) {
    return attempted
  }
  const outcome = {
    via: 'player' as const,
    taint: verdict.taint,
    hintsRevealed: state.hintsRevealed,
    score: scoreWithHints(state.hintsRevealed, tuning),
  }
  // A pass with Taint waits for the player: they may fix it and finish clean.
  if (verdict.taint.length > 0) {
    return { ...attempted, heldPass: outcome }
  }
  return { ...attempted, phase: 'watch', outcome, heldPass: null }
}

const acceptTaint: Handler<'accept_taint'> = (state) => ({
  ...state,
  phase: 'watch',
  outcome: state.heldPass,
  heldPass: null,
})

const fixFirst: Handler<'fix_first'> = (state) => ({ ...state, heldPass: null })

// Never punish experimenting: an oops costs no Taint and no score.
const crash: Handler<'oops'> = (state, { report }) => ({
  ...state,
  phase: 'oops',
  oopses: state.oopses + 1,
  oops: report,
})

const respawn: Handler<'respawn'> = (state) => ({ ...state, phase: 'build', oops: null })

// The reference solution has zero Taint; the player gives up only the score.
const useReference: Handler<'use_reference'> = (state) => ({
  ...state,
  phase: 'watch',
  oops: null,
  heldPass: null,
  outcome: { via: 'reference', taint: [], hintsRevealed: state.hintsRevealed, score: 0 },
})

const TRANSITIONS: Readonly<Record<LevelPhase, PhaseHandlers>> = {
  scene: { next: goTo('see') },
  see: { next: goTo('build') },
  build: {
    reveal_hint: revealHint,
    submit,
    oops: crash,
    use_reference: useReference,
    accept_taint: acceptTaint,
    fix_first: fixFirst,
  },
  oops: { respawn, use_reference: useReference },
  watch: { next: goTo('card') },
  card: { next: goTo('complete') },
  complete: {},
}

export function createLevelRun(levelId: LevelId): LevelRunState {
  return {
    levelId,
    phase: 'scene',
    hintsRevealed: 0,
    attempts: 0,
    oopses: 0,
    lastVerdict: null,
    oops: null,
    outcome: null,
    heldPass: null,
  }
}

/** Whether `type` does anything in this state; use it to enable buttons. */
export function canTransition(state: LevelRunState, type: LevelRunEventType): boolean {
  if (type === 'reveal_hint' && nextHintTier(state.hintsRevealed) === null) {
    return false
  }
  if ((type === 'accept_taint' || type === 'fix_first') && state.heldPass === null) {
    return false
  }
  return TRANSITIONS[state.phase][type] !== undefined
}

export function allowedEvents(state: LevelRunState): readonly LevelRunEventType[] {
  const types = Object.keys(TRANSITIONS[state.phase]) as LevelRunEventType[]
  return types.filter((type) => canTransition(state, type))
}

/**
 * The level loop's pure transition function.
 *
 * Events that don't apply in the current state (a double-clicked "next", a
 * fourth hint) return the same state object, so callers can detect a no-op
 * with `===`.
 */
export function transition(
  state: LevelRunState,
  event: LevelRunEvent,
  tuning: GameTuning = DEFAULT_GAME_TUNING
): LevelRunState {
  if (!canTransition(state, event.type)) {
    return state
  }
  const handler = TRANSITIONS[state.phase][event.type] as Handler<typeof event.type> | undefined
  return handler ? handler(state, event, tuning) : state
}

/** The part of a run worth saving; the rest is rebuilt on resume. */
export function checkpointOf(state: LevelRunState): RunCheckpoint {
  const { phase, hintsRevealed, attempts, oopses } = state
  return { phase, hintsRevealed, attempts, oopses }
}

/**
 * Rebuilds a run from a saved checkpoint. A run saved mid-oops resumes in
 * `build`, because the lab comes back from its snapshot on load anyway.
 */
export function resumeLevelRun(
  levelId: LevelId,
  checkpoint: RunCheckpoint,
  outcome: LevelOutcome | null
): LevelRunState {
  const phase = checkpoint.phase === 'oops' ? 'build' : checkpoint.phase
  return { ...createLevelRun(levelId), ...checkpoint, phase, outcome }
}
