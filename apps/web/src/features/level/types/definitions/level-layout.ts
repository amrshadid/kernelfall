import type {
  CodexCardData,
  PanelId,
  PanelSizes,
  RailStep,
  SaveState,
  ScreenChrome,
  StepId,
  TitleBlockEntry,
} from '@shared/types'
import type { ReactNode } from 'react'

/** A line of the Guide's transcript; `speaker` is the name as written in story.md. */
export interface GuideLine {
  readonly speaker: string | null
  readonly text: string
}

export interface GuideObjective {
  readonly id: string
  readonly text: string
  readonly passed: boolean
}

/** The checker's verdict so far: which objectives no run has shown yet. */
export interface GuideCheckReport {
  /** e.g. "Run 3 · 2 of 4 met". */
  readonly heading: string
  readonly missing: readonly string[]
  /** Taint the last run would add, by rule, e.g. "zombies-left: 1 of 10 children…". */
  readonly taint: readonly string[]
  /** init's word when every objective is met but the run added Taint; null otherwise. */
  readonly held: string | null
}

export interface GuideHint {
  /** "a nudge", "the concept", "the spot". */
  readonly tier: string
  readonly text: string
}

export interface GuideAction {
  readonly id: string
  readonly label: string
  readonly kind: 'primary' | 'default' | 'quiet'
  /** Shortcut shown on the button, as the player's OS prints it ("⌥N", "Alt+N"). */
  readonly keys?: string
  onSelect(): void
}

/** A command the level offers while building, with what it does. */
export interface GuideChip {
  readonly command: string
  readonly explain: string
  /** A whole command line runs in the terminal on a click; a bare name only names the tool. */
  onRun: (() => void) | null
}

/** init's offer to show the region with a few tasks instead of playing it. */
export interface GuidePlacement {
  readonly offer: string
  readonly minutes: number
  readonly href: string
}

export interface LevelTopBarData {
  readonly mapHref: string
  readonly heading: string
  readonly subheading: string
  readonly steps: readonly RailStep[]
  readonly currentIndex: number
  readonly reviewing: string | null
  onReview(stepId: string): void
  readonly taint: number
  onOpenTaint(): void
  readonly hintsLeft: number
  readonly hintOffered: boolean
  readonly hintEnabled: boolean
  onHint(): void
  onReplay(): void
}

export interface LevelGuide {
  readonly stepLabel: string
  /** Set while looking back at a done step. */
  readonly reviewNote: string | null
  readonly lines: readonly GuideLine[]
  readonly code: readonly string[]
  readonly showObjectives: boolean
  readonly objectives: readonly GuideObjective[]
  /** What the checker said about the last run, while building; null before the first one. */
  readonly checkReport: GuideCheckReport | null
  /** While building only. */
  readonly chips: readonly GuideChip[]
  /** On the scene of a region's first level, before any of its levels is started. */
  readonly placement: GuidePlacement | null
  readonly hints: readonly GuideHint[]
  readonly seeAlso: readonly { readonly term: string; readonly href: string }[]
  readonly codex: readonly { readonly id: string; readonly term: string; readonly href: string }[]
  readonly actions: readonly GuideAction[]
  readonly note: string | null
}

export interface LevelCard {
  readonly cards: readonly CodexCardData[]
  readonly simplified: readonly string[]
  readonly seenIn: string
  readonly headline: string
  readonly result: string
  readonly next: { readonly label: string; onSelect(): void } | null
  onMap(): void
  onReplay(): void
}

export interface TaintReport {
  readonly open: boolean
  onClose(): void
  readonly entries: readonly {
    readonly id: string
    readonly points: number
    readonly detail: string
  }[]
}

export interface ConfirmDialog {
  readonly open: boolean
  onConfirm(): void
  onCancel(): void
}

export interface LevelStatusBar {
  readonly save: SaveState
  readonly savedAgoMs: number | null
  /** Where the Linux VM is, e.g. "Linux: running". */
  readonly machine: string
  onShortcuts(): void
}

export interface LevelSlots {
  readonly editor: ReactNode
  readonly terminal: ReactNode
  readonly xray: ReactNode
}

export interface LevelPanels {
  readonly editor: boolean
  readonly xray: boolean
  /** Scene dims the workspace; See it emphasizes X-ray. */
  readonly emphasis: 'scene' | 'see' | 'build' | 'watch' | 'card'
}

/** The sizes the player dragged the dividers to, and how to change them. */
export interface PanelLayout {
  readonly sizes: PanelSizes
  /** Null puts the panel back to its default size. */
  readonly onResize: (panel: PanelId, size: number | null) => void
}

/** Everything the level layout draws. */
export interface LevelLayoutModel {
  readonly chrome: ScreenChrome
  readonly panelSizes: PanelLayout
  /** The running head's page name, e.g. `Run Anything(1.4)`. */
  readonly page: string
  readonly volume: string
  readonly bar: LevelTopBarData
  readonly guide: LevelGuide
  readonly panels: LevelPanels
  readonly slots: LevelSlots
  readonly terminalLabel: string
  /** What the Linux VM is doing or why it failed, or null when there is nothing to say. */
  readonly terminalStatus: string | null
  readonly titleBlock: readonly TitleBlockEntry[]
  readonly card: LevelCard | null
  readonly taintReport: TaintReport
  readonly reference: ConfirmDialog
  readonly replay: ConfirmDialog
  readonly status: LevelStatusBar
}

/** The level screen's view state and its setters. */
export interface LevelDialogs {
  /** A done step looked back at; null on the current one. */
  readonly reviewing: StepId | null
  readonly review: (stepId: StepId | null) => void
  /** Looks back at a step, or returns from it when it is already shown. */
  readonly toggleReview: (stepId: StepId) => void
  readonly taintOpen: boolean
  readonly setTaintOpen: (open: boolean) => void
  readonly referenceOpen: boolean
  readonly setReferenceOpen: (open: boolean) => void
  readonly replayOpen: boolean
  readonly setReplayOpen: (open: boolean) => void
}
