import type { Stage } from '@features/xray/types'
import { describe, expect, it } from 'vitest'
import { plainText, transcriptOf } from './transcript.util'

const stage = (key: string, title: string): Stage<null> => ({
  key,
  tick: key,
  title,
  what: 'Calls `write()`, **once**.',
  why: 'Only the kernel can.',
  deeper: '',
  sources: [],
  scene: null,
})

describe('plainText', () => {
  it('drops the code and bold marks', () => {
    expect(plainText('`write()` is **one** call')).toBe('write() is one call')
  })
})

describe('transcriptOf', () => {
  it('numbers the stages and reads them without marks', () => {
    expect(transcriptOf([stage('call', '`ls` calls write()'), stage('gate', 'Through the Gate')])).toEqual([
      { key: 'call', title: '1. ls calls write()', what: 'Calls write(), once.', why: 'Only the kernel can.' },
      { key: 'gate', title: '2. Through the Gate', what: 'Calls write(), once.', why: 'Only the kernel can.' },
    ])
  })
})
