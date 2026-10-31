import { describe, expect, it } from 'vitest'
import { readsByAnyTask, tasksOf } from '#content/0-prologue/2-machine-in-section/lab-tasks.util.ts'
import { LabEventLog } from '#test/index'

describe('tasksOf', () => {
  it('lists every task once, in the order it first appears', () => {
    const events = new LabEventLog().spawn(300, 321, '/bin/cat').exit(321, 300).events

    expect(tasksOf(events)).toEqual([321, 300])
  })
})

describe('readsByAnyTask', () => {
  it('finds a file read by any task of the command, with what its reads returned', () => {
    const events = new LabEventLog()
      .spawn(300, 321, '/bin/cat')
      .readFile(321, '/proc/meminfo', 'MemTotal: 1 kB\n')
      .spawn(300, 322, '/bin/free')
      .readFile(322, '/proc/uptime', '1.0 1.0\n').events

    const reads = readsByAnyTask(events, (path) => path.startsWith('/proc/'))

    expect(reads.map(({ path, text }) => [path, text])).toEqual([
      ['/proc/meminfo', 'MemTotal: 1 kB\n'],
      ['/proc/uptime', '1.0 1.0\n'],
    ])
  })

  it('skips files that failed to open, and paths not wanted', () => {
    const events = new LabEventLog()
      .call(321, 'openat', [-100, 0, 0], -2, { data: '/proc/nosuch' })
      .readFile(321, '/etc/motd', 'Welcome\n', 4).events

    expect(readsByAnyTask(events, (path) => path.startsWith('/proc/'))).toEqual([])
  })
})
