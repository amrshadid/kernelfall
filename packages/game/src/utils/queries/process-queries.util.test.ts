import { describe, expect, it } from 'vitest'
import { shellSession, stamped } from '#test/index'
import {
  argvOf,
  childrenOf,
  execsOf,
  exitedWith,
  exitOf,
  forkedChildren,
  judgedProcesses,
  playerPrograms,
  programsNamed,
  ranProgram,
  reapedBy,
} from '#utils/queries/process-queries.util'

describe('playerPrograms and programsNamed', () => {
  it("judges the player's own program, not the /bin programs or the children it forks", () => {
    expect(playerPrograms(shellSession())).toEqual([2])
  })

  it('judges a program the rescue shell forked: the shell runs no program of its own in the events', () => {
    const fromShell = stamped([
      { type: 'sched_process_fork', parentPid: 1, childPid: 5 },
      { type: 'sched_process_exec', pid: 5, oldPid: 5, filename: './hello' },
      { type: 'sched_process_fork', parentPid: 5, childPid: 6 },
      { type: 'sched_process_exec', pid: 6, oldPid: 6, filename: './helper' },
    ])

    expect(playerPrograms(fromShell)).toEqual([5])
  })

  it('finds every process that ran a program, by name', () => {
    expect(programsNamed(shellSession(), 'ls')).toEqual([3])
    expect(programsNamed(shellSession(), 'cat')).toEqual([])
  })

  it('judges the player by default, or the program a check names', () => {
    expect(judgedProcesses(shellSession())).toEqual([2])
    expect(judgedProcesses(shellSession(), { program: 'sh' })).toEqual([4])
  })
})

describe('argvOf', () => {
  // `env GREETING=hi printenv GREETING`: env finds printenv on the second PATH folder.
  const events = stamped([
    {
      type: 'sys_enter',
      pid: 3,
      name: 'execve',
      args: [0, 0, 0],
      data: '/usr/bin/env',
      argv: ['env', 'GREETING=hi', 'printenv', 'GREETING'],
    },
    { type: 'sched_process_exec', pid: 3, oldPid: 3, filename: '/usr/bin/env' },
    { type: 'sys_exit', pid: 3, name: 'execve', ret: 0 },
    {
      type: 'sys_enter',
      pid: 3,
      name: 'execve',
      args: [0, 0, 0],
      data: '/bin/printenv',
      argv: ['printenv', 'GREETING'],
    },
    { type: 'sys_exit', pid: 3, name: 'execve', ret: -2 },
    {
      type: 'sys_enter',
      pid: 3,
      name: 'execve',
      args: [0, 0, 0],
      data: '/usr/bin/printenv',
      argv: ['printenv', 'GREETING'],
    },
    { type: 'sched_process_exec', pid: 3, oldPid: 3, filename: '/usr/bin/printenv' },
    { type: 'sys_exit', pid: 3, name: 'execve', ret: 0 },
  ])

  it('reads the argv of the execve() that made the process each program, skipping the ones that failed', () => {
    expect(argvOf(events, 3)).toEqual(['env', 'GREETING=hi', 'printenv', 'GREETING'])
    expect(argvOf(events, 3, 'env')).toEqual(['env', 'GREETING=hi', 'printenv', 'GREETING'])
    expect(argvOf(events, 3, 'printenv')).toEqual(['printenv', 'GREETING'])
  })

  it("is undefined for a program the process never became, or a trace that didn't record argv", () => {
    expect(argvOf(events, 3, 'ls')).toBeUndefined()
    expect(argvOf(shellSession(), 3)).toBeUndefined()
  })
})

describe('execsOf and exitOf', () => {
  it('lists what a process became and how it ended', () => {
    expect(execsOf(shellSession(), 3).map((event) => event.filename)).toEqual(['/bin/ls'])
    expect(exitOf(shellSession(), 3)).toEqual({ seq: 15, code: 0, signal: undefined })
    expect(exitOf(shellSession(), 4)).toBeUndefined()
  })
})

describe('exitedWith', () => {
  it('is a normal exit with that status, never a death by signal', () => {
    expect(exitedWith({ seq: 1, code: 0, signal: undefined }, 0)).toBe(true)
    expect(exitedWith({ seq: 1, code: 1, signal: undefined }, 0)).toBe(false)
    expect(exitedWith({ seq: 1, code: 0, signal: 9 }, 0)).toBe(false)
    expect(exitedWith(undefined, 0)).toBe(false)
  })
})

describe('reapedBy and forkedChildren', () => {
  it("pairs each child with the parent's wait4() that collected it", () => {
    expect([...reapedBy(shellSession(), 2).keys()]).toEqual([3])
    expect(forkedChildren(shellSession(), 2)).toEqual([
      { pid: 3, forkSeq: 7, reapedSeq: 16 },
      { pid: 4, forkSeq: 18, reapedSeq: null },
    ])
    expect(forkedChildren(shellSession(), 3)).toEqual([])
  })
})

describe('childrenOf and ranProgram', () => {
  it('tells what each child ran, printed and how it ended', () => {
    expect(childrenOf(shellSession(), 2)).toEqual([
      {
        pid: 3,
        forkSeq: 7,
        reapedSeq: 16,
        programs: ['/bin/ls'],
        execErrors: [],
        stdout: 'bin\n',
        stderr: '',
        exit: { seq: 15, code: 0, signal: undefined },
      },
      {
        pid: 4,
        forkSeq: 18,
        reapedSeq: null,
        programs: ['/bin/sh'],
        execErrors: [],
        stdout: '',
        stderr: '',
        exit: undefined,
      },
    ])
  })

  it('matches a program by name, wherever it was run from', () => {
    const [ls] = childrenOf(shellSession(), 2)
    expect(ls && ranProgram(ls, 'ls')).toBe(true)
    expect(ls && ranProgram(ls, 'sh')).toBe(false)
  })
})
