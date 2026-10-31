// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type UseLevelShortcutsOptions, useLevelShortcuts } from './useLevelShortcuts.hook'

const handlers = vi.hoisted(() => new Map<string, { run: () => void; enabled: boolean }>())
vi.mock('@features/shortcuts/hooks/keys', () => ({
  useShortcut: (id: string, run: () => void, enabled = true) => handlers.set(id, { run, enabled }),
}))

afterEach(() => {
  cleanup()
  handlers.clear()
  document.body.innerHTML = ''
})

function setup(fields: Partial<UseLevelShortcutsOptions> = {}) {
  const options: UseLevelShortcutsOptions = {
    enabled: true,
    canNext: true,
    canHint: true,
    actions: { next: vi.fn(async () => ({ success: true }) as const), revealHint: vi.fn() } as never,
    doneSteps: ['scene', 'see'],
    reviewing: null,
    review: vi.fn(),
    ...fields,
  }
  renderHook(() => useLevelShortcuts(options))
  const press = (id: string) => handlers.get(id)?.run()
  return { options, press }
}

describe('useLevelShortcuts', () => {
  it('moves on and reveals a hint only when the level allows it', () => {
    const { options, press } = setup({ canHint: false })
    press('next-step')
    press('hint')
    expect(options.actions.next).toHaveBeenCalledOnce()
    expect(options.actions.revealHint).not.toHaveBeenCalled()
  })

  it('waits for the run before taking Next and Hint', () => {
    setup({ enabled: false })
    expect(handlers.get('next-step')?.enabled).toBe(false)
    expect(handlers.get('hint')?.enabled).toBe(false)
  })

  it('steps back through the done steps', () => {
    const fresh = setup()
    fresh.press('previous-step')
    expect(fresh.options.review).toHaveBeenCalledWith('see')

    const back = setup({ reviewing: 'see' })
    back.press('previous-step')
    expect(back.options.review).toHaveBeenCalledWith('scene')

    const first = setup({ reviewing: 'scene' })
    first.press('previous-step')
    expect(first.options.review).not.toHaveBeenCalled()
  })

  it('focuses a panel, or the control inside it', () => {
    document.body.innerHTML =
      '<aside id="level-guide" tabindex="-1"></aside><div id="level-terminal"><textarea></textarea></div>'
    const { press } = setup()
    press('focus-guide')
    expect(document.activeElement?.id).toBe('level-guide')
    press('focus-terminal')
    expect(document.activeElement?.tagName).toBe('TEXTAREA')
  })
})
