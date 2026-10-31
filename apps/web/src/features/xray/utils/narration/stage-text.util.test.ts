import type { XrayStageText } from '@kernelfall/levels/types'
import { describe, expect, it } from 'vitest'
import { stageText } from './stage-text.util'

const TEXT: XrayStageText = {
  tick: '{name}()',
  title: '{program} calls {name}()',
  what: 'Calls `{name}`.',
  why: 'Only the kernel can.',
  deeper: 'Number {nr}.',
  gate: 'Number {nr}? Through you go.',
  simplified: 'X-ray skips {name}.',
  sources: [{ path: 'kernel/{name}.c', fn: '{name}()' }],
  predict: {
    question: 'What does `{name}` return?',
    explain: 'It returns {nr}.',
    answer: '{nr}',
    options: ['0', '{nr}', '0'],
  },
}
const VALUES = { name: 'fork', program: 'sh', nr: 57 }

describe('stageText', () => {
  it('fills every field and source from the values', () => {
    expect(stageText(TEXT, VALUES)).toEqual({
      tick: 'fork()',
      title: 'sh calls fork()',
      what: 'Calls `fork`.',
      why: 'Only the kernel can.',
      deeper: 'Number 57.',
      gate: 'Number 57? Through you go.',
      simplified: 'X-ray skips fork.',
      sources: [{ path: 'kernel/fork.c', fn: 'fork()' }],
    })
  })

  it("uses the call's own sources when the content names none", () => {
    const { sources: _none, ...text } = TEXT
    expect(stageText(text, VALUES, { sources: [{ path: 'kernel/fork.c' }] }).sources).toEqual([
      { path: 'kernel/fork.c' },
    ])
  })

  it("asks the content's guess, without repeating an option", () => {
    expect(stageText(TEXT, VALUES, { predict: 'content' }).predict).toEqual({
      question: 'What does `fork` return?',
      options: ['0', '57'],
      answer: '57',
      explain: 'It returns 57.',
    })
  })

  it('asks a guess with choices worked out from the call', () => {
    expect(stageText(TEXT, VALUES, { predict: { options: ['-1', '3'], answer: '3' } }).predict).toMatchObject({
      options: ['-1', '3'],
      answer: '3',
    })
  })

  it('drops the Gatekeeper line when nothing crossed the Gate', () => {
    expect(stageText(TEXT, VALUES, { gate: false }).gate).toBeUndefined()
  })
})
