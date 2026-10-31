import { useShortcut } from '@features/shortcuts/hooks/keys'
import type { UseLevelActionsResult } from '@kernelfall/game/hooks'
import type { StepId } from '@shared/types'

export interface UseLevelShortcutsOptions {
  /** Off until the run is ready. */
  readonly enabled: boolean
  readonly canNext: boolean
  readonly canHint: boolean
  readonly actions: Pick<UseLevelActionsResult, 'next' | 'revealHint'>
  /** The steps already done, in order. */
  readonly doneSteps: readonly StepId[]
  readonly reviewing: StepId | null
  readonly review: (stepId: StepId) => void
}

// The panel ids are the level layout's landmarks; the selector picks the control inside to focus.
function focusById(id: string, selector?: string): void {
  const root = document.getElementById(id)
  const target = selector ? root?.querySelector<HTMLElement>(selector) : root
  ;(target ?? root)?.focus()
}

export function useLevelShortcuts({
  enabled,
  canNext,
  canHint,
  actions,
  doneSteps,
  reviewing,
  review,
}: UseLevelShortcutsOptions): void {
  useShortcut('next-step', () => canNext && void actions.next(), enabled)
  useShortcut('hint', () => canHint && void actions.revealHint(), enabled)
  useShortcut('previous-step', () => {
    const from = reviewing ? doneSteps.indexOf(reviewing) : doneSteps.length
    const previous = doneSteps[from - 1]
    if (previous) {
      review(previous)
    }
  })
  useShortcut('focus-guide', () => focusById('level-guide'))
  useShortcut('focus-xray', () => focusById('level-xray'))
  useShortcut('focus-editor', () => focusById('level-editor', 'textarea, [contenteditable], button'))
  useShortcut('focus-terminal', () => focusById('level-terminal', 'textarea'))
}
