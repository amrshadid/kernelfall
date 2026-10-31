import type { CheckInput } from '@kernelfall/game/types'
import { callsOf, defineChecker, filesOpened, isWholeWrite, programsNamed, writesTo } from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { STDOUT_FILENO } from '@kernelfall/machine/types'

type Filesystem = 'ext4' | 'procfs' | 'sysfs' | 'other'

/** read(fd, buf, count): where `fd` sits. */
const READ_FD_ARG = 0

/** The Machine's /proc/mounts: ext4 at `/`, procfs, sysfs and devtmpfs on top (docs/levels/prologue.md, P.9). */
const MOUNTS: readonly (readonly [prefix: string, filesystem: Filesystem])[] = [
  ['/proc/', 'procfs'],
  ['/sys/', 'sysfs'],
  ['/dev/', 'other'],
  // The lab may mount a tmpfs here, so a read in /tmp proves nothing about ext4.
  ['/tmp/', 'other'],
]

/** Which filesystem answers `path`; a relative path starts in the home folder, on ext4. */
const filesystemOf = (path: string): Filesystem => MOUNTS.find(([prefix]) => path.startsWith(prefix))?.[1] ?? 'ext4'

/** The filesystems `pid` read at least one byte from and then wrote to standard output in full. */
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

/** level.yaml declares `exits-zero`. */
export const checker = defineChecker({
  applies: ({ events }: CheckInput) => programsNamed(events, 'look').length > 0,

  check({ events }) {
    const looked = new Set(programsNamed(events, 'look').flatMap((pid) => [...filesystemsLooked(events, pid)]))
    const judged: Readonly<Record<string, boolean>> = {
      'reads-ext4': looked.has('ext4'),
      'reads-procfs': looked.has('procfs'),
      'reads-sysfs': looked.has('sysfs'),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
