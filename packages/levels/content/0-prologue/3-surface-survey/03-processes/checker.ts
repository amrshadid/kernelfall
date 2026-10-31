import type { CheckInput, SyscallRecord } from '@kernelfall/game/types'
import { asText, callsOf, defineChecker, eventsOf, filesOpened, programsNamed, writtenTo } from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { EPERM, SIGTERM, STDOUT_FILENO } from '@kernelfall/machine/types'

export const INIT_PID = 1
const SLEEP = 'sleep'
const YES = 'yes'
const STATUS_PATH = /^\/proc\/(\d+)\/status$/
const COMMAND_COLUMN = 'COMMAND'
export const STOPPED_LINE = 'State:\tT (stopped)'
export const PENDING_FIELD = 'ShdPnd:'
// A process-wide pending signal is bit (signal - 1) of ShdPnd, printed as 16 hex digits.
const TERM_PENDING = `${PENDING_FIELD}\t${(1 << (SIGTERM - 1)).toString(16).padStart(16, '0')}`

// bash's builtin kill makes the call itself, so any task's kill() counts.
const killCalls = (events: readonly LabEvent[]): SyscallRecord[] =>
  [...new Set(eventsOf(events, 'sys_enter').map((event) => event.pid))].flatMap((pid) => callsOf(events, pid, ['kill']))

// cat's sendfile64 text may be missing from the trace; what reached the terminal never is.
const printed = (events: readonly LabEvent[], pid: Pid): string =>
  writtenTo(events, pid, STDOUT_FILENO) ||
  eventsOf(events, 'console_write')
    .filter((event) => event.pid === pid)
    .map((event) => asText(event.bytes))
    .join('')

function psListings(events: readonly LabEvent[]) {
  return programsNamed(events, 'ps').flatMap((pid) => {
    const [header = '', ...lines] = printed(events, pid).split('\n').filter(Boolean)
    const columns = header.trim().split(/\s+/)
    if (columns[0] !== 'PID') {
      return []
    }
    const rows = lines.map((line) => line.trim().split(/\s+/))
    return [{ rows, stat: columns.indexOf('STAT'), named: columns.includes(COMMAND_COLUMN) }]
  })
}

type Listing = ReturnType<typeof psListings>[number]

// Without -o, BusyBox's ps shows the whole command line, so the name is any word after the pid.
const rowsOf = ({ rows }: Listing, name: string) => rows.filter((row) => row.slice(1).includes(name))
const stateOf = (listing: Listing, row: readonly string[]) => (listing.stat < 0 ? '' : (row[listing.stat] ?? ''))

// Setup's processes aren't traced, so a full listing without one, or with it a zombie, shows it ended.
// Only a listing with names can show a name missing: `ps -o pid` lists no one by name.
const endedIn = (listing: Listing, name: string) =>
  listing.named &&
  listing.rows.some((row) => row[0] === String(INIT_PID)) &&
  rowsOf(listing, name).every((row) => stateOf(listing, row).startsWith('Z'))

function statusReads(events: readonly LabEvent[]): string[] {
  return [...new Set(eventsOf(events, 'sys_enter').map((event) => event.pid))].flatMap((pid) =>
    filesOpened(events, pid).some(({ path, ret }) => {
      const target = STATUS_PATH.exec(path)?.[1]
      return target !== undefined && Number(target) !== pid && ret !== undefined && ret >= 0
    })
      ? [printed(events, pid)]
      : []
  )
}

export const checker = defineChecker({
  // Every command is judged: the Survey uses the Machine's own programs, never the player's.
  applies: ({ events }: CheckInput) => events.length > 0,

  check({ events }) {
    const listings = psListings(events)
    const statuses = statusReads(events)
    const yesStatus = statuses.filter((text) => text.includes(`Name:\t${YES}\n`))
    const judged: Readonly<Record<string, boolean>> = {
      'listed-both': listings.some((listing) => rowsOf(listing, SLEEP).length > 0 && rowsOf(listing, YES).length > 0),
      'read-status': statuses.some((text) => [SLEEP, YES].some((name) => text.includes(`Name:\t${name}\n`))),
      'paused-yes':
        listings.some((listing) => rowsOf(listing, YES).some((row) => stateOf(listing, row).startsWith('T'))) ||
        yesStatus.some((text) => text.includes(STOPPED_LINE)),
      'saw-pending': yesStatus.some((text) => text.includes(STOPPED_LINE) && text.includes(TERM_PENDING)),
      'yes-ended': listings.some((listing) => endedIn(listing, YES)),
      'sleep-ended': listings.some((listing) => endedIn(listing, SLEEP)),
      'kill-init-denied': killCalls(events).some(
        (call) => call.enter.args[0] === INIT_PID && call.exit?.ret === -EPERM
      ),
    }
    return { objectivesMet: Object.keys(judged).filter((id) => judged[id]), taint: [] }
  },
})
