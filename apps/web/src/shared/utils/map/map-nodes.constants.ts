import type { NodeState } from '@shared/types'

export const DONE_STATES: ReadonlySet<NodeState> = new Set(['done', 'clean', 'helped'])

/** How a stop's state is spoken and printed. */
export const STATUS_WORDS: Readonly<Record<NodeState, string>> = {
  locked: 'locked',
  available: 'available',
  progress: 'in progress',
  done: 'done',
  clean: 'done, no Taint',
  helped: "done with init's version",
}
