import { describe, expect, it } from 'vitest'
import { judges, LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'

const SHELL = 300
const level = levelUnderTest('prologue-machine-in-section-07-who-runs')

const STATUS = 'Name:\trescue\nState:\tS (sleeping)\nPid:\t300\nPPid:\t1\n'

const catStatus = (path: string) =>
  new LabEventLog().spawn(SHELL, 320, '/bin/cat').readFile(320, path, STATUS).exit(320, SHELL).events

/** One run of whoami as pid `pid`; `parent` is what getppid() answers, and what it prints. */
function whoami(
  pid: number,
  { parent = SHELL, asksParent = true, printed }: { parent?: number; asksParent?: boolean; printed?: string } = {}
) {
  const log = new LabEventLog().spawn(SHELL, pid, './whoami').call(pid, 'getpid', [], pid)
  log.write(pid, 1, `I am process ${pid}\n`)
  if (asksParent) {
    log.call(pid, 'getppid', [], parent).write(pid, 1, printed ?? `My parent is ${parent}\n`)
  }
  return log.exit(pid, SHELL).events
}

describe('Who Runs', () => {
  it("passes with the shell's status read and the reference whoami run twice, with zero Taint", () => {
    const verdict = verdictOf(level, [catStatus('/proc/300/status'), whoami(321), whoami(322)])

    expect(verdict).toEqual({ passed: true, missing: [], taint: [] })
  })

  it('shows what the starter still misses: its parent', () => {
    expect(metBy(level, whoami(321, { asksParent: false }))).toEqual(['exits-zero', 'prints-own-pid'])
  })

  it("wants the parent's PID printed, and the parent to be the shell that started it", () => {
    expect(metBy(level, whoami(321, { printed: 'My parent is me\n' }))).not.toContain('prints-parent-pid')
    expect(metBy(level, whoami(321, { parent: 1 }))).not.toContain('prints-parent-pid')
  })

  it('finds the shell by its wait4() when the fork is not in the events', () => {
    const run = new LabEventLog()
      .exec(2, './whoami')
      .call(2, 'getpid', [], 2)
      .call(2, 'getppid', [], 1)
      .write(2, 1, 'I am process 2\nMy parent is 1\n')
      .exit(2, 1).events

    expect(metBy(level, run)).toContain('prints-parent-pid')
  })

  it('takes any process status file in /proc, read by any program', () => {
    expect(metBy(level, catStatus('/proc/self/status'))).toEqual(['reads-proc-status'])
    expect(metBy(level, catStatus('/proc/meminfo'))).toEqual([])
  })

  it('judges whoami and reads of /proc status files, not other commands', () => {
    expect(judges(level, catStatus('/proc/1/status'))).toBe(true)
    expect(judges(level, catStatus('/etc/motd'))).toBe(false)
  })
})
