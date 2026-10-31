import { afterEach, describe, expect, it } from 'vitest'
import { configureMachine, getMachineConfig, resetMachineConfig } from '#config'
import type { MachineEndpoint } from '#types/definitions/endpoint'

describe('machine config', () => {
  afterEach(resetMachineConfig)

  it('uses the options the app passes, and keeps the defaults for the rest', () => {
    const endpoint = {} as MachineEndpoint
    configureMachine({ createVmEndpoint: () => endpoint, vmBaseUrl: '/kernelfall/vm/' })
    expect(getMachineConfig().createVmEndpoint()).toBe(endpoint)
    expect(getMachineConfig().vmBaseUrl).toBe('/kernelfall/vm/')
    // The worker serves its own copy of the emulator unless the app names one.
    expect(getMachineConfig().vmWasmUrl).toBeNull()
  })

  it('restores the defaults on reset', () => {
    const defaults = getMachineConfig()
    configureMachine({ vmBaseUrl: '/elsewhere/' })
    resetMachineConfig()
    expect(getMachineConfig()).toEqual(defaults)
  })
})
