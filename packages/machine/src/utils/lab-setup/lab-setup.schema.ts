import type { StringRule } from '@kernelfall/core/types'
import { Issues, joinPath, ObjectReader, reportDuplicates } from '@kernelfall/core/utils'
import type { LabBootSetup } from '#types/definitions/boot'
import { BOOT_KERNEL_PATH, COMMAND_LINE_SIZE } from '#types/definitions/boot'
import type {
  Accounts,
  LabGroup,
  LabPath,
  LabProcess,
  LabSetup,
  LabSetupValidation,
  LabUser,
} from '#types/definitions/lab-setup'
import { LAB_PATH_KINDS } from '#types/definitions/lab-setup'
import { NAME_MAX, PATH_MAX, S_IALLUGO } from '#types/definitions/stat'
import { PID_MAX_DEFAULT } from '#types/definitions/task'
import { findGroup, findUser, resolveAccounts } from '#utils/lab-setup/accounts.util'

/** The byte that ends a C string. */
const NUL_CHAR = '\0'

const SETUP_FIELDS = ['users', 'groups', 'files', 'player', 'cwd', 'env', 'bin', 'processes', 'boot'] as const
const PROCESS_FIELDS = ['argv', 'pid', 'user', 'stdout'] as const
/** init is pid 1, so a level's process starts at 2 at the lowest. */
const MIN_PROCESS_PID = 2
const BOOT_FIELDS = ['args'] as const
/** The session and processes live in /run and in memory; kf-rc mounts these as tmpfs. */
const LOST_ON_REBOOT = ['player', 'cwd', 'env', 'processes'] as const
const TMPFS_MOUNTS = ['/run', '/tmp']
/** The bootloader puts `BOOT_IMAGE=<kernel> ` in front, and the whole line must fit COMMAND_LINE_SIZE with its NUL. */
const MAX_BOOT_ARGS = COMMAND_LINE_SIZE - `BOOT_IMAGE=${BOOT_KERNEL_PATH} `.length - 1
const USER_FIELDS = ['name', 'uid', 'gid', 'home', 'shell'] as const
const GROUP_FIELDS = ['name', 'gid', 'members'] as const
const PATH_FIELDS = ['path', 'kind', 'mode', 'owner', 'group', 'content'] as const

// models shadow-utils' default NAME_REGEX and LOGIN_NAME_MAX: lower case, at most 32 characters
const ACCOUNT_NAME: StringRule = {
  pattern: /^[a-z_][a-z0-9_-]{0,31}$/,
  expected: 'a lower-case account name of at most 32 characters, like ada',
}
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/
const PROGRAM_NAME: StringRule = { pattern: /^[a-z0-9][a-z0-9._+-]*$/, expected: 'a program file name like ls' }
/** Octal permission bits, optionally with a leading 0 or 0o: `0644`, `755`, `0o1777`. */
const OCTAL_MODE = /^(?:0o)?[0-7]{1,5}$/
const OCTAL_RADIX = 8
const OCTAL_PREFIX = '0o'
/** uid_t and gid_t are 32 bits, and (uid_t)-1 means "no change", so it can't be an id. */
const MAX_ID = 0xffff_fffe

/** Reads one list entry, leaving it out (undefined) if it added an error, so later checks skip it. */
function entry<T>(issues: Issues, read: () => T): T | undefined {
  const before = issues.count
  const value = read()
  return issues.count === before ? value : undefined
}

const isPresent = <T>(value: T | undefined): value is T => value !== undefined

const readId = (reader: ObjectReader, key: string): number => reader.integer(key, 0, MAX_ID)

// models fs/namei.c: what a path walk accepts, kept to the absolute, already-normalized paths setup needs
function readPath(reader: ObjectReader, key: string): string {
  const text = reader.string(key)
  if (text === '') {
    return text
  }
  const names = text.split('/').slice(1)
  const problem = !text.startsWith('/')
    ? 'must be absolute (start with /)'
    : text.length >= PATH_MAX
      ? `is longer than PATH_MAX (${PATH_MAX})`
      : text.includes(NUL_CHAR)
        ? 'contains a NUL byte'
        : text !== '/' && names.some((name) => name === '' || name === '.' || name === '..')
          ? 'must not contain empty, "." or ".." parts, or end in /'
          : names.some((name) => name.length > NAME_MAX)
            ? `has a part longer than NAME_MAX (${NAME_MAX})`
            : null
  if (problem) {
    reader.issues.add(reader.pathOf(key), `"${text}" ${problem}`)
  }
  return text
}

