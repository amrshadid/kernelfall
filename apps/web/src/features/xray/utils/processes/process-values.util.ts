import type { ProcessEpisode } from '@features/xray/types'
import { code, errnoMessage, shownText } from '@features/xray/utils/narration'
import type { TemplateValues, XrayNarration } from '@kernelfall/levels/types'
import { fillTemplate } from '@kernelfall/levels/utils'
import { SIGNAL_NAMES } from '@kernelfall/machine/types'

/** `write` ×2, `getdents64`: the calls a program made, counted, in first-seen order. */
export function summarizeCalls(names: readonly string[]): string {
  const counts = new Map<string, number>()
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts].map(([name, n]) => (n > 1 ? `${code(name)} ×${n}` : code(name))).join(', ')
}

/** A signal as `kill -l` names it, or its number when it has no name. */
export const signalName = (signal: number): string => SIGNAL_NAMES.get(signal) ?? `signal ${signal}`

/** The program the child runs once its execve is done: the new one, or still the parent's after a failed exec. */
export function programAfterExec(episode: ProcessEpisode): string {
  return episode.exec !== null && episode.exec.errno === null ? episode.childProgram : episode.parent.program
}

/** Worked out once per child. */
export function processValues(episode: ProcessEpisode, parts: XrayNarration['parts']): TemplateValues {
  const { parent, fork, child, exec, exit, wait } = episode
  const values = {
    parent: parent.program,
    parentPid: parent.pid,
    forkName: fork.name,
    forkNr: fork.nr,
    child: child ?? '?',
    errno: fork.errno ?? 'an error',
    errnoMessage: errnoMessage(fork.errno),
    execPath: exec?.path ?? '',
    execNr: exec?.nr ?? '',
    execErrno: exec?.errno ?? '',
    execErrnoMessage: errnoMessage(exec?.errno ?? null),
    program: programAfterExec(episode),
    work: summarizeCalls(episode.work),
    output: shownText(episode.printed),
    signal: exit?.signal != null ? signalName(exit.signal) : '',
    exitCode: exit?.code ?? '',
    exitNr: exit?.nr ?? '',
    waitNr: wait?.nr ?? '',
  }
  const part = (key: keyof XrayNarration['parts']) => fillTemplate(parts[key], values)
  return {
    ...values,
    via: part(fork.name === 'clone' ? 'via-clone' : 'via-fork'),
    rlimit: fork.errno === 'EAGAIN' ? part('rlimit-nproc') : '',
    waits: wait !== null ? part('parent-waits') : '',
    printed: episode.printed !== '' ? part('prints') : '',
    told: episode.sigchld ? part('sigchld') : '',
    status: exit?.signal != null ? part('status-killed') : part('status-exited'),
  }
}
