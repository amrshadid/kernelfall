import type { PanelId, PanelSizes, Settings, XrayLensSetting } from '@shared/types'
import {
  CLARITY_CONSENTS,
  DEFAULT_SETTINGS,
  MAX_TOUR_ID_LENGTH,
  MAX_TOURS_SEEN,
  MAX_XRAY_ANSWER_LENGTH,
  MAX_XRAY_KEY_LENGTH,
  MAX_XRAY_KEYS,
  MOTIONS,
  PANEL_LIMITS,
  THEMES,
  UI_SCALES,
  XRAY_DEPTHS,
  XRAY_LENSES,
} from './settings.constants'

const isKey = (key: unknown): key is string =>
  typeof key === 'string' && key.length > 0 && key.length <= MAX_XRAY_KEY_LENGTH

/** Deduplicated and capped, keeping the most recent ones. */
export function readKeys(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return [...new Set(value.filter(isKey))].slice(-MAX_XRAY_KEYS)
}

/** An unchanged list stays the same object, so store subscribers don't re-render. */
export function addKey(keys: readonly string[], key: string): readonly string[] {
  return keys.includes(key) ? keys : readKeys([...keys, key])
}

/** Keeps entries whose value passes `valid`, capped to the most recent ones. */
function readMap<T>(value: unknown, valid: (item: unknown) => item is T): Readonly<Record<string, T>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {}
  }
  const entries = Object.entries(value).filter((entry): entry is [string, T] => isKey(entry[0]) && valid(entry[1]))
  return Object.fromEntries(entries.slice(-MAX_XRAY_KEYS))
}

const isAnswer = (item: unknown): item is string => typeof item === 'string' && item.length <= MAX_XRAY_ANSWER_LENGTH
const isLens = (item: unknown): item is XrayLensSetting => XRAY_LENSES.some((lens) => lens === item)

export function readGuesses(value: unknown): Readonly<Record<string, string>> {
  return readMap(value, isAnswer)
}

export function readLenses(value: unknown): Readonly<Record<string, XrayLensSetting>> {
  return readMap(value, isLens)
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.find((option) => option === value) ?? fallback
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/** Each size inside its limits, else the screen's default. */
export function readPanelSizes(value: unknown): PanelSizes {
  const raw = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  const read = (id: PanelId): number | null => {
    const size = raw[id]
    const { min, max } = PANEL_LIMITS[id]
    return typeof size === 'number' && size >= min && size <= max ? size : null
  }
  return { guide: read('guide'), xray: read('xray'), editor: read('editor') }
}

function readToursSeen(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SETTINGS.toursSeen
  }
  const ids = value.filter((id): id is string => typeof id === 'string' && id.length < MAX_TOUR_ID_LENGTH)
  return [...new Set(ids)].slice(0, MAX_TOURS_SEEN)
}

/** Field by field, defaulting the invalid ones, so an old or hand-edited value never breaks start-up. */
export function readSettings(stored: unknown): Settings {
  if (typeof stored !== 'object' || stored === null) {
    return DEFAULT_SETTINGS
  }
  const raw = stored as Record<string, unknown>
  return {
    theme: pick(raw.theme, THEMES, DEFAULT_SETTINGS.theme),
    motion: pick(raw.motion, MOTIONS, DEFAULT_SETTINGS.motion),
    uiScale: UI_SCALES.find((step) => step === raw.uiScale) ?? DEFAULT_SETTINGS.uiScale,
    showAllPanels: readBoolean(raw.showAllPanels, DEFAULT_SETTINGS.showAllPanels),
    xray: readBoolean(raw.xray, DEFAULT_SETTINGS.xray),
    toursSeen: readToursSeen(raw.toursSeen),
    xrayDepth: pick(raw.xrayDepth, XRAY_DEPTHS, DEFAULT_SETTINGS.xrayDepth),
    xrayLens: readLenses(raw.xrayLens),
    xrayPredict: readBoolean(raw.xrayPredict, DEFAULT_SETTINGS.xrayPredict),
    xraySeen: readKeys(raw.xraySeen),
    xrayAutoplayed: readKeys(raw.xrayAutoplayed),
    xrayGuesses: readGuesses(raw.xrayGuesses),
    panelSizes: readPanelSizes(raw.panelSizes),
    clarityConsent: pick(raw.clarityConsent, CLARITY_CONSENTS, DEFAULT_SETTINGS.clarityConsent),
  }
}

/** Saves from before version 4 never answered the consent notice (an opt-out isn't consent), so they are asked. */
export function migrateSettings(stored: unknown, version: number): Settings {
  const settings = readSettings(stored)
  return version < 4 ? { ...settings, clarityConsent: 'unset' } : settings
}

/** Anything unreadable gives the defaults. */
export function parseSettings(json: string | null): Settings {
  if (json === null) {
    return DEFAULT_SETTINGS
  }
  try {
    return readSettings(JSON.parse(json))
  } catch {
    return DEFAULT_SETTINGS
  }
}

/** What is persisted: no actions or per-tab state. */
export function settingsOf(state: Settings): Settings {
  const { theme, motion, uiScale, showAllPanels, xray, toursSeen } = state
  const { xrayDepth, xrayLens, xrayPredict, xraySeen, xrayAutoplayed, xrayGuesses, panelSizes, clarityConsent } = state
  return {
    panelSizes,
    clarityConsent,
    theme,
    motion,
    uiScale,
    showAllPanels,
    xray,
    toursSeen,
    xrayDepth,
    xrayLens,
    xrayPredict,
    xraySeen,
    xrayAutoplayed,
    xrayGuesses,
  }
}
