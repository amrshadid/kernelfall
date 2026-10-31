// Text from content/xray/*.yaml may hold `{name}` placeholders, filled from the
// call or child on show, and marks real terms with backticks.

/** Which storyboard a syscall gets: write, exit, execve, fork and wait have their own stages. */
export const XRAY_CALL_FAMILIES = ['write', 'exit', 'execve', 'fork', 'wait', 'generic'] as const
export type XrayCallFamily = (typeof XRAY_CALL_FAMILIES)[number]

/** A file in the Linux tree a stage is checked against, and the function in it. */
export interface XraySource {
  readonly path: string
  readonly fn?: string
}

export interface XraySyscall {
  readonly name: string
  readonly family: XrayCallFamily
  /** Argument names as in the kernel's SYSCALL_DEFINE, in register order. */
  readonly args: readonly string[]
  /** Arguments that are user-space addresses, printed in hex. */
  readonly pointers: readonly number[]
  /** The argument that is a path the lab copies at entry (execve's filename), if any. */
  readonly pathArg: number | null
  /** The kernel functions after `x64_sys_call`, outermost first. */
  readonly path: readonly string[]
  readonly sources: readonly XraySource[]
  /** One plain sentence for the "In the kernel now" desk at Simple. */
  readonly desk: string
  /** What a successful return value is, for the narration ("the number of bytes written"). */
  readonly returns: string | null
}

/** A Predict beat's text; the options and answer come from the call when they are numbers. */
export interface XrayPredictText {
  readonly question: string
  readonly explain: string
  readonly answer?: string
  readonly options?: readonly string[]
}

/** "In the kernel now": the function, a plain sentence, and its file. */
export interface XrayDesk {
  readonly fn: string
  readonly say: string
  readonly file: string
}

/** Fields hold templates. */
export interface XrayStageText {
  /** A word or two for the transport's tick. */
  readonly tick: string
  readonly title: string
  /** What happens. */
  readonly what: string
  /** Why the kernel does it this way. */
  readonly why: string
  /** One more step down. */
  readonly deeper: string
  /** The Gatekeeper's line, at Simple, for stages at the Gate. */
  readonly gate?: string
  /** Where the lab differs from Linux here. */
  readonly simplified?: string
  /** Left out: the syscall's own sources. */
  readonly sources?: readonly XraySource[]
  readonly predict?: XrayPredictText
  /** The Processes view's "In the kernel now" (its `say` is unused). */
  readonly now?: Omit<XrayDesk, 'say'>
}

/** Every stage the Syscalls view tells, with its variants. */
export const SYSCALL_STAGE_KEYS = [
  'call',
  'registers',
  'gate',
  'entry',
  'dispatch',
  'fd',
  'fd-console',
  'fd-ebadf',
  'copy',
  'copy-console',
  'copy-efault',
  'driver',
  'execve',
  'execve-failed',
  'fork',
  'fork-failed',
  'wait',
  'wait-none',
  'wait-failed',
  'work',
  'exit',
  'noreturn',
  'answer',
  'answer-write',
  'answer-fork',
  'answer-error',
  'answer-error-write',
  'answer-pending',
  'answer-killed',
  'sysret',
  'sysret-exec',
] as const
export type SyscallStageKey = (typeof SYSCALL_STAGE_KEYS)[number]

/** Every stage the Processes view tells, with its variants. */
export const PROCESS_STAGE_KEYS = [
  'fork',
  'forkfail',
  'copy',
  'memory',
  'returns',
  'execve',
  'execfail',
  'newprog',
  'runs',
  'exit',
  'exit-killed',
  'wait',
  'reaped',
  'reaped-by-init',
  'zombie',
] as const
export type ProcessStageKey = (typeof PROCESS_STAGE_KEYS)[number]

/** The Syscalls view's "In the kernel now" lines, by step and variant. */
export const SYSCALL_DESK_KEYS = [
  'call',
  'registers',
  'gate',
  'entry',
  'dispatch',
  'fd',
  'fd-console',
  'fd-ebadf',
  'copy',
  'copy-console',
  'driver',
  'noreturn',
  'answer',
  'answer-none',
  'sysret',
] as const
export type SyscallDeskKey = (typeof SYSCALL_DESK_KEYS)[number]

/** A fragment is inserted exactly as written, so it carries its own leading space or comma. */
export const NARRATION_PART_KEYS = [
  'unknown-desk',
  'why-ask-write',
  'why-ask-exit',
  'why-ask-execve',
  'why-ask-fork',
  'why-ask-wait',
  'why-ask-generic',
  'clone-note',
  'argument',
  'arguments',
  'no-arguments',
  'buffer-stays',
  'rlimit-nproc',
  'group-exit',
  'return-meaning',
  'wait-none-meaning',
  'short-write',
  'write-predict-error',
  'write-predict-full',
  'write-predict-short',
  'via-clone',
  'via-fork',
  'parent-waits',
  'prints',
  'sigchld',
  'status-killed',
  'status-exited',
] as const
export type NarrationPartKey = (typeof NARRATION_PART_KEYS)[number]

/** Everything X-ray's storyboards say, checked at load. */
export interface XrayNarration {
  readonly parts: Readonly<Record<NarrationPartKey, string>>
  readonly desks: Readonly<Record<SyscallDeskKey, XrayDesk>>
  readonly syscallStages: Readonly<Record<SyscallStageKey, XrayStageText>>
  readonly processStages: Readonly<Record<ProcessStageKey, XrayStageText>>
}

export interface XrayContent {
  readonly syscalls: ReadonlyMap<string, XraySyscall>
  readonly narration: XrayNarration
}

/** The two files, as text. */
export interface XrayContentFiles {
  readonly syscalls: string
  readonly narration: string
}

export type TemplateValues = Readonly<Record<string, string | number>>
