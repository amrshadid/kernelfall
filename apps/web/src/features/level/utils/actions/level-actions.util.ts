import type { GuideAction } from '@features/level/types'
import type { UseLevelActionsResult } from '@kernelfall/game/hooks'
import { HINT_TIERS, type LevelRunState } from '@kernelfall/game/types'

export type GuideMoves = Pick<UseLevelActionsResult, 'next' | 'fixFirst' | 'acceptTaint' | 'respawn'>

export interface GuideActionsInput {
  readonly moves: GuideMoves
  readonly askReference: () => void
  /** Every objective is met but the run added Taint: the player picks. */
  readonly heldWithTaint: boolean
  /** The Next shortcut as the player's OS prints it ("⌥N", "Alt+N"). */
  readonly nextKeys: string
}

export function guideActionsOf(run: LevelRunState, input: GuideActionsInput): readonly GuideAction[] {
  const { moves, askReference, heldWithTaint, nextKeys } = input
  const next = (label: string): GuideAction => ({
    id: 'next',
    label,
    kind: 'primary',
    keys: nextKeys,
    onSelect: () => void moves.next(),
  })
  switch (run.phase) {
    case 'scene':
      return [
        next('Next: See it'),
        {
          id: 'skip',
          label: 'Skip to Build',
          kind: 'quiet',
          onSelect: () => {
            void moves.next()
            void moves.next()
          },
        },
      ]
    case 'see':
      return [next('Next: Build it')]
    case 'build': {
      // Objectives met with Taint: the player picks, no clock and no cost for trying again.
      const held: GuideAction[] = heldWithTaint
        ? [
            { id: 'fix-first', label: 'Fix it first', kind: 'primary', onSelect: () => void moves.fixFirst() },
            { id: 'accept-taint', label: 'Continue as is', kind: 'default', onSelect: () => void moves.acceptTaint() },
          ]
        : []
      // After the last hint, a quiet way on: never a dead end.
      return run.hintsRevealed >= HINT_TIERS.length
        ? [...held, { id: 'reference', label: "Continue with init's version", kind: 'default', onSelect: askReference }]
        : held
    }
    case 'oops':
      return [{ id: 'respawn', label: 'Restore and continue', kind: 'primary', onSelect: () => void moves.respawn() }]
    case 'watch':
      return [next('Next: the Codex card')]
    case 'card':
    case 'complete':
      return []
  }
}
