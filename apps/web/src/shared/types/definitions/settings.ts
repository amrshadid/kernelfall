/** `system` follows the operating system's light or dark setting. */
export type ThemeSetting = 'system' | 'light' | 'dark'

/** `reduce` turns motion off even when the system allows it. */
export type MotionSetting = 'system' | 'reduce'

/** The screens with a guided tour. */
export type TourScreen = 'title' | 'map' | 'level'

export type XrayDepthSetting = 'simple' | 'deep'
export type XrayLensSetting = 'syscalls' | 'processes' | 'cpus' | 'route' | 'section' | 'boot'

/** The level screen's resizable panels. */
export type PanelId = 'guide' | 'xray' | 'editor'

/**
 * What the player dragged each divider to: the Guide's and X-ray's widths in rem (so they follow the
 * text size), the editor's share of the workspace in percent. Null keeps the screen's own default.
 */
export type PanelSizes = Readonly<Record<PanelId, number | null>>

export interface Settings {
  readonly theme: ThemeSetting
  readonly motion: MotionSetting
  /** Multiplies the root font size; every size in the UI is in rem. */
  readonly uiScale: number
  /** Instead of unlocking panels with the story. */
  readonly showAllPanels: boolean
  readonly xray: boolean
  /** Tour stop ids like `level:terminal`. */
  readonly toursSeen: readonly string[]
  /** `simple`: the Gatekeeper and plain words; `deep`: registers and kernel functions. */
  readonly xrayDepth: XrayDepthSetting
  /** By level id; a level without one opens on its first view. */
  readonly xrayLens: Readonly<Record<string, XrayLensSetting>>
  /** Whether X-ray asks for a guess before a Predict stage. */
  readonly xrayPredict: boolean
  /** By `<level>:<view>:<kind>`; these storyboards open at their end. */
  readonly xraySeen: readonly string[]
  /** By `<level>:<step>`: X-ray plays on its own once per step. */
  readonly xrayAutoplayed: readonly string[]
  /** By `<level>:<view>:<kind>:<stage>`: an answered Predict isn't asked again. */
  readonly xrayGuesses: Readonly<Record<string, string>>
  readonly panelSizes: PanelSizes
  /** Off: Microsoft Clarity isn't loaded from the next page load on. */
  readonly shareRecordings: boolean
}
