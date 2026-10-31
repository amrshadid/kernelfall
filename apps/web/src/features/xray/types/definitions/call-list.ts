import type { XrayCall } from './xray-call'

/** Calls a level teaches: by name, in any process or only in `program`. */
export interface CallFocusRule {
  readonly names: readonly string[]
  readonly program?: string
}

export type CallFocus = readonly CallFocusRule[]

/** Why calls were folded into one row. */
export type CallFoldKind = 'start-up' | 'bookkeeping' | 'path-search' | 'terminfo' | 'repeat' | 'summary'

export interface CallFold {
  /** Stable across re-renders of the same run: the first call's id. */
  readonly key: string
  readonly fold: CallFoldKind
  /** e.g. "start-up", "looks up echo in PATH", "writev". */
  readonly label: string
  readonly calls: readonly XrayCall[]
  /** Holds a call the level teaches. */
  readonly focused: boolean
}

export type CallRow =
  | { readonly kind: 'call'; readonly call: XrayCall; readonly focused: boolean }
  | ({ readonly kind: 'fold' } & CallFold)

/** `shell`: the player's bash; `program`: a child that ran a program; `subshell`: a child that never did. */
export type CallGroupRole = 'shell' | 'program' | 'subshell'

/** One process of the run and its calls, in the order it made them. */
export interface CallGroup {
  readonly key: string
  readonly pid: number
  readonly role: CallGroupRole
  /** e.g. "the program (echo, PID 491)". */
  readonly title: string
  /** Its life in the kernel's words: `forked by PID 480`, `execve /bin/echo`, `exit 0`, `fork → PID 491`. */
  readonly facts: readonly string[]
  readonly count: number
  readonly rows: readonly CallRow[]
  readonly focused: boolean
  readonly focusedCalls: readonly XrayCall[]
  /** Open in Simple depth before the player touches it. */
  readonly open: boolean
}

export type CallRowView =
  | { readonly kind: 'call'; readonly call: XrayCall; readonly focused: boolean }
  | ({
      readonly kind: 'fold'
      readonly open: boolean
      /** The calls drawn when open; a long fold leaves the rest to the strace sequence. */
      readonly shown: readonly XrayCall[]
      readonly hidden: number
    } & CallFold)

export interface CallGroupView extends Omit<CallGroup, 'rows' | 'open'> {
  readonly open: boolean
  /** Empty while the command runs: only the counts move. */
  readonly rows: readonly CallRowView[]
}

export interface CallListView {
  readonly live: boolean
  readonly groups: readonly CallGroupView[]
}
