import type { CheckInput } from '@kernelfall/game/types'
import { callsOf, defineChecker, eventsOf, exitOf, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import { SIGSEGV, STDOUT_FILENO } from '@kernelfall/machine/types'

// The release only to its series, so a stable update of the image keeps passing.
const KERNEL_WORDS = [/^Linux$/, /^6\.18\.\d+/, /^i[3-6]86$/]
// PAGE_OFFSET under the 3G/1G split: where kernel space starts.
const KERNEL_SPACE = 0xc0000000

// The CPU's fault on a kernel address, then the kernel's SIGSEGV: not any crash of a program named poke.
const pokeSegfaults = (events: readonly LabEvent[]): boolean =>
  programsNamed(events, 'poke').some(
    (pid) =>
      exitOf(events, pid)?.signal === SIGSEGV &&
      eventsOf(events, 'page_fault_user').some((fault) => fault.pid === pid && fault.address >= KERNEL_SPACE)
  )

// All three words on one line, in any order, written after the kernel answered uname.
// SIMPLIFIED: the trace doesn't carry the record uname filled, so a hard-coded line written after the call passes too.
const printsMachine = (events: readonly LabEvent[]): boolean =>
  programsNamed(events, 'myuname').some((pid) => {
    const asked = callsOf(events, pid, ['uname', 'newuname']).find(({ exit }) => exit?.ret === 0)
    if (!asked?.exit) {
      return false
    }
    const after = events.filter((event) => event.seq > (asked.exit?.seq ?? 0))
    return writtenTo(after, pid, STDOUT_FILENO)
      .split('\n')
      .some((line) => {
        const words = line.trim().split(/\s+/)
        return KERNEL_WORDS.every((word) => words.some((printed) => word.test(printed)))
      })
  })

export const checker = defineChecker({
  applies: ({ events }: CheckInput) =>
    ['poke', 'myuname', 'uname'].some((name) => programsNamed(events, name).length > 0),

  check({ events }) {
    const judged: Readonly<Record<string, boolean>> = {
      'poke-segfaults': pokeSegfaults(events),
      'prints-machine': printsMachine(events),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
