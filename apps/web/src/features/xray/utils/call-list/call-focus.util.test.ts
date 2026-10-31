import type { XrayCall } from '@features/xray/types'
import type { LevelDefinition } from '@kernelfall/game/types'
import { describe, expect, it } from 'vitest'
import { callFocusOf, isFocusedCall } from './call-focus.util'

const level = (objectives: LevelDefinition['objectives'], taint: LevelDefinition['taint'] = []) => ({
  objectives,
  taint,
})

const call = (name: string, program: string, path: string | null = null) => ({ name, program, path }) as XrayCall

describe('callFocusOf', () => {
  it("names the calls each declared check judges, with the check's program", () => {
    const focus = callFocusOf(
      level([
        { id: 'a', text: '', check: { kind: 'compiles' } },
        { id: 'b', text: '', check: { kind: 'exit-status', status: 0 } },
        { id: 'c', text: '', check: { kind: 'wrote', fd: 1, program: 'grep' } },
        { id: 'd', text: '', check: { kind: 'syscall', names: ['rmdir', 'unlinkat'], program: 'rmdir' } },
        { id: 'e', text: '' },
      ])
    )
    expect(focus).toEqual([
      { names: ['execve', 'exit_group', 'exit'] },
      { names: ['write', 'writev'], program: 'grep' },
      { names: ['rmdir', 'unlinkat'], program: 'rmdir' },
    ])
  })

  it('watches a program that must exit with a status to its exit_group, and none without a level', () => {
    expect(callFocusOf(level([{ id: 'r', text: '', check: { kind: 'ran', program: 'wc', status: 0 } }]))).toEqual([
      { names: ['execve', 'exit_group'], program: 'wc' },
    ])
    expect(callFocusOf(null)).toEqual([])
  })

  it("adds the level's own xrayFocus for the shell's side no check names", () => {
    expect(callFocusOf({ ...level([]), xrayFocus: ['pipe', 'fork', 'dup2'] })).toEqual([
      { names: ['pipe', 'fork', 'dup2'] },
    ])
  })
})

describe('isFocusedCall', () => {
  it("scopes by the process's program, and counts an execve for the program it starts", () => {
    const focus = [{ names: ['execve', 'write'], program: 'echo' }]
    expect(isFocusedCall(call('write', 'echo'), 'echo', focus)).toBe(true)
    expect(isFocusedCall(call('write', 'bash'), 'bash', focus)).toBe(false)
    expect(isFocusedCall(call('execve', 'bash', '/bin/echo'), 'bash', focus)).toBe(true)
    expect(isFocusedCall(call('execve', 'bash', '/bin/ls'), 'ls', focus)).toBe(false)
  })
})
