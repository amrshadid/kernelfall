import type { CheckInput } from '@kernelfall/game/types'
import {
  asText,
  basename,
  callsOf,
  defineChecker,
  exitedWith,
  exitOf,
  filesOpened,
  programsNamed,
  writtenTo,
} from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import { STDOUT_FILENO } from '@kernelfall/machine/types'
import { tasksOf } from '#content/0-prologue/2-machine-in-section/lab-tasks.util.ts'

/** The PIIX3 IDE controller's PCI address on the Machine. */
const DISK_DRIVER_LINK = '0000:00:1e.0/driver'
const DISK_DRIVER = 'drivers/ata_piix'
const DTS_FILE = 'lighthouse.dts'
const LAMP_PROBED = 'leds-gpio leds: probed'
const LAMP_LED = 'lighthouse:lamp'

// By its path, or, for a path relative to the device's folder, by the target it returned.
const readsDiskDriver = (events: readonly LabEvent[]): boolean =>
  tasksOf(events).some((pid) =>
    callsOf(events, pid, ['readlinkat', 'readlink']).some(
      ({ enter, exit }) =>
        exit !== undefined &&
        exit.ret > 0 &&
        (asText(enter.data).endsWith(DISK_DRIVER_LINK) || asText(exit.data).endsWith(DISK_DRIVER))
    )
  )

const compilesDts = (events: readonly LabEvent[]): boolean =>
  programsNamed(events, 'dtc').some(
    (pid) =>
      exitedWith(exitOf(events, pid), 0) &&
      filesOpened(events, pid).some(({ path, ret }) => basename(path) === DTS_FILE && ret !== undefined && ret >= 0)
  )

const lampBinds = (events: readonly LabEvent[]): boolean =>
  programsNamed(events, 'board').some((pid) => {
    const log = writtenTo(events, pid, STDOUT_FILENO)
    return log.includes(LAMP_PROBED) && log.split(/\s+/).includes(LAMP_LED)
  })

export const checker = defineChecker({
  applies: ({ events }: CheckInput) =>
    ['dtc', 'board'].some((name) => programsNamed(events, name).length > 0) || readsDiskDriver(events),

  check({ events }) {
    const judged: Readonly<Record<string, boolean>> = {
      'reads-disk-driver': readsDiskDriver(events),
      'compiles-dts': compilesDts(events),
      'lamp-binds': lampBinds(events),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
