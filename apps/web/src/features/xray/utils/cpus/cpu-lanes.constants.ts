import { SIGCONT, SIGSTOP, SIGTSTP, SIGTTIN, SIGTTOU } from '@kernelfall/machine/types'

/** Calls a task sleeps in (state S) while they wait: for input, a child, or time. */
export const SLEEPING_CALLS = new Set(['read', 'wait4', 'nanosleep', 'clock_nanosleep', 'pause', 'poll', 'select'])

/** Signals whose default action stops a task (state T). */
export const STOP_SIGNALS = new Set([SIGSTOP, SIGTSTP, SIGTTIN, SIGTTOU])

export const CONTINUE_SIGNAL = SIGCONT
