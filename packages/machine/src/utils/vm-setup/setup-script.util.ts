import type { LabPath, LabSetup } from '#types/definitions/lab-setup'
import {
  VM_BIN_DIR,
  VM_BIN_SOURCE_DIR,
  VM_MARKER_FD,
  VM_PLAYER,
  VM_PLAYER_FILE,
  VM_SESSION_FILE,
  VM_TRACE_AS_END,
  VM_TRACE_AS_START,
} from '#types/definitions/vm'
import { findUser, resolveAccounts, resolveLabProcesses } from '#utils/lab-setup/accounts.util'

const DIR_MODE = 0o755
const FILE_MODE = 0o644
const ROOT = 'root'
/** util-linux's, which replaces BusyBox's link in /bin: BusyBox's setpriv has no --reuid. */
const SETPRIV = '/bin/setpriv'
/** How far past a named pid the starting subshell forks; levels name pids close together. */
const SUBSHELL_PID_GAP = 1000
const TRACING = '/sys/kernel/tracing'

/** A word the guest's shell takes literally, whatever it holds. */
export const shellQuote = (text: string): string => `'${text.replace(/'/g, `'\\''`)}'`

// Base64 survives any quoting and any byte, so file contents need no escaping.
const writeText = (path: string, text: string) =>
  text === ''
    ? `: > ${shellQuote(path)}`
    : `echo ${btoa(String.fromCodePoint(...new TextEncoder().encode(text)))} | base64 -d > ${shellQuote(path)}`

const parentOf = (path: string) => path.slice(0, path.lastIndexOf('/')) || '/'

function pathLines(file: LabPath): string[] {
  const path = shellQuote(file.path)
  const dir = file.kind === 'dir'
  const owner = file.owner ?? ROOT
  // `owner:` gives the owner's login group, as the level format says a left-out group means.
  const chown = `chown ${shellQuote(`${owner}:${file.group ?? ''}`)} ${path}`
  const mode = (file.mode ?? (dir ? DIR_MODE : FILE_MODE)).toString(8)
  return [
    dir
      ? `mkdir -p ${path}`
      : `mkdir -p ${shellQuote(parentOf(file.path))} && ${writeText(file.path, file.content ?? '')}`,
    `${chown} && chmod ${mode} ${path}`,
  ]
}

// The helper opens the marker, joins the traced set (>> appends to set_event_pid), then brackets the
// command with markers of its own, so its events become a command apart from the player's shell.
// su execs, keeping its pid.
const RUN_AS = `exec ${VM_MARKER_FD}>${TRACING}/trace_marker; echo $$ >> ${TRACING}/set_event_pid; printf '${VM_TRACE_AS_START} %s\\n' "$1" >&${VM_MARKER_FD}; su -s /bin/sh "$2" -c "$1" < /dev/null; status=$?; echo "${VM_TRACE_AS_END} $status" >&${VM_MARKER_FD}; exit $status`

/**
 * One root line that runs `commandLine` as `user` inside the traced set: its events reach the
 * checkers as a finished command (S.2's guest knocking). Run it only while the player's shell is idle.
 */
export const runAsScript = (user: string, commandLine: string): string =>
  `sh -c ${shellQuote(RUN_AS)} kf-as ${shellQuote(commandLine)} ${shellQuote(user)}`

/** Where a `lab.bin` program's C source goes (or is already, from `lab.files`), and its binary. */
export const binSourcePath = (name: string) => `${VM_BIN_SOURCE_DIR}/${name}.c`
export const binPath = (name: string) => `${VM_BIN_DIR}/${name}`

// Built the way CONTRIBUTING asks userspace C to build: C11, every warning.
function buildLines(names: readonly string[], sources: Readonly<Record<string, string>>): string[] {
  return names.flatMap((name) => {
    const source = sources[name]
    return [
      ...(source === undefined ? [] : [`mkdir -p ${VM_BIN_SOURCE_DIR} && ${writeText(binSourcePath(name), source)}`]),
      `gcc -std=c11 -Wall -Wextra -O2 -o ${shellQuote(binPath(name))} ${shellQuote(binSourcePath(name))}`,
    ]
  })
}

/**
 * The root commands that make the clean Machine into a level's: accounts, files, the programs it
 * builds (`lab.bin`, from `binSources` or a source `lab.files` put in place), the player's session
 * (who, where, which environment) and the programs init has running. One command per line.
 */
export function setupScript(setup: LabSetup, binSources: Readonly<Record<string, string>> = {}): string[] {
  const accounts = resolveAccounts(setup)
  const lines: string[] = []

  for (const group of setup.groups ?? []) {
    lines.push(`delgroup ${shellQuote(group.name)} 2>/dev/null; addgroup -g ${group.gid} ${shellQuote(group.name)}`)
  }
  for (const wanted of setup.users ?? []) {
    const user = findUser(accounts, wanted.name)
    if (!user) {
      continue
    }
    const name = shellQuote(user.name)
    const group = accounts.groups.find((g) => g.gid === user.gid)?.name ?? user.name
    // Alpine ships accounts of its own (guest is uid 405): a level's account replaces one of the same name.
    lines.push(
      `deluser ${name} 2>/dev/null; addgroup -g ${user.gid} ${shellQuote(group)} 2>/dev/null; adduser -D -u ${user.uid} -G ${shellQuote(group)} -h ${shellQuote(user.home)} -s ${shellQuote(user.shell)} ${name}`
    )
  }
  for (const group of setup.groups ?? []) {
    for (const member of group.members ?? []) {
      lines.push(`addgroup ${shellQuote(member)} ${shellQuote(group.name)}`)
    }
  }
  for (const file of setup.files ?? []) {
    lines.push(...pathLines(file))
  }
  // After the files, so a source a level ships in lab.files is there; before processes, which may run them.
  lines.push(...buildLines(setup.bin ?? [], binSources))

  const session = [
    ...(setup.cwd === undefined ? [] : [`cd ${shellQuote(setup.cwd)}`]),
    ...Object.entries(setup.env ?? {}).map(([key, value]) => `export ${key}=${shellQuote(value)}`),
  ]
  lines.push(writeText(VM_SESSION_FILE, session.length > 0 ? `${session.join('\n')}\n` : ''))
  lines.push(writeText(VM_PLAYER_FILE, `${setup.player ?? VM_PLAYER.name}\n`))

  for (const process of resolveLabProcesses(setup)) {
    const run = process.argv.map(shellQuote).join(' ')
    const out = shellQuote(process.stdout ?? '/dev/console')
    // The next fork takes ns_last_pid + 1, so the story can name the pid. The echo is a builtin run
    // before the `&` forks (with `&&` the fork would come first); env and setpriv exec, keeping the pid.
    const pid = process.pid === undefined ? '' : `echo ${process.pid - 1} > /proc/sys/kernel/ns_last_pid; `
    // The subshell below forks first: away from the named pids, so it never takes the next one.
    const aside =
      process.pid === undefined ? '' : `echo ${process.pid + SUBSHELL_PID_GAP} > /proc/sys/kernel/ns_last_pid; `
    // env -i: the program gets its user's login environment, not the root channel's.
    const env = process.env.map(shellQuote).join(' ')
    // In a subshell that exits at once, so init adopts the program (PPID 1) and reaps it when it
    // ends, as for a process init started; the root channel never waits for it.
    lines.push(
      `${aside}(${pid}env -i ${env} ${SETPRIV} --reuid=${process.cred.uid} --regid=${process.cred.gid} --clear-groups ${run} < /dev/null > ${out} 2>&1 &)`
    )
  }
  return lines
}
