import { describe, expect, it } from 'vitest'
import { volumeOf } from './title-volume.util'

describe('volumeOf', () => {
  it("prints a numbered act as the manual's volume, subtitle and all", () => {
    expect(volumeOf('Act I: Userland')).toBe('Volume I: Userland')
    expect(volumeOf('Act II: The Deep')).toBe('Volume II: The Deep')
    expect(volumeOf('Act III')).toBe('Volume III')
  })

  it('prints an act without a number as it is named, never as Volume I', () => {
    expect(volumeOf('Prologue')).toBe('Prologue')
  })
})
