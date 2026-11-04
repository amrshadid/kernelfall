import { describe, expect, it } from 'vitest'
import { programOf, runStageOf } from './run-stage.util'

const RUN = 'gcc -Wall -Wextra hello.c -o hello && ./hello'
const exec = (filename: string) => ({ type: 'sched_process_exec', filename })

describe('runStageOf', () => {
  it('finds the program Run starts after the build', () => {
    expect(programOf(RUN)).toBe('hello')
    expect(programOf('./ksh-lite')).toBe('ksh-lite')
    expect(programOf('make')).toBeNull()
  })

  it('is building until the program itself is executed, then running', () => {
    expect(runStageOf(RUN, [])).toBe('building')
    expect(runStageOf(RUN, [exec('/usr/bin/gcc'), exec('/usr/libexec/gcc/i586-alpine-linux-musl/15.2.0/cc1')])).toBe(
      'building'
    )
    expect(runStageOf(RUN, [exec('/usr/bin/gcc'), exec('/home/you/hello')])).toBe('running')
  })

  it('stays building for a command that starts no ./program', () => {
    expect(runStageOf('make', [exec('/usr/bin/make')])).toBe('building')
  })
})
