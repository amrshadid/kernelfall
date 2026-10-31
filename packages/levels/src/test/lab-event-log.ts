import type { LabEvent, LabEventInit } from '@kernelfall/machine/events'
import type { Pid } from '@kernelfall/machine/types'
import { AT_FDCWD, SIGCHLD, SYSCALL_NUMBERS } from '@kernelfall/machine/types'

const nrOf = (name: string): number => SYSCALL_NUMBERS[name] ?? -1

/** Where a fake user buffer sits; checkers never read it. */
const BUFFER = 0x10000

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

/**
 * Builds the lab events of one command line, in the order the lab emits them, for
 * a checker's edge cases; reference solutions are played on the real Machine instead.
 */
export class LabEventLog {
  readonly #events: LabEvent[] = []

  get events(): readonly LabEvent[] {
    return this.#events
  }

  #emit(event: LabEventInit): void {
    this.#events.push({ ...event, seq: this.#events.length, time: 0 } as LabEvent)
  }

  /** One syscall that returned: `data` is the path or buffer it read, `out` the buffer it filled. */
  call(
    pid: Pid,
    name: string,
    args: readonly number[],
    ret: number,
    { data, out }: { readonly data?: string; readonly out?: string } = {}
  ): this {
    const nr = nrOf(name)
    this.#emit({ type: 'sys_enter', pid, nr, name, args, ...(data === undefined ? {} : { data: bytes(data) }) })
    this.#emit({ type: 'sys_exit', pid, nr, name, ret, ...(out === undefined ? {} : { data: bytes(out) }) })
    return this
  }

  /** `parent` forks `child`, which runs `filename`, as the shell starts a command. */
  spawn(parent: Pid, child: Pid, filename: string): this {
    this.#emit({ type: 'sched_process_fork', parentPid: parent, childPid: child })
    this.#emit({ type: 'sched_process_exec', pid: child, oldPid: child, filename })
    return this
  }

  /** `pid` becomes `filename` through execve(), without a fork: PID 1 handing over to /sbin/init. */
  exec(pid: Pid, filename: string): this {
    this.#emit({ type: 'sched_process_exec', pid, oldPid: pid, filename })
    return this
  }

  /** A whole write() on `fd`; what reaches fd 1 or 2 shows on the console. */
  write(pid: Pid, fd: number, text: string): this {
    const nr = nrOf('write')
    this.#emit({ type: 'sys_enter', pid, nr, name: 'write', args: [fd, BUFFER, text.length], data: bytes(text) })
    if (fd === 1 || fd === 2) {
      this.#emit({ type: 'console_write', bytes: bytes(text) })
    }
    this.#emit({ type: 'sys_exit', pid, nr, name: 'write', ret: text.length })
    return this
  }

  /** openat(AT_FDCWD, path, O_RDONLY) answered with `ret`, then one read() of `text` if it opened. */
  readFile(pid: Pid, path: string, text: string, fd = 3): this {
    this.call(pid, 'openat', [AT_FDCWD, BUFFER, 0], fd, { data: path })
    return this.call(pid, 'read', [fd, BUFFER, text.length], text.length, { out: text })
  }

  /** readlinkat(AT_FDCWD, path, buf, size) answered with `target`. */
  readLink(pid: Pid, path: string, target: string): this {
    return this.call(pid, 'readlinkat', [AT_FDCWD, BUFFER, BUFFER, 4096], target.length, { data: path, out: target })
  }

  /** `pid` exits with `code`, or is killed by `signal`, and `parent` reaps it. */
  exit(pid: Pid, parent: Pid, { code = 0, signal }: { readonly code?: number; readonly signal?: number } = {}): this {
    if (signal === undefined) {
      this.#emit({ type: 'sys_enter', pid, nr: nrOf('exit_group'), name: 'exit_group', args: [code] })
    }
    this.#emit({
      type: 'sched_process_exit',
      pid,
      code: signal === undefined ? code : 0,
      ...(signal === undefined ? {} : { signal }),
    })
    this.#emit({ type: 'signal_generate', pid: parent, sig: SIGCHLD, result: 'delivered' })
    this.#emit({ type: 'sys_enter', pid: parent, nr: nrOf('wait4'), name: 'wait4', args: [pid, 0, 0, 0] })
    this.#emit({ type: 'sched_process_free', pid })
    this.#emit({ type: 'sys_exit', pid: parent, nr: nrOf('wait4'), name: 'wait4', ret: pid })
    return this
  }
}
