import { describe, expect, it } from 'vitest'
import { MACHINE_LOCK_TEXT, RESTORING_HOLDS_KEYS, RUN_FAILED, RUN_WAITS } from './machine-lock.constants'
import { machineLockOf } from './machine-lock.util'

describe('machineLockOf', () => {
  it('lets everything through once bash is at its prompt', () => {
    expect(machineLockOf({ phase: 'ready', detail: null }, false)).toBeNull()
    expect(machineLockOf({ phase: 'ready', detail: null }, true)).toBeNull()
  })

  it.each(['off', 'loading', 'booting', 'restoring'] as const)('locks the terminal and Run while %s', (phase) => {
    const lock = machineLockOf({ phase, detail: null }, false)
    expect(lock).toEqual({
      phase,
      title: MACHINE_LOCK_TEXT[phase].title,
      detail: MACHINE_LOCK_TEXT[phase].detail,
      failed: false,
      typing: false,
      holdsKeys: false,
      runReason: `${MACHINE_LOCK_TEXT[phase].title}. ${RUN_WAITS}`,
    })
  })

  it("prefers the status's own words", () => {
    expect(machineLockOf({ phase: 'loading', detail: '42 of 80 MB' }, false)?.detail).toBe('42 of 80 MB')
  })

  it('keeps a level setup locked, but hands a reboot to the player for GRUB', () => {
    expect(machineLockOf({ phase: 'restoring', detail: null }, true)?.typing).toBe(false)
    expect(machineLockOf({ phase: 'booting', detail: null }, true)?.typing).toBe(true)
  })

  // Typed during a Replay, only the first key used to survive: the plate dropped the rest.
  it("holds keys typed during a level setup for its new shell, but not during the first visit's restore", () => {
    expect(machineLockOf({ phase: 'restoring', detail: null }, true)).toMatchObject({
      holdsKeys: true,
      detail: RESTORING_HOLDS_KEYS,
    })
    expect(machineLockOf({ phase: 'restoring', detail: null }, false)?.holdsKeys).toBe(false)
    expect(machineLockOf({ phase: 'booting', detail: null }, true)?.holdsKeys).toBe(false)
  })

  it('shows why it failed and keeps Run off', () => {
    const lock = machineLockOf({ phase: 'failed', detail: 'wasm failed to load' }, true)
    expect(lock).toMatchObject({ failed: true, typing: false, detail: 'wasm failed to load', runReason: RUN_FAILED })
  })
})
