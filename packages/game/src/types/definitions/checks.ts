/** `objectives[].check.kind` in level.yaml; anything else goes in the level's `checker.ts`. */
export const OBJECTIVE_CHECK_KINDS = [
  'compiles',
  'build-fixed',
  'exit-status',
  'wrote',
  'terminal',
  'syscall',
  'no-zombies-after',
  'ran',
  'read-to-end',
] as const

/** `taint[].check.kind` in level.yaml. */
export const TAINT_CHECK_KINDS = ['unreaped-children', 'ran-program'] as const

/** The exit status range a process can leave behind: the low 8 bits of exit()'s argument. */
export const MAX_EXIT_STATUS = 255

/** How a check names a syscall: as the kernel's syscall table does, e.g. `openat`, `exit_group`. */
export const SYSCALL_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/

/** How a check names a program: its file name, as `basename` of the path it was run from. */
export const PROGRAM_NAME_PATTERN = /^[A-Za-z0-9._+-]+$/

export type ObjectiveCheckKind = (typeof OBJECTIVE_CHECK_KINDS)[number]
export type TaintCheckKind = (typeof TAINT_CHECK_KINDS)[number]

/** How a check names a file: an absolute path, as a program passes it to openat(). */
export const ABSOLUTE_PATH_PATTERN = /^\/\S*$/

/** Conditions on text; every one given must hold, and at least one is given. */
export interface TextMatch {
  readonly equals?: string
  readonly notEquals?: string
  readonly contains?: string
  readonly notContains?: string
  readonly endsWith?: string
}

/** Conditions on the arguments a program was started with: `argv` after its name. */
export interface ArgsMatch {
  /** At least this many arguments. */
  readonly min?: number
  /** Regular expressions; each must match at least one argument (`^-[a-z]{2,}$`: options joined in one word). */
  readonly match?: readonly string[]
}

/** Left out: the player's own programs (run from outside /bin). `ls` matches `/bin/ls`. */
export interface ProgramScope {
  readonly program?: string
}

export type ObjectiveCheck =
  /** A program the player built ran: only a program that compiled and linked can be run. */
  | { readonly kind: 'compiles' }
  /** A build failed with an error earlier in the play-through, and the latest one built. */
  | { readonly kind: 'build-fixed' }
  /** A judged process exited normally (no signal) with `status`. */
  | ({ readonly kind: 'exit-status'; readonly status: number } & ProgramScope)
  /**
   * A judged process made a write() on `fd` that the kernel took in full, and the
   * bytes of its writes on `fd`, joined, match `text` (if given).
   */
  | ({ readonly kind: 'wrote'; readonly fd: number; readonly text?: TextMatch } & ProgramScope)
  /** What reached the terminal while a judged process ran, from its execve() to its exit, matches `text`. */
  | ({ readonly kind: 'terminal'; readonly text: TextMatch } & ProgramScope)
  /**
   * A judged process called one of `names` and it returned `ret`, or failed with
   * `errno`; with neither, any return counts.
   */
  | ({
      readonly kind: 'syscall'
      readonly names: readonly string[]
      readonly ret?: number
      /** Positive, as in errno; `level.yaml` writes it by name (`EAGAIN`). */
      readonly errno?: number
    } & ProgramScope)
  /** A judged process forked at least `commands` children and waited for every one before it ended. */
  | ({ readonly kind: 'no-zombies-after'; readonly commands: number } & ProgramScope)
  /**
   * A judged process was started through execve() with arguments that match
   * `args` (if given), and exited normally with `status` (if given).
   */
  | ({ readonly kind: 'ran'; readonly args?: ArgsMatch; readonly status?: number } & ProgramScope)
  /**
   * A judged process opened `path` and read it until the kernel answered 0, end
   * of file: read() for a file, getdents64() for a folder. With `text`, the bytes
   * its reads returned match it.
   */
  | ({ readonly kind: 'read-to-end'; readonly path: string; readonly text?: TextMatch } & ProgramScope)

export type TaintCheck =
  /** A judged process forked a child it never waited for. */
  | ({ readonly kind: 'unreaped-children' } & ProgramScope)
  /** A process other than a judged one ran one of `programs` (by name), e.g. a shell started by system(). */
  | ({ readonly kind: 'ran-program'; readonly programs: readonly string[] } & ProgramScope)
