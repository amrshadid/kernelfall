import type { StorageIssue } from './save'

export interface ScreenChrome {
  /** The theme the button switches to: "Night print" or "Day print". */
  readonly themeLabel: string
  readonly onToggleTheme: () => void
  readonly storageIssue: StorageIssue | null
  readonly onExport: () => void
  /** `null` when the screen has no tour. */
  readonly onTour: (() => void) | null
}
