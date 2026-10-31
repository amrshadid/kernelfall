import type { LevelDialogs } from '@features/level/types'
import type { LevelRunState } from '@kernelfall/game/types'
import { createLevelRun } from '@kernelfall/game/utils'
import { appContent, labelOf } from '@kernelfall/levels/utils'
import { describe, expect, it, vi } from 'vitest'
import { MACHINE_STATUS, TERMINAL_LABELS } from './level-layout.constants'
import { type LevelLayoutInput, levelLayoutOf } from './level-layout.util'

const FIRST_WORDS = 'prologue-boot-path-02-first-words'
const RUN_ANYTHING = 'act1-process-district-04-run-anything'

function dialogs(fields: Partial<LevelDialogs> = {}): LevelDialogs {
  return {
    reviewing: null,
    review: vi.fn(),
    toggleReview: vi.fn(),
    taintOpen: false,
    setTaintOpen: vi.fn(),
    referenceOpen: false,
    setReferenceOpen: vi.fn(),
    replayOpen: false,
    setReplayOpen: vi.fn(),
    ...fields,
  }
}

function input(levelId: string, run: Partial<LevelRunState> = {}, fields: Partial<LevelLayoutInput> = {}) {
  const loaded = appContent()
  if (!loaded.ok) {
    throw new Error(loaded.errors.join('\n'))
  }
  const content = loaded.value
  const level = content.game.level(levelId)
  const label = labelOf(content, levelId)
  if (!level || !label) {
    throw new Error(`no ${levelId}`)
  }
  const ok = async () => ({ success: true }) as const
  return {
    chrome: { onMenu: vi.fn() },
    content,
    level,
    label,
    run: { ...createLevelRun(levelId), ...run },
    taint: 0,
    taintEntries: [],
    check: { verdict: null, heldTaint: [], hasChecker: true },
    panels: { editor: true, xray: true },
    slots: { editor: null, terminal: null, xray: null },
    dialogs: dialogs(),
    hintEnabled: true,
    actions: {
      next: vi.fn(ok),
      revealHint: vi.fn(ok),
      fixFirst: vi.fn(ok),
      acceptTaint: vi.fn(ok),
      respawn: vi.fn(ok),
    },
    continueWithReference: vi.fn(async () => undefined),
    nextKeys: 'Alt+N',
    machine: { phase: 'ready', detail: null },
    save: 'saved',
    savedAgoMs: 1000,
    onShortcuts: vi.fn(),
    navigate: vi.fn(),
    runChip: vi.fn(),
    placement: null,
    replay: vi.fn(),
    ...fields,
  } as unknown as LevelLayoutInput
}

describe('levelLayoutOf', () => {
  it('names the level in the running head, the top bar and the title block', () => {
    const layout = levelLayoutOf(input(RUN_ANYTHING, { phase: 'build' }))
    expect(layout.page).toBe('Run Anything(1.4)')
    expect(layout.bar.heading).toBe('1.4 Run Anything')
    expect(layout.bar.subheading.startsWith('Act I · ')).toBe(true)
    expect(layout.titleBlock.map((entry) => entry.label)).toEqual(['Drawing', 'Level', 'Sheet', 'Revision (Taint)'])
    expect(layout.panels.emphasis).toBe('build')
    expect(layout.terminalLabel).toBe(TERMINAL_LABELS.default)
    expect(layout.status.machine).toBe(MACHINE_STATUS.ready)
    expect(layout.card).toBeNull()
  })

  it("gives the Prologue init's shell, says Linux is booting, and shows a card at the end", () => {
    const booting = { phase: 'booting', detail: null } as const
    const layout = levelLayoutOf(input(FIRST_WORDS, { phase: 'card' }, { machine: booting }))
    expect(layout.terminalLabel).toBe(TERMINAL_LABELS.prologue)
    expect(layout.status.machine).toBe(MACHINE_STATUS.booting)
    expect(layout.card).not.toBeNull()
  })

  it('offers only the way back while looking at a done step', () => {
    const view = dialogs({ reviewing: 'scene' })
    const layout = levelLayoutOf(input(RUN_ANYTHING, { phase: 'build' }, { dialogs: view }))
    expect(layout.guide.actions.map((action) => action.id)).toEqual(['back'])
    layout.guide.actions[0]?.onSelect()
    expect(view.review).toHaveBeenCalledWith(null)
  })

  it('opens and closes the Taint and reference dialogs through the view state', () => {
    const view = dialogs({ referenceOpen: true })
    const given = input(RUN_ANYTHING, { phase: 'build' }, { dialogs: view })
    const layout = levelLayoutOf(given)
    layout.bar.onOpenTaint()
    expect(view.setTaintOpen).toHaveBeenCalledWith(true)
    layout.reference.onConfirm()
    expect(view.setReferenceOpen).toHaveBeenCalledWith(false)
    expect(given.continueWithReference).toHaveBeenCalledOnce()
    layout.bar.onReview('see')
    expect(view.toggleReview).toHaveBeenCalledWith('see')
  })

  it('asks before a replay drops the play-through, then replays', () => {
    const view = dialogs({ replayOpen: true })
    const given = input(RUN_ANYTHING, { phase: 'build' }, { dialogs: view })
    const layout = levelLayoutOf(given)
    layout.bar.onReplay()
    expect(view.setReplayOpen).toHaveBeenCalledWith(true)
    expect(given.replay).not.toHaveBeenCalled()
    layout.replay.onConfirm()
    expect(view.setReplayOpen).toHaveBeenCalledWith(false)
    expect(given.replay).toHaveBeenCalledOnce()
  })
})
