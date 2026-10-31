import { describe, expect, it } from 'vitest'
import { judges, LabEventLog, levelUnderTest, metBy, verdictOf } from '#test/index'
import { machineFacts } from '#test/machine-facts'

const SHELL = 474
const level = levelUnderTest('prologue-machine-in-section-07-who-runs')

const STATUS = machineFacts().outputs['cat /proc/$$/status'] ?? ''

const catStatus = (path: string) =>
  new LabEventLog().spawn(SHELL, 320, '/bin/cat').readFile(320, path, STATUS).exit(320, SHELL).events

const TOP = [
  'Mem: 21676K used, 202040K free, 4K shrd, 0K buff, 2848K cached',
  'CPU:   8% usr  52% sys   0% nic   0% idle   0% io  39% irq   0% sirq',
  'Load average: 0.86 0.20 0.06 4/60 502',
  '  PID  PPID USER     STAT   VSZ %VSZ CPU %CPU COMMAND',
  '  467     1 root     S     1716   1%   0  25% cat /sys/kernel/tracing/trace_pipe',
  '  496   474 you      R     1652   1%   0  11% yes',
  '  497   474 you      R     1652   1%   0  11% yes',
  '  501   474 you      R     1664   1%   0   8% top -b -n 1',
  '  495   474 you      R     1652   1%   0   7% yes',
  '',
].join('\n')

const table = (program: string, text: string) =>
  new LabEventLog().spawn(SHELL, 501, program).write(501, 1, text).exit(501, SHELL).events

function mypid(
  pid: number,
  { parent = SHELL, asksParent = true, printed }: { parent?: number; asksParent?: boolean; printed?: string } = {}
) {
  const log = new LabEventLog().spawn(SHELL, pid, './mypid').call(pid, 'getpid', [], pid)
  log.write(pid, 1, `I am process ${pid}\n`)
  if (asksParent) {
    log.call(pid, 'getppid', [], parent).write(pid, 1, printed ?? `My parent is ${parent}\n`)
  }
  return log.exit(pid, SHELL).events
}

describe('Who Runs', () => {
  it("passes with the shell's status, three yes in top and the reference mypid run twice, with zero Taint", () => {
    const verdict = verdictOf(level, [
      catStatus('/proc/474/status'),
      table('/usr/bin/top', TOP),
      mypid(492),
      mypid(493),
    ])

    expect(verdict).toEqual({ passed: true, missing: [], taint: [] })
  })

  it('shows what the starter still misses: its parent', () => {
    expect(metBy(level, mypid(492, { asksParent: false }))).toEqual(['exits-zero', 'prints-own-pid'])
  })

  it("wants the parent's PID printed, and the parent to be the shell that started it", () => {
    expect(metBy(level, mypid(492, { printed: 'My parent is me\n' }))).not.toContain('prints-parent-pid')
    expect(metBy(level, mypid(492, { parent: 1 }))).not.toContain('prints-parent-pid')
  })

  it('finds the shell by its wait4() when the fork is not in the events', () => {
    const run = new LabEventLog()
      .exec(2, './mypid')
      .call(2, 'getpid', [], 2)
      .call(2, 'getppid', [], 1)
      .write(2, 1, 'I am process 2\nMy parent is 1\n')
      .exit(2, 1).events

    expect(metBy(level, run)).toContain('prints-parent-pid')
  })

  it('wants three yes ready to run at once, in top or ps', () => {
    const ps = 'PID   STAT TIME  COMMAND\n  495 R     0:00 yes\n  496 R     0:00 yes\n  497 R     0:00 yes\n'
    const two = TOP.split('\n')
      .filter((line) => !line.includes(' 495 '))
      .join('\n')

    expect(metBy(level, table('/bin/ps', ps))).toEqual(['shares-one-cpu'])
    expect(metBy(level, table('/usr/bin/top', two))).toEqual([])
  })

  it('takes any process status file in /proc, read by any program', () => {
    expect(metBy(level, catStatus('/proc/self/status'))).toEqual(['reads-proc-status'])
    expect(metBy(level, catStatus('/proc/meminfo'))).toEqual([])
  })

  it('judges mypid, ps, top and reads of /proc status files, not other commands', () => {
    expect(judges(level, catStatus('/proc/1/status'))).toBe(true)
    expect(judges(level, catStatus('/etc/motd'))).toBe(false)
  })
})