// YAML 1.2 reads an unquoted 0644 as the decimal number 644, so a mode must be a quoted string.
function readMode(reader: ObjectReader, key: string): number {
  const value = reader.value(key)
  const path = reader.pathOf(key)
  if (typeof value !== 'string' || !OCTAL_MODE.test(value)) {
    reader.issues.add(
      path,
      `expected octal permission bits as a quoted string like '0644', got ${JSON.stringify(value)}`
    )
    return 0
  }
  const mode = Number.parseInt(value.startsWith(OCTAL_PREFIX) ? value.slice(OCTAL_PREFIX.length) : value, OCTAL_RADIX)
  if (mode > S_IALLUGO) {
    reader.issues.add(path, `"${value}" is more than the permission bits (at most 07777)`)
  }
  return mode
}

function readUser(reader: ObjectReader): LabUser {
  reader.rejectUnknownKeys(USER_FIELDS)
  const name = reader.string('name', ACCOUNT_NAME)
  const uid = readId(reader, 'uid')
  const gid = reader.optional('gid', (key) => readId(reader, key))
  const home = reader.optional('home', (key) => readPath(reader, key))
  const shell = reader.optional('shell', (key) => readPath(reader, key))
  return { name, uid, ...(gid !== undefined && { gid }), ...(home && { home }), ...(shell && { shell }) }
}

function readGroup(reader: ObjectReader): LabGroup {
  reader.rejectUnknownKeys(GROUP_FIELDS)
  const name = reader.string('name', ACCOUNT_NAME)
  const gid = readId(reader, 'gid')
  const members = reader.optional('members', (key) => reader.stringList(key, ACCOUNT_NAME))
  return { name, gid, ...(members && { members }) }
}

function readLabPath(reader: ObjectReader): LabPath {
  reader.rejectUnknownKeys(PATH_FIELDS)
  const path = readPath(reader, 'path')
  const kind = reader.optional('kind', (key) => reader.oneOf(key, LAB_PATH_KINDS)) ?? 'file'
  const mode = reader.optional('mode', (key) => readMode(reader, key))
  const owner = reader.optional('owner', (key) => reader.string(key))
  const group = reader.optional('group', (key) => reader.string(key))
  // Empty content is an empty file, so it is read as text.
  const content = reader.optional('content', (key) => reader.text(key))
  if (kind === 'dir' && content !== undefined) {
    reader.issues.add(reader.pathOf('content'), 'a directory has no content')
  }
  return {
    path,
    kind,
    ...(mode !== undefined && { mode }),
    ...(owner !== undefined && { owner }),
    ...(group !== undefined && { group }),
    ...(content !== undefined && { content }),
  }
}

function readProcess(reader: ObjectReader): LabProcess {
  reader.rejectUnknownKeys(PROCESS_FIELDS)
  const argv = reader.stringList('argv')
  if (argv.length === 0 || argv[0] === '') {
    reader.issues.add(reader.pathOf('argv'), 'needs at least the program name')
  }
  const pid = reader.optional('pid', (key) => reader.integer(key, MIN_PROCESS_PID, PID_MAX_DEFAULT - 1))
  const user = reader.optional('user', (key) => reader.string(key))
  const stdout = reader.optional('stdout', (key) => readPath(reader, key))
  return {
    argv,
    ...(pid !== undefined && { pid }),
    ...(user !== undefined && { user }),
    ...(stdout !== undefined && { stdout }),
  }
}

// A number or boolean would be a YAML surprise (`DEBUG: yes` reads as a string, `PORT: 80` doesn't).
function readEnv(reader: ObjectReader, key: string): Readonly<Record<string, string>> {
  const env = reader.textMap(key)
  for (const name of Object.keys(env)) {
    if (!ENV_NAME.test(name)) {
      reader.issues.add(joinPath(reader.pathOf(key), name), 'is not a valid variable name')
    }
  }
  return env
}

// The kernel reads one line: a newline or NUL would end it.
function readBoot(reader: ObjectReader, key: string): LabBootSetup {
  const boot = reader.object(key)
  // No `firmware`: the Machine has SeaBIOS only, so a level can't pick UEFI.
  boot.rejectUnknownKeys(BOOT_FIELDS)
  const args = boot.optional('args', (field) => boot.text(field))
  if (args !== undefined && (/[\n\0]/.test(args) || args.length > MAX_BOOT_ARGS)) {
    boot.issues.add(boot.pathOf('args'), `must be one line of at most ${MAX_BOOT_ARGS} characters`)
  }
  return args === undefined ? {} : { args }
}

