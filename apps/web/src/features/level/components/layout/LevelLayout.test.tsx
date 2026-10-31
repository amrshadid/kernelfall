// @vitest-environment jsdom
import { STEPS } from '@shared/utils/level'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LevelLayout, type LevelLayoutProps } from './LevelLayout'

const noop = () => undefined

function props(fields: Partial<LevelLayoutProps> = {}): LevelLayoutProps {
  return {
    chrome: { themeLabel: 'Night print', onToggleTheme: noop, storageIssue: null, onExport: noop, onTour: null },
    page: 'Run Anything(1.4)',
    volume: 'Kernelfall Service Manual · Act I: Userland · Process District',
    bar: {
      mapHref: '#/map',
      heading: '1.4 Run Anything',
      subheading: 'Act I · Process District',
      steps: STEPS,
      currentIndex: 2,
      reviewing: null,
      onReview: noop,
      taint: 0,
      onOpenTaint: noop,
      hintsLeft: 3,
      hintOffered: false,
      hintEnabled: true,
      onHint: noop,
      onReplay: noop,
    },
    guide: {
      stepLabel: 'Build it',
      reviewNote: null,
      lines: [],
      code: [],
      showObjectives: false,
      objectives: [],
      checkReport: null,
      chips: [],
      placement: null,
      hints: [],
      seeAlso: [],
      codex: [],
      actions: [],
      note: null,
    },
    panels: { editor: true, xray: true, emphasis: 'build' },
    // The X-ray slot names its own region, as XrayContainer does.
    slots: { editor: null, terminal: null, xray: <section aria-label="X-ray" /> },
    terminalLabel: 'your shell · Linux 6.18',
    terminalStatus: null,
    titleBlock: [],
    card: null,
    taintReport: { open: false, onClose: noop, entries: [] },
    reference: { open: false, onConfirm: noop, onCancel: noop },
    replay: { open: false, onConfirm: noop, onCancel: noop },
    status: { save: 'saved', savedAgoMs: null, machine: 'Linux: running', onShortcuts: noop },
    panelSizes: { sizes: { guide: null, xray: null, editor: null }, onResize: noop },
    ...fields,
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('LevelLayout', () => {
  it('announces X-ray once: the dock around it is not a landmark of its own', () => {
    render(<LevelLayout {...props()} />)
    expect(screen.getAllByRole('region', { name: 'X-ray' })).toHaveLength(1)
    expect(screen.queryByRole('complementary', { name: 'X-ray' })).toBeNull()
    expect(document.getElementById('level-xray')?.tabIndex).toBe(-1)
  })

  it('leaves the X-ray dock out until the story introduces it', () => {
    render(<LevelLayout {...props({ panels: { editor: false, xray: false, emphasis: 'scene' } })} />)
    expect(document.getElementById('level-xray')).toBeNull()
  })

  it('puts a divider between every two panels shown, and only those', () => {
    render(<LevelLayout {...props()} />)
    expect(screen.getAllByRole('separator').map((divider) => divider.getAttribute('aria-label'))).toEqual([
      'Resize the Guide',
      'Resize the editor and the terminal',
      'Resize X-ray',
    ])
    cleanup()
    render(<LevelLayout {...props({ panels: { editor: false, xray: false, emphasis: 'scene' } })} />)
    expect(screen.getAllByRole('separator')).toHaveLength(1)
  })

  it('sets only the sizes the player chose, so the rest keep their per-screen defaults', () => {
    const sizes = { guide: 24, xray: null, editor: 45 }
    render(<LevelLayout {...props({ panelSizes: { sizes, onResize: noop } })} />)
    const work = document.querySelector<HTMLElement>('.level-work')
    expect(work?.style.getPropertyValue('--guide-w')).toBe('24rem')
    expect(work?.style.getPropertyValue('--xray-w')).toBe('')
    expect(work?.style.getPropertyValue('--editor-share')).toBe('45%')
  })

  it('lays the level-complete card over the workspace and X-ray, and takes X-ray out of reach under it', () => {
    const card = {
      cards: [],
      simplified: [],
      seenIn: 'P.3',
      headline: 'Now you can speak to a shell',
      result: 'Level complete',
      next: null,
      onMap: noop,
      onReplay: noop,
    }
    render(<LevelLayout {...props({ card })} />)
    const overlay = screen.getByRole('region', { name: 'Now you can speak to a shell' })
    expect(overlay.parentElement?.classList.contains('level-work')).toBe(true)
    expect(document.getElementById('level-workspace')?.contains(overlay)).toBe(false)
    expect(document.getElementById('level-xray')?.hasAttribute('inert')).toBe(true)
    expect(screen.getByRole('separator', { name: 'Resize X-ray', hidden: true }).hasAttribute('inert')).toBe(true)
  })

  it('keeps X-ray in reach while no card covers it', () => {
    render(<LevelLayout {...props()} />)
    expect(document.getElementById('level-xray')?.hasAttribute('inert')).toBe(false)
  })

  it('puts a panel back to its default size when its divider is reset', () => {
    const onResize = vi.fn()
    render(<LevelLayout {...props({ panelSizes: { sizes: { guide: 24, xray: null, editor: null }, onResize } })} />)
    screen
      .getByRole('separator', { name: 'Resize the Guide' })
      .dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    expect(onResize).toHaveBeenCalledWith('guide', null)
  })
})
