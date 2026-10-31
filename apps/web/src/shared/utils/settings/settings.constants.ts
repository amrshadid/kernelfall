import type { MotionSetting, PanelId, Settings, ThemeSetting, XrayDepthSetting, XrayLensSetting } from '@shared/types'

/** 0: the bare settings object; 2 added the X-ray fields (older saves read them as defaults). */
export const SETTINGS_VERSION = 2

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  motion: 'system',
  uiScale: 1,
  showAllPanels: false,
  xray: true,
  toursSeen: [],
  xrayDepth: 'simple',
  xrayLens: {},
  xrayPredict: true,
  xraySeen: [],
  xrayAutoplayed: [],
  xrayGuesses: {},
  panelSizes: { guide: null, xray: null, editor: null },
}

/** How far each divider may go: a panel never gets too small to read or crowds out the rest. */
export const PANEL_LIMITS: Readonly<Record<PanelId, { readonly min: number; readonly max: number }>> = {
  guide: { min: 15, max: 34 },
  xray: { min: 17.5, max: 40 },
  editor: { min: 25, max: 80 },
}

/** More ids than any tour has stops; a longer stored list is not ours. */
export const MAX_TOURS_SEEN = 64
/** Longer than any tour stop id (`level:terminal`); a longer stored id is not ours. */
export const MAX_TOUR_ID_LENGTH = 64

/** X-ray keys kept per list: plenty for every level's views, and a bound on what a save can hold. */
export const MAX_XRAY_KEYS = 256
/** Longer than any `<level>:<view>:<kind>:<stage>` key the game writes. */
export const MAX_XRAY_KEY_LENGTH = 160
/** Longer than any Predict option the game offers. */
export const MAX_XRAY_ANSWER_LENGTH = 64

export const UI_SCALES = [0.875, 1, 1.125, 1.25, 1.5] as const

export const THEMES: readonly ThemeSetting[] = ['system', 'light', 'dark']
export const MOTIONS: readonly MotionSetting[] = ['system', 'reduce']
export const XRAY_DEPTHS: readonly XrayDepthSetting[] = ['simple', 'deep']
export const XRAY_LENSES: readonly XrayLensSetting[] = ['syscalls', 'processes', 'cpus', 'route', 'section']
