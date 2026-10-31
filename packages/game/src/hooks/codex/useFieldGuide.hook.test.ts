// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { configureGame } from '#config'
import { useFieldGuide } from '#hooks/codex/useFieldGuide.hook'
import {
  EXAMPLE_LEVEL,
  EXAMPLE_SKILLS,
  exampleOutline,
  FOLLOW_UP_LEVEL,
  installTestGame,
  renderGameActions,
  uninstallTestGame,
} from '#test/index'
import type { FieldGuideEntry } from '#types/definitions/field-guide'
import { createGameContent } from '#utils/content/index'

// exampleOutline() numbers the example level's slot "1".
const ECHO: FieldGuideEntry = {
  name: 'echo',
  kind: 'command',
  what: 'print its arguments',
  syscalls: ['write'],
  firstMet: '1',
  deepenedIn: [],
}

describe('useFieldGuide', () => {
  afterEach(uninstallTestGame)

  it('opens with the level that opens it, showing what that level meets', async () => {
    const { storage, clock } = installTestGame()
    const levels = [EXAMPLE_LEVEL, FOLLOW_UP_LEVEL]
    const content = createGameContent({
      acts: exampleOutline(levels),
      levels,
      skills: EXAMPLE_SKILLS,
      fieldGuide: { opensAt: '1', entries: [ECHO] },
    })
    if (!content.ok) {
      throw new Error(content.errors.join('\n'))
    }
    configureGame({ storage, clock, content: content.value })
    const { level, saves } = renderGameActions()
    await act(async () => {
      await saves.open()
    })
    const { result } = renderHook(() => useFieldGuide())
    expect(result.current).toEqual({ open: false, entries: [] })

    await act(async () => {
      await level.start(EXAMPLE_LEVEL.id)
    })

    expect(result.current).toEqual({ open: true, entries: [ECHO] })
  })
})
