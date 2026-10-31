import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ACCOUNTS,
  findGroup,
  findUser,
  loginCred,
  loginEnv,
  resolveAccounts,
  resolveLabProcesses,
} from '#utils/lab-setup/accounts.util'

const PATH = 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'

describe('resolveLabProcesses', () => {
  it("runs each program as its user, the player's by default, with that user's login environment", () => {
    const setup = {
      users: [{ name: 'guest', uid: 1001 }],
      processes: [
        { argv: ['sleep', '600'], pid: 401 },
        { argv: ['cat'], user: 'guest', stdout: '/dev/null' },
      ],
    }
    expect(resolveLabProcesses(setup)).toEqual([
      {
        argv: ['sleep', '600'],
        pid: 401,
        cred: { uid: 1000, gid: 1000, groups: [1000] },
        env: [PATH, 'HOME=/home/you', 'USER=you', 'LOGNAME=you'],
      },
      {
        argv: ['cat'],
        cred: { uid: 1001, gid: 1001, groups: [1001] },
        env: [PATH, 'HOME=/home/guest', 'USER=guest', 'LOGNAME=guest'],
        stdout: '/dev/null',
      },
    ])
    expect(resolveLabProcesses({})).toEqual([])
  })

  it('throws for a user the setup has no account for', () => {
    expect(() => resolveLabProcesses({ processes: [{ argv: ['yes'], user: 'ghost' }] })).toThrow('ghost')
  })
})

describe('resolveAccounts', () => {
  it("has Alpine's root and the image's player, with bash", () => {
    expect(DEFAULT_ACCOUNTS.users).toEqual([
      { name: 'root', uid: 0, gid: 0, home: '/root', shell: '/bin/sh' },
      { name: 'you', uid: 1000, gid: 1000, home: '/home/you', shell: '/bin/bash' },
    ])
    expect(findGroup(DEFAULT_ACCOUNTS, 'kmem')?.gid).toBe(9)
  })

  it('keeps root and you first and fills in useradd defaults', () => {
    const accounts = resolveAccounts({
      users: [
        { name: 'ada', uid: 1001 },
        { name: 'admin', uid: 0, gid: 0 },
      ],
    })
    expect(accounts.users.map((u) => u.name)).toEqual(['root', 'you', 'ada', 'admin'])
    expect(findUser(accounts, 'ada')).toEqual({
      name: 'ada',
      uid: 1001,
      gid: 1001,
      home: '/home/ada',
      shell: '/bin/sh',
    })
    expect(findUser(accounts, 'admin')?.home).toBe('/root')
  })

  it("gives a user whose primary gid no group has a group of its own, as useradd's USERGROUPS_ENAB does", () => {
    const accounts = resolveAccounts({ users: [{ name: 'ada', uid: 1001 }] })
    expect(findGroup(accounts, 'ada')).toEqual({ name: 'ada', gid: 1001, members: [] })
  })

  it("uses a declared group as a user's primary group without adding another", () => {
    const accounts = resolveAccounts({
      users: [{ name: 'ada', uid: 1001, gid: 100 }],
      groups: [{ name: 'users', gid: 100 }],
    })
    expect(accounts.groups.map((g) => g.name)).toEqual(['root', 'tty', 'disk', 'kmem', 'shadow', 'you', 'users'])
  })
})

describe('loginCred', () => {
  it('starts with the primary group, then the groups listing the user in file order', () => {
    const accounts = resolveAccounts({
      groups: [
        { name: 'wheel', gid: 10, members: ['you'] },
        { name: 'audio', gid: 29, members: ['ada'] },
        { name: 'video', gid: 44, members: ['you'] },
      ],
    })
    const you = findUser(accounts, 'you')
    expect(you && loginCred(accounts, you)).toEqual({ uid: 1000, gid: 1000, groups: [1000, 10, 44] })
  })
})

describe('loginEnv', () => {
  it("passes Alpine's PATH, HOME, USER and LOGNAME, then the extra variables, an extra one replacing a default", () => {
    expect(loginEnv({ name: 'you', home: '/home/you' })).toEqual([PATH, 'HOME=/home/you', 'USER=you', 'LOGNAME=you'])
    expect(loginEnv({ name: 'root', home: '/root' }, { EDITOR: 'nano', PATH: '/bin' })).toEqual([
      'PATH=/bin',
      'HOME=/root',
      'USER=root',
      'LOGNAME=root',
      'EDITOR=nano',
    ])
  })
})
