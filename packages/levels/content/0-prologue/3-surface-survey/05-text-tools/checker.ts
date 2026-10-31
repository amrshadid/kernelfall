import type { CheckInput, OpenedFile } from '@kernelfall/game/types'
import { callsOf, defineChecker, filesOpened, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { O_ACCMODE, O_RDONLY, STDOUT_FILENO } from '@kernelfall/machine/types'

const CENSUS = 'census.txt'
const SORTED = 'sorted.txt'
const CENSUS_LINES = 40
/** The kinds of house in the census: one per district and lamp. */
const CENSUS_KINDS = 6
const CENSUS_LINE = /^[a-z-]+ (lit|dark)$/
/** `uniq -c`'s line: the count right-aligned in seven columns, a space, the line. */
const UNIQ_COUNT_LINE = /^ *(\d+) [a-z-]+ (lit|dark)$/
/** musl's stdio writes with writev(). */
const WRITE_CALLS = ['write', 'writev']
const WC_LINES = new RegExp(`^${CENSUS_LINES} \\S*${CENSUS}\\n$`)

const named = (file: OpenedFile, name: string) => file.path === name || file.path.endsWith(`/${name}`)
const forWriting = (file: OpenedFile) => (file.flags & O_ACCMODE) !== O_RDONLY
const fdOf = (file: OpenedFile | undefined) => (file?.ret !== undefined && file.ret >= 0 ? file.ret : undefined)

/** Bytes the kernel took or gave on `fd` through `names`, summed. */
const bytesMoved = (events: readonly LabEvent[], pid: Pid, fd: number, names: readonly string[]) =>
  callsOf(events, pid, names)
    .filter(({ enter, exit }) => enter.args[0] === fd && exit !== undefined && exit.ret > 0)
    .reduce((total, { exit }) => total + (exit?.ret ?? 0), 0)

/** Whole census lines, in byte order (sort's C locale), the trailing partial line left out. */
function inByteOrder(text: string): boolean {
  const lines = text.split('\n').slice(0, -1)
  return lines.length > 0 && lines.every((line, i) => CENSUS_LINE.test(line) && (lines[i - 1] ?? '') <= line)
}

/** `sort -o sorted.txt census.txt`: every byte read from the census went into sorted.txt, in order. */
function sortedIntoFile(events: readonly LabEvent[], pid: Pid): boolean {
  const opened = filesOpened(events, pid)
  const input = fdOf(opened.find((file) => named(file, CENSUS) && !forWriting(file)))
  const output = fdOf(opened.find((file) => named(file, SORTED) && forWriting(file)))
  if (input === undefined || output === undefined) {
    return false
  }
  // BusyBox sort moves the file onto stdout with dup2() and writes there.
  const fd =
    callsOf(events, pid, ['dup2', 'dup3']).find(({ enter, exit }) => enter.args[0] === output && (exit?.ret ?? -1) >= 0)
      ?.exit?.ret ?? output
  const read = bytesMoved(events, pid, input, ['read'])
  return read > 0 && bytesMoved(events, pid, fd, WRITE_CALLS) === read && inByteOrder(writtenTo(events, pid, fd))
}

/** `uniq -c sorted.txt`: one count per kind of house, adding up to the whole census. */
function countsKinds(events: readonly LabEvent[], pid: Pid): boolean {
  if (!filesOpened(events, pid).some((file) => named(file, SORTED) && file.ret !== undefined && file.ret >= 0)) {
    return false
  }
  const counts = writtenTo(events, pid, STDOUT_FILENO)
    .split('\n')
    .filter(Boolean)
    .map((line) => UNIQ_COUNT_LINE.exec(line)?.[1])
  return (
    counts.length === CENSUS_KINDS &&
    counts.every((count) => count !== undefined) &&
    counts.reduce((total, count) => total + Number(count), 0) === CENSUS_LINES
  )
}

/** level.yaml declares the grep objectives. */
export const checker = defineChecker({
  // Every command is judged: the Survey uses the Machine's own programs, never the player's.
  applies: ({ events }: CheckInput) => events.length > 0,

  check({ events }) {
    const judged: Readonly<Record<string, boolean>> = {
      'counted-lines': programsNamed(events, 'wc').some((pid) => WC_LINES.test(writtenTo(events, pid, STDOUT_FILENO))),
      'sorted-file': programsNamed(events, 'sort').some((pid) => sortedIntoFile(events, pid)),
      'counted-kinds': programsNamed(events, 'uniq').some((pid) => countsKinds(events, pid)),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
