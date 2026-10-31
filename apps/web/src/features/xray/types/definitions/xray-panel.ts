import type { CpuLanesView } from './cpu-lanes'
import type { ProcessStoryboard } from './processes'
import type { RouteView } from './route'
import type { SectionView } from './section'
import type { PlaybackSpeed, Stage, XrayDepth, XrayLens } from './storyboard'
import type { LogRun } from './strace-log'
import type { SyscallStoryboard } from './syscalls'

export type XrayFigure =
  | { readonly kind: 'syscalls'; readonly storyboard: SyscallStoryboard }
  | { readonly kind: 'processes'; readonly storyboard: ProcessStoryboard }
  /** A whole run at once, with no stages to play. */
  | { readonly kind: 'section'; readonly view: SectionView; readonly commandLine: string }
  | { readonly kind: 'route'; readonly view: RouteView }
  | { readonly kind: 'cpus'; readonly view: CpuLanesView }

export interface XrayChoice<Id> {
  readonly id: Id
  readonly label: string
}

export interface XrayControls {
  readonly lenses: readonly XrayChoice<XrayLens>[]
  readonly lens: XrayLens
  readonly depth: XrayDepth
  readonly predict: boolean
  /** Recent commands, most recent last. */
  readonly runs: readonly XrayChoice<number>[]
  readonly runId: number | null
  /** The calls (Syscalls) or children (Processes) of the run to pick from. */
  readonly picks: readonly XrayChoice<string>[]
  readonly pickId: string | null
  /** What a pick is, for its legend: "Call" or "Child". */
  readonly pickLegend: string
  /** The selected run as strace prints it, for the Syscalls sequence. */
  readonly log: LogRun | null
  readonly expanded: boolean
}

export interface XrayControlActions {
  setLens(lens: XrayLens): void
  setDepth(depth: XrayDepth): void
  setPredict(on: boolean): void
  selectRun(id: number): void
  /** A call id or an episode key. */
  select(pick: string): void
  setExpanded(expanded: boolean): void
}

/** The player's X-ray choices: lens, depth, Predict, and which run and call to show. */
export interface XrayControlState extends XrayControlActions {
  readonly lens: XrayLens
  readonly depth: XrayDepth
  readonly predict: boolean
  /** The run picked by the player, or null to follow the latest. */
  readonly runId: number | null
  /** The call id or episode key picked, or null for the run's default. */
  readonly pick: string | null
  readonly expanded: boolean
}

export interface XrayPlayback {
  readonly stages: readonly Stage<unknown>[]
  readonly index: number
  readonly current: number
  readonly pending: number | null
  readonly playing: boolean
  readonly speed: PlaybackSpeed
  /** The guess made for the stage on show, if it had a Predict beat. */
  readonly shownGuess: string | null
  /** The guess picked so far for the pending stage. */
  readonly pendingGuess: string | null
}

export interface XrayPlaybackActions {
  goto(index: number): void
  forward(): void
  back(): void
  togglePlay(): void
  replay(): void
  setSpeed(speed: PlaybackSpeed): void
  guess(option: string): void
  reveal(): void
}
