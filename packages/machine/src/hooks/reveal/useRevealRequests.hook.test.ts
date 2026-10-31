// @vitest-environment jsdom
import { eventBus } from '@kernelfall/core/services'
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { RevealPayload } from '#events/types'
import { useReveal } from '#hooks/reveal/useReveal.hook'
import { useRevealRequests } from '#hooks/reveal/useRevealRequests.hook'

describe('useRevealRequests', () => {
  afterEach(() => {
    eventBus.removeAllListeners()
  })

  it('receives the locations the editor is asked to show, with the latest handler', () => {
    const first: RevealPayload[] = []
    const latest: RevealPayload[] = []
    const { rerender } = renderHook(({ seen }) => useRevealRequests((location) => seen.push(location)), {
      initialProps: { seen: first },
    })
    const actions = renderHook(() => useReveal()).result.current

    actions.reveal({ file: 'main.c', line: 4, column: 1 })
    rerender({ seen: latest })
    actions.reveal({ file: 'util.c', line: 9, column: 2 })

    expect(first).toEqual([{ file: 'main.c', line: 4, column: 1 }])
    expect(latest).toEqual([{ file: 'util.c', line: 9, column: 2 }])
  })
})
