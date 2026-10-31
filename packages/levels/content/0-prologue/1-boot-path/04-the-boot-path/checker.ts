import { asText, callsOf, consoleBetween, defineChecker, programsNamed } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import { ENOENT } from '@kernelfall/machine/types'

// The kernel's own words (init/main.c), as dmesg prints them on the Machine; checker.test.ts holds
// them to a recorded boot.
export const UNKNOWN_PARAMS = /Unknown kernel command line parameters "[^"]+", will be passed to user space\./
export const INITCALL_LINE =
  /calling {2}\S+(?: \[\S+\])? @ \d+|initcall \S+(?: \[\S+\])? returned -?\d+ after \d+ usecs/
export const EFI_DIR = '/sys/firmware/efi'
const STAT_CALLS = ['statx', 'stat64', 'lstat64']

// A pipe's reader prints after dmesg may have exited: judge everything the command showed.
const shownWithDmesg = (events: readonly LabEvent[], line: RegExp): boolean =>
  programsNamed(events, 'dmesg').length > 0 && line.test(consoleBetween(events, -1, Number.POSITIVE_INFINITY))

const askedForEfi = (events: readonly LabEvent[]): boolean =>
  programsNamed(events, 'ls').some((pid) =>
    callsOf(events, pid, STAT_CALLS).some(({ enter, exit }) => asText(enter.data) === EFI_DIR && exit?.ret === -ENOENT)
  )

export const checker = defineChecker({
  applies: ({ events }) => programsNamed(events, 'dmesg').length > 0 || programsNamed(events, 'ls').length > 0,

  check({ events }) {
    const judged: Readonly<Record<string, boolean>> = {
      'initcalls-logged': shownWithDmesg(events, INITCALL_LINE),
      'passed-to-init': shownWithDmesg(events, UNKNOWN_PARAMS),
      'no-uefi': askedForEfi(events),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
