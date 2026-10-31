import { describe, expect, it } from 'vitest'
import { validateLabSetup } from '#utils/lab-setup/lab-setup.schema'

const errorsOf = (input: unknown): readonly string[] => {
  const result = validateLabSetup(input)
  return result.ok ? [] : result.errors
}

describe('validateLabSetup', () => {
  it('accepts an empty block: the Machine every level shares', () => {
    expect(validateLabSetup({})).toEqual({ ok: true, value: {} })
  })

  it('reads a full block, turning octal mode strings into numbers and defaulting kind to file', () => {
    const result = validateLabSetup({
      users: [{ name: 'ada', uid: 1001 }],
      groups: [{ name: 'wheel', gid: 10, members: ['you', 'ada'] }],
      files: [
        { path: '/srv', kind: 'dir', mode: '0750', owner: 'ada', group: 'wheel' },
        { path: '/srv/notes.txt', content: 'hello\n', mode: '0o600' },
      ],
      player: 'ada',
      cwd: '/srv',
      env: { EDITOR: 'nano' },
      bin: ['ls', 'cat'],
    })
    expect(result).toEqual({
      ok: true,
      value: {
        users: [{ name: 'ada', uid: 1001 }],
        groups: [{ name: 'wheel', gid: 10, members: ['you', 'ada'] }],
        files: [
          { path: '/srv', kind: 'dir', mode: 0o750, owner: 'ada', group: 'wheel' },
          { path: '/srv/notes.txt', kind: 'file', content: 'hello\n', mode: 0o600 },
        ],
        player: 'ada',
        cwd: '/srv',
        env: { EDITOR: 'nano' },
        bin: ['ls', 'cat'],
      },
    })
  })

  it('rejects something that is not an object', () => {
    expect(errorsOf([])).toEqual(['lab: expected an object, got a list'])
  })

  it('reports unknown fields, which are usually typos', () => {
    expect(errorsOf({ user: [] })).toEqual([
      'lab.user: unknown field (expected one of: users, groups, files, player, cwd, env, bin, processes, boot)',
    ])
  })

  it('has no CPU count: the Machine always has the one CPU v86 emulates', () => {
    expect(errorsOf({ cpus: 2 })).toHaveLength(1)
  })

  it('asks for a quoted mode, since YAML reads an unquoted 0644 as decimal 644', () => {
    expect(errorsOf({ files: [{ path: '/a', mode: 644 }] })).toEqual([
      "lab.files[0].mode: expected octal permission bits as a quoted string like '0644', got 644",
    ])
    expect(errorsOf({ files: [{ path: '/a', mode: '0899' }] })).toHaveLength(1)
    expect(errorsOf({ files: [{ path: '/a', mode: '17777' }] })).toEqual([
      'lab.files[0].mode: "17777" is more than the permission bits (at most 07777)',
    ])
  })

  it('accepts only absolute, normalized paths', () => {
    expect(errorsOf({ cwd: 'home/you' })).toEqual(['lab.cwd: "home/you" must be absolute (start with /)'])
    expect(errorsOf({ cwd: '/home/../etc' })).toHaveLength(1)
    expect(errorsOf({ cwd: '/home/' })).toHaveLength(1)
    expect(errorsOf({ cwd: '/home//you' })).toHaveLength(1)
    const longName = 'x'.repeat(256)
    expect(errorsOf({ cwd: `/${longName}` })).toEqual([`lab.cwd: "/${longName}" has a part longer than NAME_MAX (255)`])
    expect(errorsOf({ cwd: '/' })).toEqual([])
  })

  it('rejects a kind that is not file or dir, and content on a directory', () => {
    expect(errorsOf({ files: [{ path: '/a', kind: 'link' }] })).toEqual([
      'lab.files[0].kind: expected one of file, dir, got "link"',
    ])
    expect(errorsOf({ files: [{ path: '/a', kind: 'dir', content: 'x' }] })).toEqual([
      'lab.files[0].content: a directory has no content',
    ])
  })

  it('checks that every name it refers to is an account it has', () => {
    expect(
      errorsOf({
        groups: [{ name: 'staff', gid: 50, members: ['bob'] }],
        files: [{ path: '/a', owner: 'bob', group: 'nogroup' }],
        player: 'bob',
      })
    ).toEqual([
      'lab.groups[0].members[0]: no user named "bob"',
      'lab.files[0].owner: no user named "bob"',
      'lab.files[0].group: no group named "nogroup"',
      'lab.player: no user named "bob"',
    ])
  })

  it('rejects a user or group that clashes with root, you or another one', () => {
    expect(errorsOf({ users: [{ name: 'you', uid: 1001 }] })).toEqual(['lab.users: "you" appears more than once'])
    expect(errorsOf({ users: [{ name: 'ada', uid: 1000, gid: 1000 }] })).toEqual([
      'lab.users: 1000 appears more than once',
    ])
    expect(errorsOf({ groups: [{ name: 'staff', gid: 0 }] })).toEqual(['lab.groups: 0 appears more than once'])
  })

  it('checks account names, variable names and program names', () => {
    expect(errorsOf({ users: [{ name: 'Ada', uid: 1001 }] })).toHaveLength(1)
    expect(errorsOf({ env: { '1BAD': 'x' } })).toEqual(['lab.env.1BAD: is not a valid variable name'])
    expect(errorsOf({ env: { PORT: 80 } })).toEqual(['lab.env.PORT: expected text, got a number'])
    expect(errorsOf({ bin: ['ls', 'ls'] })).toEqual(['lab.bin: "ls" appears more than once'])
    expect(errorsOf({ bin: ['../sh'] })).toHaveLength(1)
  })

  it('reports every problem at once', () => {
    expect(errorsOf({ player: 7, cwd: 3, users: {} })).toEqual([
      'lab.users: expected a list, got an object',
      'lab.player: expected non-empty text, got a number',
      'lab.cwd: expected non-empty text, got a number',
    ])
  })

  it('leaves a bad entry out of the name checks, so one typo gives one error', () => {
    expect(errorsOf({ users: [{ name: 'ada', uid: -1 }], player: 'ada' })).toEqual([
      'lab.users[0].uid: expected a number from 0 to 4294967294, got -1',
      'lab.player: no user named "ada"',
    ])
  })

  it('reads empty content as an empty file', () => {
    expect(validateLabSetup({ files: [{ path: '/a', content: '' }] })).toEqual({
      ok: true,
      value: { files: [{ path: '/a', kind: 'file', content: '' }] },
    })
  })

  it("reads GRUB's entry, or none to start at the menu with the Machine's own", () => {
    const boot = { args: 'console=ttyS0 root=/dev/vda3 ro quiet' }
    expect(validateLabSetup({ boot })).toEqual({ ok: true, value: { boot } })
    expect(validateLabSetup({ boot: {} })).toEqual({ ok: true, value: { boot: {} } })
  })

  it('keeps the boot entry to one line, and refuses a firmware choice: the Machine is BIOS only', () => {
    expect(errorsOf({ boot: { args: 'ro\nquiet', firmware: 'uefi', timeout: 5 } })).toEqual([
      'lab.boot.firmware: unknown field (expected one of: args)',
      'lab.boot.timeout: unknown field (expected one of: args)',
      'lab.boot.args: must be one line of at most 2017 characters',
    ])
  })

  it('refuses with a boot what the restart would lose: the session, processes and tmpfs files', () => {
    expect(
      errorsOf({
        boot: {},
        cwd: '/tmp',
        processes: [{ argv: ['sleep', '600'] }],
        files: [{ path: '/run/note' }, { path: '/home/you/kept' }],
      })
    ).toEqual([
      "lab.cwd: doesn't survive the restart lab.boot makes",
      "lab.processes: doesn't survive the restart lab.boot makes",
      'lab.files[0].path: is on a tmpfs, emptied by the restart lab.boot makes',
    ])
  })

  it('reads the programs init has running, with their pids, users and stdout', () => {
    const processes = [
      { argv: ['sleep', '600'], pid: 401 },
      { argv: ['yes'], pid: 402, user: 'you', stdout: '/dev/null' },
    ]
    expect(validateLabSetup({ processes })).toEqual({ ok: true, value: { processes } })
  })

  it('checks each process: a program name, a free pid, a known user', () => {
    expect(
      errorsOf({
        processes: [
          { argv: [], pid: 1 },
          { argv: ['yes'], pid: 402, user: 'ghost', stdout: 'null' },
          { argv: ['sleep', '600'], pid: 402, cwd: '/' },
        ],
      })
    ).toEqual([
      'lab.processes[0].argv: needs at least the program name',
      'lab.processes[0].pid: expected a number from 2 to 32767, got 1',
      'lab.processes[1].stdout: "null" must be absolute (start with /)',
      'lab.processes[2].cwd: unknown field (expected one of: argv, pid, user, stdout)',
    ])
    expect(errorsOf({ processes: [{ argv: ['yes'], user: 'ghost' }] })).toEqual([
      'lab.processes[0].user: no user named "ghost"',
    ])
    expect(
      errorsOf({
        processes: [
          { argv: ['yes'], pid: 402 },
          { argv: ['yes'], pid: 402 },
        ],
      })
    ).toEqual(['lab.processes: 402 appears more than once'])
  })
})
