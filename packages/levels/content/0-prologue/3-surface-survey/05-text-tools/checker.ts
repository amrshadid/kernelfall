import type { CheckInput, OpenedFile } from '@kernelfall/game/types'
import { callsOf, defineChecker, execsOf, filesOpened, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { O_ACCMODE, O_RDONLY, STDIN_FILENO, STDOUT_FILENO } from '@kernelfall/machine/types'

const CENSUS = 'census.txt'
const SORTED = 'sorted.txt'
const CENSUS_LINES = 40
const CENSUS_KINDS = 6
const CENSUS_DARK = 31
const CENSUS_LINE = /^[a-z-]+ (lit|dark)$/
const UNIQ_COUNT_LINE = /^ *(\d+) [a-z-]+ (lit|dark)$/
const WRITE_CALLS = ['write', 'writev']
const WC_LINES = new RegExp(`^${CENSUS_LINES} \\S*${CENSUS}\\n$`)

const named = (file: OpenedFile, name: string) => file.path === name || file.path.endsWith(`/${name}`)
const forWriting = (file: OpenedFile) => (file.flags & O_ACCMODE) !== O_RDONLY
const fdOf = (file: OpenedFile | undefined) => (file?.ret !== undefined && file.ret >= 0 ? file.ret : undefined)

const bytesMoved = (events: readonly LabEvent[], pid: Pid, fd: number, names: readonly string[]) =>
  callsOf(events, pid, names)
    .filter(({ enter, exit }) => enter.args[0] === fd && exit !== undefined && exit.ret > 0)
    .reduce((total, { exit }) => total + (exit?.ret ?? 0), 0)

// Whole census lines in byte order (BusyBox sort's C locale); the last, partial piece is left out.
function inByteOrder(text: string): boolean {
  const lines = text.split('\n').slice(0, -1)
  return lines.length > 0 && lines.every((line, i) => CENSUS_LINE.test(line) && (lines[i - 1] ?? '') <= line)
}

// bash's `>` and BusyBox sort's -o both dup2() the file onto stdout.
const movedTo = (events: readonly LabEvent[], pid: Pid, fd: number) =>
  callsOf(events, pid, ['dup2', 'dup3']).find(({ enter, exit }) => enter.args[0] === fd && (exit?.ret ?? -1) >= 0)?.exit
    ?.ret ?? fd

function sortedIntoFile(events: readonly LabEvent[], pid: Pid): boolean {
  const opened = filesOpened(events, pid)
  const input = fdOf(opened.find((file) => named(file, CENSUS) && !forWriting(file)))
  const output = fdOf(opened.find((file) => named(file, SORTED) && forWriting(file)))
  if (input === undefined || output === undefined) {
    return false
  }
  const fd = movedTo(events, pid, output)
  const read = bytesMoved(events, pid, input, ['read'])
  return read > 0 && bytesMoved(events, pid, fd, WRITE_CALLS) === read && inByteOrder(writtenTo(events, pid, fd))
}

function countsKinds(stdout: string): boolean {
  const counts = stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => UNIQ_COUNT_LINE.exec(line)?.[1])
  return (
    counts.length === CENSUS_KINDS &&
    counts.every((count) => count !== undefined) &&
    counts.reduce((total, count) => total + Number(count), 0) === CENSUS_LINES
  )
}

// bash's child moves the pipe's read end onto fd 0 before execve(); `< file` would open a file there instead.
const readsPipe = (events: readonly LabEvent[], pid: Pid) => {
  const exec = execsOf(events, pid)[0]?.seq ?? Number.POSITIVE_INFINITY
  const files = new Set(
    filesOpened(events, pid).flatMap(({ seq, ret }) => (seq < exec && ret !== undefined ? [ret] : []))
  )
  return (
    callsOf(events, pid, ['dup2', 'dup3']).some(
      ({ enter, exit }) =>
        enter.seq < exec &&
        enter.args[1] === STDIN_FILENO &&
        exit?.ret === STDIN_FILENO &&
        !files.has(enter.args[0] ?? -1)
    ) && bytesMoved(events, pid, STDIN_FILENO, ['read']) > 0
  )
}

// `grep … | wc -l`: wc counted from its pipe exactly the bytes a grep of the census wrote.
function countedGrepLines(events: readonly LabEvent[], count: number): boolean {
  const greps = programsNamed(events, 'grep').filter((pid) =>
    filesOpened(events, pid).some((file) => named(file, CENSUS) && !forWriting(file) && (fdOf(file) ?? -1) >= 0)
  )
  return programsNamed(events, 'wc').some((pid) => {
    const read = bytesMoved(events, pid, STDIN_FILENO, ['read'])
    return (
      readsPipe(events, pid) &&
      writtenTo(events, pid, STDOUT_FILENO).trim() === String(count) &&
      greps.some((grep) => bytesMoved(events, grep, STDOUT_FILENO, WRITE_CALLS) === read)
    )
  })
}

/** level.yaml declares the /etc/passwd objective. */
export const checker = defineChecker({
  // Every command is judged: the Survey uses the Machine's own programs, never the player's.
  applies: ({ events }: CheckInput) => events.length > 0,

  check({ events }) {
    const uniqs = programsNamed(events, 'uniq').map((pid) => ({
      pid,
      counts: countsKinds(writtenTo(events, pid, STDOUT_FILENO)),
    }))
    const judged: Readonly<Record<string, boolean>> = {
      'counted-lines': programsNamed(events, 'wc').some((pid) => WC_LINES.test(writtenTo(events, pid, STDOUT_FILENO))),
      'counted-dark':
        programsNamed(events, 'grep').some((pid) => writtenTo(events, pid, STDOUT_FILENO) === `${CENSUS_DARK}\n`) ||
        countedGrepLines(events, CENSUS_DARK),
      'sorted-file': programsNamed(events, 'sort').some((pid) => sortedIntoFile(events, pid)),
      'counted-kinds': uniqs.some(
        ({ pid, counts }) =>
          counts && filesOpened(events, pid).some((file) => named(file, SORTED) && (fdOf(file) ?? -1) >= 0)
      ),
      'piped-counts':
        programsNamed(events, 'sort').length > 0 && uniqs.some(({ pid, counts }) => counts && readsPipe(events, pid)),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
