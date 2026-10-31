import type { CheckInput } from '@kernelfall/game/types'
import { callsOf, defineChecker, filesOpened, isWholeWrite, programsNamed, writesTo } from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { STDOUT_FILENO } from '@kernelfall/machine/types'

type Filesystem = '9p' | 'procfs' | 'sysfs' | 'other'

const READ_FD_ARG = 0

// The Machine's mounts over 9p at `/`, deepest first: tracefs sits inside sysfs.
const MOUNTS: readonly (readonly [prefix: string, filesystem: Filesystem])[] = [
  ['/sys/kernel/tracing/', 'other'],
  ['/proc/', 'procfs'],
  ['/sys/', 'sysfs'],
  ['/dev/', 'other'],
  ['/tmp/', 'other'],
  ['/run/', 'other'],
]

// A relative path starts in the home folder, on 9p.
const filesystemOf = (path: string): Filesystem => MOUNTS.find(([prefix]) => path.startsWith(prefix))?.[1] ?? '9p'

// At least one byte read, then written to standard output in full.
function filesystemsLooked(events: readonly LabEvent[], pid: Pid): Set<Filesystem> {
  const looked = new Set<Filesystem>()
  const writes = writesTo(events, pid, STDOUT_FILENO).filter(isWholeWrite)
  for (const { path, ret: fd, seq } of filesOpened(events, pid)) {
    if (fd === undefined || fd < 0) {
      continue
    }
    const read = callsOf(events, pid, ['read']).find(
      ({ enter, exit }) => enter.seq > seq && enter.args[READ_FD_ARG] === fd && exit !== undefined && exit.ret > 0
    )
    if (read && writes.some(({ enter }) => enter.seq > read.enter.seq)) {
      looked.add(filesystemOf(path))
    }
  }
  return looked
}

export const checker = defineChecker({
  applies: ({ events }: CheckInput) => programsNamed(events, 'look').length > 0,

  check({ events }) {
    const looked = new Set(programsNamed(events, 'look').flatMap((pid) => [...filesystemsLooked(events, pid)]))
    const judged: Readonly<Record<string, boolean>> = {
      'reads-9p': looked.has('9p'),
      'reads-procfs': looked.has('procfs'),
      'reads-sysfs': looked.has('sysfs'),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
