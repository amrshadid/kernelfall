import { describe, expect, it } from 'vitest'
import { CONTROL_LOST, createStoppedBootReader, createVmControl } from '#services/vm/vm-control.service'

/** A guest that answers each line after a tick, with what its command printed first. */
function guest(statusOf: (line: string) => number) {
  const sent: string[] = []
  const control = createVmControl((bytes) => {
    const line = new TextDecoder().decode(bytes).trimEnd()
    sent.push(line)
    setTimeout(() => {
      for (const byte of new TextEncoder().encode(`some output\r\nkf-done ${statusOf(line)}\r\n`)) {
        control.push(byte)
      }
    })
  })
  return { control, sent }
}

describe('the root control channel', () => {
  it('answers each line with its exit status, past whatever the command printed', async () => {
    const { control, sent } = guest((line) => (line === 'false' ? 1 : 0))
    expect(await control.run('id -u')).toBe(0)
    expect(await control.run('false')).toBe(1)
    expect(sent).toEqual(['id -u', 'false'])
  })

  it('captures what a line printed before its status', async () => {
    const { control } = guest(() => 0)
    expect(await control.capture('nproc')).toEqual({ status: 0, output: 'some output\r\n' })
  })

  it('gives up on a line a restore wiped, or one that never answers, and goes on with the next', async () => {
    const sent: string[] = []
    const control = createVmControl((bytes) => sent.push(new TextDecoder().decode(bytes).trimEnd()), 20)
    const wiped = control.run('chown you: hello.c')
    await Promise.resolve()
    control.drop()
    expect(await wiped).toBe(CONTROL_LOST)
    expect(await control.run('silence')).toBe(CONTROL_LOST)
    expect(sent).toEqual(['chown you: hello.c', 'silence'])
  })

  it("picks a stopped boot's report out of the port, whatever came before it, line ends and all", () => {
    const reports: string[] = []
    const reader = createStoppedBootReader((output) => reports.push(output))
    for (const byte of new TextEncoder().encode(
      'kf-done 0\r\n@kf:stopped\r\n/dev/sda2\r\next4\r\n@kf:cpus\r\n1\r\n@kf:end\r\nlater\r\n'
    )) {
      reader.push(byte)
    }
    expect(reports).toEqual(['@kf:stopped\n/dev/sda2\next4\n@kf:cpus\n1\n'])
  })

  it('sends the next line only once the previous one has finished', async () => {
    const { control, sent } = guest(() => 0)
    const first = control.run('adduser guest')
    const second = control.run('chown you: notes.txt')
    await Promise.resolve()
    expect(sent).toEqual(['adduser guest'])
    await first
    await second
    expect(sent).toEqual(['adduser guest', 'chown you: notes.txt'])
  })
})
