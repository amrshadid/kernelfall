import { afterEach, describe, expect, it } from 'vitest'
import { configureGame, getContent, getGameConfig, getGameNow, getStorage, resetGameConfig } from '#config'
import { createMemoryStorage, exampleContent, FakeClock } from '#test/index'
import type { GameOptions } from '#types/definitions/config'
import { DEFAULT_GAME_OPTIONS } from '#types/definitions/config'
import { HINT_COSTS, LEVEL_BASE_SCORE } from '#types/definitions/hints'
import { ACTIVE_TIME_IDLE_CAP_MS } from '#types/definitions/session'
import { CLEAN_REBOOT_MAX_TAINT, MAX_LEVEL_TAINT, UNSTABLE_REBOOT_MAX_TAINT } from '#types/definitions/taint'
import { scoreWithHints } from '#utils/hints/index'
import { levelTaint, selectEnding } from '#utils/taint/index'

afterEach(resetGameConfig)

const PLAY_MS = 30_000

const configure = (options: Partial<GameOptions> = {}) =>
  configureGame({ storage: createMemoryStorage(), content: exampleContent(), ...options })

describe('configureGame', () => {
  it('starts with the documented defaults', () => {
    expect(getGameConfig()).toMatchObject({
      autosave: true,
      activeTimeIdleCapMs: ACTIVE_TIME_IDLE_CAP_MS,
      levelBaseScore: LEVEL_BASE_SCORE,
      hintCosts: HINT_COSTS,
      cleanRebootMaxTaint: CLEAN_REBOOT_MAX_TAINT,
      unstableRebootMaxTaint: UNSTABLE_REBOOT_MAX_TAINT,
      maxLevelTaint: MAX_LEVEL_TAINT,
    })
  })

  it('throws a clear error when storage or content is needed before it is configured', () => {
    expect(() => getStorage()).toThrow('[@kernelfall/game] Not configured. Call configureGame() at app startup.')
    expect(() => getContent()).toThrow('[@kernelfall/game] Not configured')
  })

  it('keeps the injected storage and content', () => {
    const storage = createMemoryStorage()
    const content = exampleContent()
    configureGame({ storage, content })

    expect(getStorage()).toBe(storage)
    expect(getContent()).toBe(content)
  })

  it('overrides only the options it is given', () => {
    configure({ cleanRebootMaxTaint: 4 })

    expect(getGameConfig()).toEqual({ ...DEFAULT_GAME_OPTIONS, cleanRebootMaxTaint: 4 })
  })

  it('resetGameConfig restores the defaults and forgets storage and content', () => {
    configure({ levelBaseScore: 50, maxLevelTaint: 3 })
    resetGameConfig()

    expect(getGameConfig()).toEqual(DEFAULT_GAME_OPTIONS)
    expect(() => getStorage()).toThrow()
  })

  it("getGameNow reads the configured clock, never the machine's", () => {
    const clock = new FakeClock()
    configure({ clock })
    expect(getGameNow()).toBe(clock.now())
    clock.advance(PLAY_MS)
    expect(getGameNow()).toBe(clock.now())
  })

  // The rules are pure: hooks pass `getGameConfig()` to them, as these calls do.
  it('changes the ending thresholds the rules use', () => {
    expect(selectEnding(5, getGameConfig())).toBe('clean_reboot')

    configure({ cleanRebootMaxTaint: 4 })

    expect(selectEnding(5, getGameConfig())).toBe('unstable_reboot')
  })

  it('changes the score and the per-level Taint cap', () => {
    configure({ levelBaseScore: 50, hintCosts: { nudge: 5, concept: 5, spot: 5 } })
    expect(scoreWithHints(1, getGameConfig())).toBe(45)

    configure({ maxLevelTaint: 3 })
    const ledger = [{ levelId: 'a', ruleId: 'leak', kind: 'memory_leak', points: 8, detail: 'leak' }] as const
    expect(levelTaint(ledger, 'a', getGameConfig())).toBe(3)
  })
})
