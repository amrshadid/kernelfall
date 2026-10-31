// @vitest-environment jsdom
import { hrefOf } from '@shared/navigation'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCodexModal } from './useCodexModal.hook'

const LEVEL = 'act1-process-district-04-run-anything'

describe('useCodexModal', () => {
  let back: ReturnType<typeof vi.spyOn>
  let replace: ReturnType<typeof vi.fn>

  beforeEach(() => {
    back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
    replace = vi.fn()
    vi.stubGlobal('location', { ...window.location, replace })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('goes back over a card opened from a link on this screen, like browser Back', () => {
    const { result, rerender } = renderHook(({ cardId }) => useCodexModal(LEVEL, cardId), {
      initialProps: { cardId: null as string | null },
    })
    rerender({ cardId: 'fork' })

    result.current.close()
    expect(back).toHaveBeenCalledOnce()
    expect(replace).not.toHaveBeenCalled()
  })

  it('replaces a card the page was loaded with by the bare level, so closing never leaves the game', () => {
    const { result } = renderHook(() => useCodexModal(LEVEL, 'fork'))

    result.current.close()
    expect(replace).toHaveBeenCalledWith(hrefOf({ name: 'play', levelId: LEVEL }))
    expect(back).not.toHaveBeenCalled()
  })

  it("closes once: the dialog's own close after the address dropped the card does nothing", () => {
    const { result, rerender } = renderHook(({ cardId }) => useCodexModal(LEVEL, cardId), {
      initialProps: { cardId: 'fork' as string | null },
    })
    result.current.close()
    rerender({ cardId: null })
    result.current.close()
    expect(replace).toHaveBeenCalledOnce()
  })
})
