export type Pid = number

/** init's pid: the first task, and the reaper that adopts orphans. */
export const INIT_PID = 1

// models include/linux/threads.h: PID_MAX_DEFAULT, where pid numbers wrap around (/proc/sys/kernel/pid_max)
export const PID_MAX_DEFAULT = 0x8000

/** Who a task acts as, for permission checks. Models struct cred (include/linux/cred.h). */
export interface Cred {
  readonly uid: number
  readonly gid: number
  readonly groups: readonly number[]
}
