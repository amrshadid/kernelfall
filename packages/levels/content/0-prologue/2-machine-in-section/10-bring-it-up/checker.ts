import { asText, callsOf, defineChecker, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import { STDOUT_FILENO } from '@kernelfall/machine/types'
import { readsByAnyTask, tasksOf } from '#content/0-prologue/2-machine-in-section/lab-tasks.util.ts'

// checker.test.ts holds these to the Machine's own outputs.
export const INIT_PID = 1
export const SYSTEM_INIT = '/sbin/init'
export const CARD_DRIVER = 'drivers/virtio_net'
export const KERNEL_THREAD = '[kthreadd]'
// Between the 45524 kB that mem=64M leaves and the Machine's whole memory.
export const FULL_MEMORY_KIB = 200 * 1024
const CARD_DRIVER_LINK = 'eth0/device/driver'
const MEMINFO = '/proc/meminfo'

// The trace keeps readlink's path, not always its target. On the Machine only virtio_net makes an
// eth0, so the link resolving at all means the card is bound; a returned target must name it.
const cardBound = (events: readonly LabEvent[]): boolean =>
  tasksOf(events).some((pid) =>
    callsOf(events, pid, ['readlinkat', 'readlink']).some(
      ({ enter, exit }) =>
        exit !== undefined &&
        exit.ret > 0 &&
        asText(enter.data).endsWith(CARD_DRIVER_LINK) &&
        (asText(exit.data) === '' || asText(exit.data).endsWith(CARD_DRIVER))
    )
  )

function memTotals(events: readonly LabEvent[]): number[] {
  const fromMeminfo = readsByAnyTask(events, (path) => path === MEMINFO).flatMap(({ text }) => {
    const total = /^MemTotal:\s+(\d+) kB$/m.exec(text)?.[1]
    return total === undefined ? [] : [Number(total)]
  })
  const fromFree = programsNamed(events, 'free').flatMap((pid) => {
    const total = /^Mem:\s+(\d+)\s/m.exec(writtenTo(events, pid, STDOUT_FILENO))?.[1]
    return total === undefined ? [] : [Number(total)]
  })
  return [...fromMeminfo, ...fromFree]
}

// BusyBox ps: `PID USER TIME COMMAND`, init as /sbin/init, kernel threads in brackets.
const processesListed = (events: readonly LabEvent[]): boolean =>
  programsNamed(events, 'ps').some((pid) => {
    const rows = writtenTo(events, pid, STDOUT_FILENO)
      .split('\n')
      .map((line) => line.trim().split(/\s+/))
    return (
      rows.some((row) => row[0] === String(INIT_PID) && row.at(-1) === SYSTEM_INIT) &&
      rows.some((row) => row.at(-1) === KERNEL_THREAD)
    )
  })

export const checker = defineChecker({
  applies: ({ events }) => tasksOf(events).length > 0,

  check({ events }) {
    const judged: Readonly<Record<string, boolean>> = {
      'card-bound': cardBound(events),
      'full-memory': memTotals(events).some((total) => total > FULL_MEMORY_KIB),
      'processes-listed': processesListed(events),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
