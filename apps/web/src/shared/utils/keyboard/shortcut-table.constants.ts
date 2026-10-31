import type { KeyBinding, Shortcut } from '@shared/types'

/** The editor's own keys (CodeMirror handles them), shared with its button labels. */
export const RUN_BINDING: KeyBinding = { code: 'Enter', mod: true }
export const FORMAT_BINDING: KeyBinding = { code: 'KeyF', alt: true, shift: true }

/** Terminal rows have no id: they belong to the shell, listed so players know the game never takes them. */
export const SHORTCUTS: readonly Shortcut[] = [
  { id: 'save', group: 'Game', action: 'Save now', binding: { code: 'KeyS', mod: true } },
  // The editor handles these itself, so they have no id here: listed so players find them.
  { id: null, group: 'Game', action: 'Run (in the editor)', binding: RUN_BINDING },
  { id: null, group: 'Game', action: 'Format the file, kernel style (in the editor)', binding: FORMAT_BINDING },
  { id: 'next-step', group: 'Game', action: 'Next step', binding: { code: 'KeyN', alt: true } },
  {
    id: 'previous-step',
    group: 'Game',
    action: 'Look at the previous step',
    binding: { code: 'KeyP', alt: true },
  },
  { id: 'hint', group: 'Game', action: 'Hint', binding: { code: 'KeyH', alt: true } },
  { id: 'focus-xray', group: 'Game', action: 'Focus X-ray', binding: { code: 'KeyX', alt: true } },
  {
    id: 'focus-editor',
    group: 'Game',
    action: 'Focus editor',
    binding: { code: 'KeyE', alt: true },
  },
  {
    id: 'focus-terminal',
    group: 'Game',
    action: 'Focus terminal',
    binding: { code: 'KeyT', alt: true },
  },
  { id: 'focus-guide', group: 'Game', action: 'Focus Guide', binding: { code: 'KeyG', alt: true } },
  {
    id: 'cheat-sheet',
    group: 'Game',
    action: 'Shortcut cheat sheet (or ? outside text)',
    // Not Cmd+Shift+/: that is ⌘?, which macOS gives to the browser's Help menu, so the page never sees it.
    binding: { code: 'Slash', alt: true },
  },
  {
    id: null,
    group: 'Terminal',
    action: 'Interrupt the program (SIGINT)',
    binding: { code: 'KeyC', mod: false },
  },
  { id: null, group: 'Terminal', action: 'End of input (EOF)', binding: { code: 'KeyD' } },
  { id: null, group: 'Terminal', action: 'Clear the screen', binding: { code: 'KeyL' } },
  { id: null, group: 'Terminal', action: 'Previous command', binding: { code: 'ArrowUp' } },
]

/** Terminal rows are pressed with Ctrl on every system, as in a real terminal. */
export const TERMINAL_MODIFIER = 'Ctrl'