// A restart empties the tmpfs mounts and ends every process, so these would never reach the player.
function checkBootSetup(setup: LabSetup, issues: Issues): void {
  if (!setup.boot) {
    return
  }
  for (const field of LOST_ON_REBOOT) {
    if (setup[field] !== undefined) {
      issues.add(`lab.${field}`, "doesn't survive the restart lab.boot makes")
    }
  }
  setup.files?.forEach((file, i) => {
    if (TMPFS_MOUNTS.some((mount) => file.path.startsWith(`${mount}/`))) {
      issues.add(`lab.files[${i}].path`, 'is on a tmpfs, emptied by the restart lab.boot makes')
    }
  })
}

function readEntries<T>(reader: ObjectReader, key: string, read: (entry: ObjectReader) => T): readonly T[] {
  const { issues } = reader
  return reader
    .list(key, (value, path) => entry(issues, () => read(new ObjectReader(value, path, issues))))
    .filter(isPresent)
}

/** Names a setup refers to (owners, groups, members, the player) must be accounts it has. */
function checkNames(setup: LabSetup, accounts: Accounts, issues: Issues): void {
  setup.users?.forEach((user, i) => {
    const gid = findUser(accounts, user.name)?.gid
    if (!accounts.groups.some((group) => group.gid === gid)) {
      issues.add(`lab.users[${i}].gid`, `no group has gid ${gid} (the group "${user.name}" is taken)`)
    }
  })
  setup.groups?.forEach((group, i) => {
    group.members?.forEach((member, j) => {
      if (!findUser(accounts, member)) {
        issues.add(`lab.groups[${i}].members[${j}]`, `no user named "${member}"`)
      }
    })
  })
  setup.files?.forEach((file, i) => {
    if (file.owner !== undefined && !findUser(accounts, file.owner)) {
      issues.add(`lab.files[${i}].owner`, `no user named "${file.owner}"`)
    }
    if (file.group !== undefined && !findGroup(accounts, file.group)) {
      issues.add(`lab.files[${i}].group`, `no group named "${file.group}"`)
    }
  })
  setup.processes?.forEach((process, i) => {
    if (process.user !== undefined && !findUser(accounts, process.user)) {
      issues.add(`lab.processes[${i}].user`, `no user named "${process.user}"`)
    }
  })
  if (setup.player !== undefined && !findUser(accounts, setup.player)) {
    issues.add('lab.player', `no user named "${setup.player}"`)
  }
}

function reportClashes(setup: LabSetup, accounts: Accounts, issues: Issues): void {
  reportDuplicates(
    accounts.users.map((user) => user.name),
    'lab.users',
    issues
  )
  reportDuplicates(
    accounts.users.map((user) => user.uid),
    'lab.users',
    issues
  )
  reportDuplicates(
    accounts.groups.map((group) => group.name),
    'lab.groups',
    issues
  )
  reportDuplicates(
    accounts.groups.map((group) => group.gid),
    'lab.groups',
    issues
  )
  reportDuplicates(setup.bin ?? [], 'lab.bin', issues)
  reportDuplicates(
    (setup.processes ?? []).flatMap((process) => (process.pid === undefined ? [] : [process.pid])),
    'lab.processes',
    issues
  )
}

/**
 * Checks a level.yaml's `lab:` block (parsed YAML) and returns the typed
 * setup, or every problem found with the path to the field, e.g.
 * `lab.files[0].mode: expected octal permission bits as a quoted string like '0644'`.
 */
export function validateLabSetup(input: unknown): LabSetupValidation {
  const issues = new Issues()
  const reader = new ObjectReader(input, 'lab', issues)
  reader.rejectUnknownKeys(SETUP_FIELDS)

  const users = reader.optional('users', (key) => readEntries(reader, key, readUser))
  const groups = reader.optional('groups', (key) => readEntries(reader, key, readGroup))
  const files = reader.optional('files', (key) => readEntries(reader, key, readLabPath))
  const player = entry(issues, () => reader.optional('player', (key) => reader.string(key)))
  const cwd = reader.optional('cwd', (key) => readPath(reader, key))
  const env = reader.optional('env', (key) => readEnv(reader, key))
  const bin = reader.optional('bin', (key) => reader.stringList(key, PROGRAM_NAME))
  const processes = reader.optional('processes', (key) => readEntries(reader, key, readProcess))
  const boot = reader.optional('boot', (key) => readBoot(reader, key))

  const setup: LabSetup = {
    ...(users && { users }),
    ...(groups && { groups }),
    ...(files && { files }),
    ...(player !== undefined && { player }),
    ...(cwd !== undefined && { cwd }),
    ...(env && { env }),
    ...(bin && { bin }),
    ...(processes && { processes }),
    ...(boot && { boot }),
  }
  const accounts = resolveAccounts(setup)
  reportClashes(setup, accounts, issues)
  checkNames(setup, accounts, issues)
  checkBootSetup(setup, issues)
  return issues.result(setup)
}
