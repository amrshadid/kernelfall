import type { CheckInput } from '@kernelfall/game/types'
import { basename, defineChecker, filesOpened, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { STDOUT_FILENO } from '@kernelfall/machine/types'
import { readsByAnyTask } from '#content/0-prologue/2-machine-in-section/lab-tasks.util.ts'

const MEMINFO = '/proc/meminfo'
const STACK = '[stack]'
const DATA_PERMS = 'rw-p'
/** The global's and the local's. */
const MIN_ADDRESSES = 2

// models fs/proc/task_mmu.c: show_map_vma()
const MAPS_LINE = /^([0-9a-f]+)-([0-9a-f]+) ([r-][w-][x-][ps]) [0-9a-f]+ [0-9a-f]+:[0-9a-f]+ \d+\s*(.*)$/
const ADDRESS = /0x[0-9a-f]+/g

interface Region {
  readonly start: bigint
  readonly end: bigint
  readonly perms: string
  /** The file it maps, `[stack]` or `[heap]`, or empty for anonymous memory. */
  readonly name: string
}

interface WhereRun {
  readonly addresses: readonly bigint[]
  readonly regions: readonly Region[]
}

const isOwnMaps = (path: string, pid: Pid): boolean => path === '/proc/self/maps' || path === `/proc/${pid}/maps`

// Addresses are the lines before the map; the map is what the run read from its own maps file.
function readRun(events: readonly LabEvent[], pid: Pid): WhereRun | null {
  if (!filesOpened(events, pid).some(({ path, ret }) => isOwnMaps(path, pid) && ret !== undefined && ret >= 0)) {
    return null
  }
  const addresses: bigint[] = []
  const regions: Region[] = []
  for (const line of writtenTo(events, pid, STDOUT_FILENO).split('\n')) {
    const region = MAPS_LINE.exec(line)
    if (region) {
      const [, start = '0', end = '0', perms = '', name = ''] = region
      regions.push({ start: BigInt(`0x${start}`), end: BigInt(`0x${end}`), perms, name: name.trim() })
    } else {
      addresses.push(...(line.match(ADDRESS) ?? []).map((address) => BigInt(address)))
    }
  }
  return { addresses, regions }
}

// A region's end is the first byte past it.
const printedIn = ({ addresses, regions }: WhereRun, wanted: (region: Region) => boolean): boolean =>
  addresses.some((address) =>
    regions.some((region) => wanted(region) && region.start <= address && address < region.end)
  )

const runsOf = (events: readonly LabEvent[]): WhereRun[] =>
  programsNamed(events, 'where').flatMap((pid) => readRun(events, pid) ?? [])

export const checker = defineChecker({
  applies: ({ events }: CheckInput) =>
    programsNamed(events, 'where').length > 0 || readsByAnyTask(events, (path) => path === MEMINFO).length > 0,

  check({ events }) {
    const runs = runsOf(events)
    const judged: Readonly<Record<string, boolean>> = {
      'reads-meminfo': readsByAnyTask(events, (path) => path === MEMINFO).some(({ text }) =>
        text.includes('MemTotal:')
      ),
      'prints-maps': runs.some((run) => run.addresses.length >= MIN_ADDRESSES && run.regions.length > 0),
      'global-in-data': runs.some((run) =>
        printedIn(run, ({ perms, name }) => perms === DATA_PERMS && basename(name) === 'where')
      ),
      'local-on-stack': runs.some((run) => printedIn(run, ({ name }) => name === STACK)),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
