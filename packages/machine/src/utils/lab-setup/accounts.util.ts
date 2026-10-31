import {
  DISK_GID,
  INIT_CRED,
  KMEM_GID,
  PLAYER_CRED,
  PLAYER_HOME,
  PLAYER_NAME,
  SHADOW_GID,
  TTY_GID,
} from '#types/definitions/cred'
import type {
  Accounts,
  LabGroup,
  LabSetup,
  LabUser,
  ResolvedGroup,
  ResolvedLabProcess,
  ResolvedUser,
} from '#types/definitions/lab-setup'
import type { Cred } from '#types/definitions/task'

const ROOT_NAME = 'root'
const ROOT_HOME = '/root'
const HOME_BASE = '/home'
/** adduser's default shell on Alpine (busybox). */
const LOGIN_SHELL = '/bin/sh'
/** The player's shell, as the image's /etc/passwd gives it. */
const PLAYER_SHELL = '/bin/bash'
/** Alpine's /etc/profile PATH: what a login on the Machine starts with. */
const LOGIN_PATH = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

/** root and the player, and the groups that own terminals and disks: accounts every Machine has. */
export const DEFAULT_ACCOUNTS: Accounts = {
  users: [
    { name: ROOT_NAME, uid: INIT_CRED.uid, gid: INIT_CRED.gid, home: ROOT_HOME, shell: LOGIN_SHELL },
    { name: PLAYER_NAME, uid: PLAYER_CRED.uid, gid: PLAYER_CRED.gid, home: PLAYER_HOME, shell: PLAYER_SHELL },
  ],
  groups: [
    { name: ROOT_NAME, gid: INIT_CRED.gid, members: [] },
    { name: 'tty', gid: TTY_GID, members: [] },
    { name: 'disk', gid: DISK_GID, members: [] },
    { name: 'kmem', gid: KMEM_GID, members: [] },
    { name: 'shadow', gid: SHADOW_GID, members: [] },
    { name: PLAYER_NAME, gid: PLAYER_CRED.gid, members: [] },
  ],
}

// models useradd's defaults: HOME under /home (root's is /root) and a personal group (USERGROUPS_ENAB)
function resolveUser(user: LabUser): ResolvedUser {
  return {
    name: user.name,
    uid: user.uid,
    gid: user.gid ?? user.uid,
    home: user.home ?? (user.uid === INIT_CRED.uid ? ROOT_HOME : `${HOME_BASE}/${user.name}`),
    shell: user.shell ?? LOGIN_SHELL,
  }
}

const resolveGroup = (group: LabGroup): ResolvedGroup => ({
  name: group.name,
  gid: group.gid,
  members: group.members ?? [],
})

/**
 * root and `you` first. A user whose primary gid no group has gets a group named
 * after it, unless that name is taken. Assumes the setup passed `validateLabSetup()`.
 */
export function resolveAccounts(setup: LabSetup): Accounts {
  const users = [...DEFAULT_ACCOUNTS.users, ...(setup.users ?? []).map(resolveUser)]
  const groups = [...DEFAULT_ACCOUNTS.groups, ...(setup.groups ?? []).map(resolveGroup)]
  for (const user of users) {
    if (!groups.some((group) => group.gid === user.gid || group.name === user.name)) {
      groups.push({ name: user.name, gid: user.gid, members: [] })
    }
  }
  return { users, groups }
}

export function findUser(accounts: Accounts, name: string): ResolvedUser | undefined {
  return accounts.users.find((user) => user.name === name)
}

export function findGroup(accounts: Accounts, name: string): ResolvedGroup | undefined {
  return accounts.groups.find((group) => group.name === name)
}

// models initgroups(3): the primary group, then every group listing the user, in /etc/group's order
export function loginCred(accounts: Accounts, user: ResolvedUser): Cred {
  const supplementary = accounts.groups
    .filter((group) => group.gid !== user.gid && group.members.includes(user.name))
    .map((group) => group.gid)
  return { uid: user.uid, gid: user.gid, groups: [user.gid, ...supplementary] }
}

// models login(1): setup_environment(), which sets HOME, USER and LOGNAME for the user logging in
/** PATH, HOME, USER and LOGNAME, then the setup's variables, which replace a default of the same name. */
// SIMPLIFIED: no SHELL, TERM or MAIL: a level's background program has no login shell or terminal.
export function loginEnv(
  user: { readonly name: string; readonly home: string },
  extra: Readonly<Record<string, string>> = {}
): string[] {
  const env = new Map<string, string>([
    ['PATH', LOGIN_PATH],
    ['HOME', user.home],
    ['USER', user.name],
    ['LOGNAME', user.name],
  ])
  for (const [name, value] of Object.entries(extra)) {
    env.set(name, value)
  }
  return [...env].map(([name, value]) => `${name}=${value}`)
}

/**
 * The setup's background programs with their users' credentials and login
 * environments. Throws for an unknown user: validate with `validateLabSetup()` first.
 */
export function resolveLabProcesses(setup: LabSetup): ResolvedLabProcess[] {
  const accounts = resolveAccounts(setup)
  return (setup.processes ?? []).map((process) => {
    const name = process.user ?? setup.player ?? PLAYER_NAME
    const user = findUser(accounts, name)
    if (!user) {
      throw new Error(`resolveLabProcesses: no user named ${name}`)
    }
    return {
      argv: process.argv,
      ...(process.pid !== undefined && { pid: process.pid }),
      cred: loginCred(accounts, user),
      env: loginEnv(user, setup.env),
      ...(process.stdout !== undefined && { stdout: process.stdout }),
    }
  })
}
