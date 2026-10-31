import { describe, expect, it } from 'vitest'
import { buildAndRunCommand, defaultRunCommand } from './run-command.util'

describe('defaultRunCommand', () => {
  it('uses make when there is a Makefile', () => {
    expect(defaultRunCommand(['run.c', 'ksh.c', 'Makefile'], 'run.c')).toBe('make')
    expect(defaultRunCommand(['run.c', 'makefile'], 'run.c')).toBe('make')
  })

  it('builds and runs the open C file otherwise', () => {
    expect(defaultRunCommand(['hello.c', 'util.h'], 'hello.c')).toBe('gcc -Wall -Wextra hello.c -o hello && ./hello')
    expect(defaultRunCommand(['util.h', 'main.c'], 'util.h')).toBe('gcc -Wall -Wextra main.c -o main && ./main')
  })

  it('falls back to make when there is no C file to build', () => {
    expect(defaultRunCommand(['notes.txt'], 'notes.txt')).toBe('make')
  })
})

describe('buildAndRunCommand', () => {
  it('names the program after the source file', () => {
    expect(buildAndRunCommand('ksh-lite.c')).toBe('gcc -Wall -Wextra ksh-lite.c -o ksh-lite && ./ksh-lite')
  })
})
