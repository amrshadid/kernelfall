import type { ProcessEpisode } from '@features/xray/types'
import { baseName, programOf } from '@features/xray/utils/calls'
import type { RunEvent } from '@kernelfall/machine/hooks'
import type { TraceRun } from '@kernelfall/machine/types'
import { ERRNO_TABLE, SIGCHLD } from '@kernelfall/machine/types'
import { isErrorReturn } from '@kernelfall/machine/utils'

const FORKS = new Set(['clone', 'fork', 'vfork'])
const EXITS = new Set(['exit', 'exit_group'])
const decoder = new TextDecoder()

type Mutable<T> = { -readonly [K in keyof T]: T[K] }
// Pushed to, never copied: a child like `find /` makes tens of thousands of calls.
type Draft = Mutable<ProcessEpisode> & { work: string[] }

const errnoOf = (ret: number) => (isErrorReturn(ret) ? (ERRNO_TABLE.get(-ret)?.name ?? `errno ${-ret}`) : null)

/** Reaped, or the fork failed. */
export function isEpisodeOver(episode: ProcessEpisode): boolean {
  return episode.child === null ? episode.fork.ret !== null : episode.reaped !== null
}

/** Built only from the trace's events, in the order they happened. */
export function processEpisodes(run: TraceRun, events: readonly RunEvent[]): readonly ProcessEpisode[] {
  const first = programOf(run.commandLine)
  const programs = new Map<number, string>()
  const traced = new Set<number>()
  if (run.pid !== null) {
    programs.set(run.pid, first)
    traced.add(run.pid)
  }
  const episodes: Draft[] = []
  const forking = new Map<number, Draft>()
  const byChild = new Map<number, Draft>()
  const exitCall = new Map<number, number>()
  let writing: Draft | null = null

  for (const event of events) {
    switch (event.type) {
      case 'sys_enter': {
        if (!traced.has(event.pid)) {
          break
        }
        if (FORKS.has(event.name)) {
          const draft: Draft = {
            key: `fork:${event.seq}`,
            parent: { pid: event.pid, program: programs.get(event.pid) ?? first },
            fork: { id: event.seq, name: event.name, nr: event.nr, ret: null, errno: null },
            child: null,
            childReturned: false,
            exec: null,
            childProgram: programs.get(event.pid) ?? first,
            work: [],
            printed: '',
            exit: null,
            sigchld: false,
            wait: null,
            reaped: null,
          }
          episodes.push(draft)
          forking.set(event.pid, draft)
        }
        const mine = byChild.get(event.pid)
        writing = event.name === 'write' && mine ? mine : null
        if (!mine) {
          break
        }
        if (event.name === 'execve' && mine.exec === null) {
          mine.exec = { nr: event.nr, path: event.data ? decoder.decode(event.data) : '?', ret: null, errno: null }
        } else if (EXITS.has(event.name)) {
          exitCall.set(event.pid, event.nr)
        } else if (!FORKS.has(event.name)) {
          // After a failed execve the child is still the parent's program; its calls still count.
          mine.work.push(event.name)
        }
        break
      }
      case 'sys_exit': {
        writing = null
        const parentFork = forking.get(event.pid)
        if (FORKS.has(event.name) && parentFork) {
          forking.delete(event.pid)
          parentFork.fork = { ...parentFork.fork, ret: event.ret, errno: errnoOf(event.ret) }
          break
        }
        const mine = byChild.get(event.pid)
        if (!mine) {
          break
        }
        if (FORKS.has(event.name) && event.ret === 0) {
          mine.childReturned = true
        } else if (event.name === 'execve' && mine.exec && mine.exec.ret === null) {
          mine.exec = { ...mine.exec, ret: event.ret, errno: errnoOf(event.ret) }
        }
        break
      }
      case 'sched_process_fork': {
        if (!traced.has(event.parentPid)) {
          break
        }
        traced.add(event.childPid)
        programs.set(event.childPid, programs.get(event.parentPid) ?? first)
        const draft = forking.get(event.parentPid)
        if (draft) {
          draft.child = event.childPid
          byChild.set(event.childPid, draft)
        }
        break
      }
      case 'sched_process_exec': {
        programs.set(event.pid, baseName(event.filename))
        const mine = byChild.get(event.pid)
        if (mine) {
          mine.childProgram = baseName(event.filename)
          // What it did before is the old program's; the story follows the new one.
          mine.work = []
        }
        break
      }
      case 'sched_process_exit': {
        const mine = byChild.get(event.pid)
        if (mine) {
          mine.exit = { nr: exitCall.get(event.pid) ?? null, code: event.code, signal: event.signal ?? null }
        }
        break
      }
      case 'signal_generate': {
        if (event.sig !== SIGCHLD) {
          break
        }
        // The parent hears about the child that exited most recently.
        const told = episodes.findLast((e) => e.parent.pid === event.pid && e.exit !== null && !e.sigchld)
        if (told) {
          told.sigchld = true
        }
        break
      }
      case 'console_write':
        if (writing) {
          writing.printed += decoder.decode(event.bytes)
        }
        break
      case 'sched_process_free': {
        const mine = byChild.get(event.pid)
        if (mine) {
          mine.reaped = { byParent: false }
        }
        break
      }
      default:
        break
    }
    if (event.type === 'sys_exit' && event.name === 'wait4' && event.ret > 0) {
      const mine = byChild.get(event.ret)
      if (mine && mine.parent.pid === event.pid) {
        mine.wait = { nr: event.nr, ret: event.ret }
      }
    }
  }

  return episodes.map((draft) => ({
    ...draft,
    reaped: draft.reaped && { byParent: draft.wait !== null },
  }))
}
