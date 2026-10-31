// @vitest-environment jsdom
import type { VmStatus } from '@kernelfall/machine/types'
import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useMachineLock } from './useMachineLock.hook'

afterEach(cleanup)

const at = (phase: VmStatus['phase']): { status: VmStatus } => ({ status: { phase, detail: null } })

describe('useMachineLock', () => {
  it('locks from loading through the first boot, and opens once ready', () => {
    const { result, rerender } = renderHook(({ status }) => useMachineLock(status), { initialProps: at('loading') })
    expect(result.current).toMatchObject({ phase: 'loading', typing: false })
    rerender(at('booting'))
    expect(result.current).toMatchObject({ phase: 'booting', typing: false })
    rerender(at('ready'))
    expect(result.current).toBeNull()
  })

  it('locks a level setup again, and lets keys through a reboot that follows', () => {
    const { result, rerender } = renderHook(({ status }) => useMachineLock(status), { initialProps: at('ready') })
    rerender(at('restoring'))
    expect(result.current).toMatchObject({ phase: 'restoring', typing: false })
    rerender(at('booting'))
    expect(result.current).toMatchObject({ phase: 'booting', typing: true })
  })
})
