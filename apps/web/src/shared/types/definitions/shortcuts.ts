import type { KeyBinding } from './keys'

export type ShortcutGroup = 'Game' | 'Terminal'

export type ShortcutId =
  | 'save'
  | 'next-step'
  | 'previous-step'
  | 'hint'
  | 'focus-xray'
  | 'focus-editor'
  | 'focus-terminal'
  | 'focus-guide'
  | 'cheat-sheet'

/** Game rows also drive the key handler, so the cheat sheet can't go stale. */
export interface Shortcut {
  readonly id: ShortcutId | null
  readonly group: ShortcutGroup
  readonly action: string
  readonly binding: KeyBinding
}
