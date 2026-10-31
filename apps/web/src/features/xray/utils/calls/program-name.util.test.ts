import { describe, expect, it } from 'vitest'
import { baseName, programOf } from './program-name.util'

describe('baseName', () => {
  it('keeps the last part of a path', () => {
    expect(baseName('/bin/ls')).toBe('ls')
    expect(baseName('./ksh-lite')).toBe('ksh-lite')
    expect(baseName('echo')).toBe('echo')
  })
})

describe('programOf', () => {
  it('names the program the command line leaves running, as comm would', () => {
    expect(programOf('echo hello')).toBe('echo')
    expect(programOf('cc hello.c -o hello && ./hello')).toBe('hello')
    expect(programOf('prlimit --nproc=2 ./ksh-lite')).toBe('ksh-lite')
    expect(programOf('/bin/echo a b')).toBe('echo')
  })
})
