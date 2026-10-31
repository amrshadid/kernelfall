import { asText, callsOf, defineChecker, eventsOf, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import { STDOUT_FILENO } from '@kernelfall/machine/types'
import { readsByAnyTask, tasksOf } from '#content/0-prologue/2-machine-in-section/lab-tasks.util.ts'

const INIT_PID = 1
/** What initramfs-tools' /init runs once it has mounted the root: run-init's default. */
const SYSTEM_INIT = '/sbin/init'
const CARD_DRIVER_LINK = '0000:00:02.0/driver'
const CARD_DRIVER = 'drivers/e1000'
const MEMINFO = '/proc/meminfo'
/** Above what `mem=64M` leaves, and below what 512 MiB gives after the kernel's own share. */
const FULL_MEMORY_KIB = 480 * 1024
const KERNEL_THREAD = 'kthreadd'

/** PID 1 became /sbin/init: the initramfs found the root partition, mounted it and handed over. */
const rootFound = (events: readonly LabEvent[]): boolean =>
  eventsOf(events, 'sched_process_exec').some(({ pid, filename }) => pid === INIT_PID && filename === SYSTEM_INIT)

/** A readlink of the network card's driver link that returned the e1000 driver's folder. */
const e1000Bound = (events: readonly LabEvent[]): boolean =>
  tasksOf(events).some((pid) =>
    callsOf(events, pid, ['readlinkat', 'readlink']).some(
      ({ enter, exit }) =>
        exit !== undefined &&
        exit.ret > 0 &&
        asText(exit.data).endsWith(CARD_DRIVER) &&
        (asText(enter.data).endsWith(CARD_DRIVER_LINK) || asText(enter.data) === 'driver')
    )
  )

/** `MemTotal:` in /proc/meminfo, or the total on `free`'s `Mem:` line, in KiB. */
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

/** `ps -e` listed init as PID 1 and the kernel threads' parent, kthreadd. */
const processesListed = (events: readonly LabEvent[]): boolean =>
  programsNamed(events, 'ps').some((pid) => {
    const rows = writtenTo(events, pid, STDOUT_FILENO)
      .split('\n')
      .map((line) => line.trim().split(/\s+/))
    return (
      rows.some((row) => row[0] === String(INIT_PID) && row.at(-1) === 'init') &&
      rows.some((row) => row.at(-1) === KERNEL_THREAD)
    )
  })

/** level.yaml declares `operstate-up`. */
export const checker = defineChecker({
  // A boot is judged as much as a command: its events carry PID 1's hand-over.
  applies: () => true,

  check({ events }) {
    const judged: Readonly<Record<string, boolean>> = {
      'root-found': rootFound(events),
      'e1000-bound': e1000Bound(events),
      'full-memory': memTotals(events).some((total) => total > FULL_MEMORY_KIB),
      'processes-listed': processesListed(events),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
