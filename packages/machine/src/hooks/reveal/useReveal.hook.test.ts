// @vitest-environment jsdom
import { eventBus } from '@kernelfall/core/services'
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MACHINE_EVENTS } from '#events/types'
import { useReveal } from '#hooks/reveal/useReveal.hook'

describe('useReveal', () => {
  afterEach(() => {
    eventBus.removeAllListeners()
  })

  it('emits reveal requests for the editor', () => {
    const revealed: unknown[] = []
    eventBus.on(MACHINE_EVENTS.REVEAL, (event) => {
      revealed.push(event.payload)
    })
    renderHook(() => useReveal()).result.current.reveal({ file: 'main.c', line: 3, column: 5 })
    expect(revealed).toEqual([{ file: 'main.c', line: 3, column: 5 }])
  })
})
