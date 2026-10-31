import { describe, expect, it } from 'vitest'
import { isDefaultSetup, planSetup } from '#utils/vm-setup/setup-plan.util'
import { setupScript } from '#utils/vm-setup/setup-script.util'

const DEFAULT = setupScript({})
const LAB = setupScript({ cwd: '/tmp', processes: [{ argv: ['sleep', '600'], pid: 400 }] })

describe('isDefaultSetup', () => {
  it('knows the lines of a level without a lab: block', () => {
    expect(isDefaultSetup(DEFAULT)).toBe(true)
    expect(isDefaultSetup(setupScript({ player: 'you' }))).toBe(true)
  })

  it('tells any real setup apart', () => {
    expect(isDefaultSetup(LAB)).toBe(false)
    expect(isDefaultSetup(setupScript({ player: 'guest' }))).toBe(false)
    expect(isDefaultSetup([])).toBe(false)
  })
})

describe('planSetup', () => {
  it('sets a pristine Machine up without restoring the boot it already is', () => {
    expect(planSetup({ pristine: true, lines: LAB, reboot: false })).toEqual({ restore: false, apply: true })
  })

  it('leaves a pristine Machine alone for a level with no setup', () => {
    expect(planSetup({ pristine: true, lines: DEFAULT, reboot: false })).toEqual({ restore: false, apply: false })
  })

  it('still reboots a pristine Machine for a boot level', () => {
    expect(planSetup({ pristine: true, lines: DEFAULT, reboot: true })).toEqual({ restore: false, apply: true })
  })

  it('restores a used Machine before any setup, even an empty one', () => {
    expect(planSetup({ pristine: false, lines: LAB, reboot: false })).toEqual({ restore: true, apply: true })
    expect(planSetup({ pristine: false, lines: DEFAULT, reboot: false })).toEqual({ restore: true, apply: true })
    expect(planSetup({ pristine: false, lines: DEFAULT, reboot: true })).toEqual({ restore: true, apply: true })
  })
})
