import type { CheckInput } from '@kernelfall/game/types'
import { defineChecker, exitOf, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent } from '@kernelfall/machine/events'
import { SIGSEGV, STDOUT_FILENO } from '@kernelfall/machine/types'

/** uname()'s sysname, release and machine, as the Machine answers them (`Linux 6.18.59-0-virt i686`). */
const KERNEL_WORDS = [/^Linux$/, /^6\.18\.\d+/, /^i[3-6]86$/]

/** `poke` touched kernel memory and the kernel killed it with SIGSEGV. */
const pokeSegfaults = (events: readonly LabEvent[]): boolean =>
  programsNamed(events, 'poke').some((pid) => exitOf(events, pid)?.signal === SIGSEGV)

/** One line of `myuname`'s output holds all three words, in any order. */
const printsMachine = (events: readonly LabEvent[]): boolean =>
  programsNamed(events, 'myuname').some((pid) =>
    writtenTo(events, pid, STDOUT_FILENO)
      .split('\n')
      .some((line) => {
        const words = line.trim().split(/\s+/)
        return KERNEL_WORDS.every((word) => words.some((printed) => word.test(printed)))
      })
  )

/** level.yaml declares `asks-uname`, `exits-zero` and `compares-uname`. */
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
