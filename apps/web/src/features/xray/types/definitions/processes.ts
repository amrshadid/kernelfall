import type { Stage } from './storyboard'

export interface EpisodeTask {
  readonly pid: number
  /** The program it runs, as `comm` names it. */
  readonly program: string
}

/** One child's life as one run's events tell it: fork, maybe execve, exit, reaped. */
export interface ProcessEpisode {
  /** Unique within the run: the fork call's id. */
  readonly key: string
  readonly parent: EpisodeTask
  /** The fork-family syscall the parent made. */
  readonly fork: {
    readonly id: number
    readonly name: string
    readonly nr: number
    /** The child's PID in the parent, or -errno. */
    readonly ret: number | null
    readonly errno: string | null
  }
  /** Null when the fork failed. */
  readonly child: number | null
  /** The child's first return to user mode, with 0, was seen. */
  readonly childReturned: boolean
  /** The child's first execve: where it went, and whether it worked. */
  readonly exec: {
    readonly nr: number
    readonly path: string
    readonly ret: number | null
    readonly errno: string | null
  } | null
  readonly childProgram: string
  /** Syscalls the child made after its execve (or after the fork, without one), exit excluded. */
  readonly work: readonly string[]
  readonly printed: string
  /** How it ended: an exit code, or the signal that killed it. */
  readonly exit: { readonly nr: number | null; readonly code: number; readonly signal: number | null } | null
  /** SIGCHLD reached the parent. */
  readonly sigchld: boolean
  /** The parent's wait4 that collected this child. */
  readonly wait: { readonly nr: number; readonly ret: number } | null
  /** The zombie was freed. `byParent` is false when someone else (init) reaped it. */
  readonly reaped: { readonly byParent: boolean } | null
}

export type ProcessStep =
  | 'fork'
  | 'forkfail'
  | 'copy'
  | 'memory'
  | 'returns'
  | 'execve'
  | 'execfail'
  | 'newprog'
  | 'runs'
  | 'exit'
  | 'wait'
  | 'reaped'
  | 'zombie'

/** A task's state letter as `ps` prints it, or gone once it has been reaped. */
export type PsState = 'R' | 'S' | 'Z' | 'gone'

export interface ProcessScene {
  readonly step: ProcessStep
  /** Which side of the Gate the story is on. */
  readonly ring: 0 | 3
  /** The syscall crossing the Gate now, if any. */
  readonly crossing: { readonly name: string; readonly nr: number; readonly by: 'parent' | 'child' } | null
  /** Who the red pointer marks. */
  readonly focus: 'parent' | 'child'
  readonly parentState: PsState
  /** Null before the child exists. */
  readonly childState: PsState | null
  readonly childProgram: string
  /** fork() has returned in both processes. */
  readonly forkReturned: boolean
  /** The child's memory: a copy of the parent's, a new program's, or freed. */
  readonly childMemory: 'copy' | 'new' | 'freed' | null
  readonly sigchld: boolean
  readonly collected: boolean
  readonly printed: boolean
  /** "In the kernel now": the function and its file. */
  readonly now: { readonly fn: string; readonly file: string }
}

export interface ProcessStoryboard {
  readonly key: string
  readonly episode: ProcessEpisode
  readonly stages: readonly Stage<ProcessScene>[]
}
