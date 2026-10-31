import { defineChecker, eventsOf, execsOf, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import type { Pid } from '@kernelfall/machine/types'
import { STDOUT_FILENO } from '@kernelfall/machine/types'

const HELLO = 'hello\n'

/** What echo printed: the shell's builtin (a task that never became a program) or /bin/echo, one text per task. */
function echoed(events: readonly LabEvent[]): string[] {
  const builtin = (pid: Pid) => execsOf(events, pid).length === 0
  const pids = new Set([
    ...eventsOf(events, 'sys_enter').flatMap((event) => (builtin(event.pid) ? [event.pid] : [])),
    ...programsNamed(events, 'echo'),
  ])
  return [...pids].map((pid) => writtenTo(events, pid, STDOUT_FILENO)).filter((text) => text.length > 0)
}

// The builtin echo starts no program, so no declared check can name it.
export const checker = defineChecker({
  applies: ({ events }) => echoed(events).length > 0,
  check: ({ events }) => {
    const texts = echoed(events)
    return {
      objectivesMet: [
        ...(texts.includes(HELLO) ? ['echo-hello'] : []),
        ...(texts.some((text) => text !== HELLO) ? ['echo-own-words'] : []),
      ],
      taint: [],
    }
  },
})
