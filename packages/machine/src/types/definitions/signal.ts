// models arch/x86/include/uapi/asm/signal.h

export const SIGHUP = 1
export const SIGINT = 2
export const SIGQUIT = 3
export const SIGILL = 4
export const SIGTRAP = 5
export const SIGABRT = 6
export const SIGBUS = 7
export const SIGFPE = 8
export const SIGKILL = 9
export const SIGUSR1 = 10
export const SIGSEGV = 11
export const SIGUSR2 = 12
export const SIGPIPE = 13
export const SIGALRM = 14
export const SIGTERM = 15
export const SIGSTKFLT = 16
export const SIGCHLD = 17
export const SIGCONT = 18
export const SIGSTOP = 19
export const SIGTSTP = 20
export const SIGTTIN = 21
export const SIGTTOU = 22
export const SIGURG = 23
export const SIGXCPU = 24
export const SIGXFSZ = 25
export const SIGVTALRM = 26
export const SIGPROF = 27
export const SIGWINCH = 28
export const SIGIO = 29
export const SIGPWR = 30
export const SIGSYS = 31

/** Signal names by number, as strace and kill -l print them. */
export const SIGNAL_NAMES: ReadonlyMap<number, string> = new Map([
  [SIGHUP, 'SIGHUP'],
  [SIGINT, 'SIGINT'],
  [SIGQUIT, 'SIGQUIT'],
  [SIGILL, 'SIGILL'],
  [SIGTRAP, 'SIGTRAP'],
  [SIGABRT, 'SIGABRT'],
  [SIGBUS, 'SIGBUS'],
  [SIGFPE, 'SIGFPE'],
  [SIGKILL, 'SIGKILL'],
  [SIGUSR1, 'SIGUSR1'],
  [SIGSEGV, 'SIGSEGV'],
  [SIGUSR2, 'SIGUSR2'],
  [SIGPIPE, 'SIGPIPE'],
  [SIGALRM, 'SIGALRM'],
  [SIGTERM, 'SIGTERM'],
  [SIGSTKFLT, 'SIGSTKFLT'],
  [SIGCHLD, 'SIGCHLD'],
  [SIGCONT, 'SIGCONT'],
  [SIGSTOP, 'SIGSTOP'],
  [SIGTSTP, 'SIGTSTP'],
  [SIGTTIN, 'SIGTTIN'],
  [SIGTTOU, 'SIGTTOU'],
  [SIGURG, 'SIGURG'],
  [SIGXCPU, 'SIGXCPU'],
  [SIGXFSZ, 'SIGXFSZ'],
  [SIGVTALRM, 'SIGVTALRM'],
  [SIGPROF, 'SIGPROF'],
  [SIGWINCH, 'SIGWINCH'],
  [SIGIO, 'SIGIO'],
  [SIGPWR, 'SIGPWR'],
  [SIGSYS, 'SIGSYS'],
])

// models include/trace/events/signal.h: enum trace_signal_result, the cases X-ray draws
export type SignalGenerateResult = 'delivered' | 'ignored' | 'already_pending'
