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

/** The virtio disk's PCI address, as /sys names it (docs/levels/prologue.md, the Machine). */
const DISK_DRIVER_LINK = '0000:00:01.0/driver'
/** Where the disk's link points: its driver's folder in /sys/bus/pci/drivers. */
const DISK_DRIVER = 'drivers/virtio-pci'
const DTS_FILE = 'lighthouse.dts'
/** The board panel's log line when the GPIO LED driver takes the `leds` node. */
const LAMP_PROBED = 'leds-gpio leds: probed'
/** The lamp's name in /sys/class/leds: the node's `label`. */
const LAMP_LED = 'lighthouse:lamp'

/**
 * A readlinkat() of the disk's driver link that worked: by its path, or, for a
 * path relative to a folder the player cd'd into, by the target it returned.
 */
const readsDiskDriver = (events: readonly LabEvent[]): boolean =>
  tasksOf(events).some((pid) =>
    callsOf(events, pid, ['readlinkat', 'readlink']).some(
      ({ enter, exit }) =>
        exit !== undefined &&
        exit.ret > 0 &&
        (asText(enter.data).endsWith(DISK_DRIVER_LINK) || asText(exit.data).endsWith(DISK_DRIVER))
    )
  )

/** `dtc` opened lighthouse.dts and finished with status 0: its parser found no error. */
const compilesDts = (events: readonly LabEvent[]): boolean =>
  programsNamed(events, 'dtc').some(
    (pid) =>
      exitedWith(exitOf(events, pid), 0) &&
      filesOpened(events, pid).some(({ path, ret }) => basename(path) === DTS_FILE && ret !== undefined && ret >= 0)
  )

/** The board panel's boot (`board boot lighthouse.dtb`) bound the lamp and listed it under /sys/class/leds. */
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
