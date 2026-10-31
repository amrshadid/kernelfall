import { STORAGE_KEYS } from '@kernelfall/core/types'
import type {
  ClarityConsent,
  MotionSetting,
  PanelId,
  Settings,
  ShortcutId,
  ThemeSetting,
  TourScreen,
  XrayDepthSetting,
  XrayLensSetting,
} from '@shared/types'
import {
  addKey,
  DEFAULT_SETTINGS,
  migrateSettings,
  readGuesses,
  readLenses,
  readPanelSizes,
  readSettings,
  SETTINGS_VERSION,
  settingsOf,
  settingsStorage,
} from '@shared/utils/settings'
import { pageTextStorage } from '@shared/utils/storage'
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

interface AppState extends Settings {
  setTheme: (theme: ThemeSetting) => void
  setMotion: (motion: MotionSetting) => void
  setUiScale: (uiScale: number) => void
  setShowAllPanels: (showAllPanels: boolean) => void
  toggleXray: () => void
  /** Keeps first-seen order. */
  markToursSeen: (ids: readonly string[]) => void
  resetToursSeen: () => void
  setXrayDepth: (depth: XrayDepthSetting) => void
  setXrayLens: (levelId: string, lens: XrayLensSetting) => void
  setXrayPredict: (on: boolean) => void
  markXraySeen: (key: string) => void
  markXrayAutoplayed: (key: string) => void
  setXrayGuess: (key: string, option: string) => void
  /** Null puts the panel back to the screen's default size. */
  setPanelSize: (panel: PanelId, size: number | null) => void
  setClarityConsent: (clarityConsent: ClarityConsent) => void
  /** Also removes the stored copy; consent goes back to `unset`, so the notice asks again. */
  resetSettings: () => void

  // Not persisted from here on.
  tourScreen: TourScreen | null
  setTourScreen: (screen: TourScreen | null) => void

  cheatSheetOpen: boolean
  openCheatSheet: () => void
  closeCheatSheet: () => void

  /** One handler per shortcut: the screen that registered last wins, like a focused panel would. */
  shortcutHandlers: Readonly<Partial<Record<ShortcutId, () => void>>>
  registerShortcut: (id: ShortcutId, handler: () => void) => void
  /** Only while `handler` is still the one registered, so a screen leaving never takes the key from the one on top. */
  unregisterShortcut: (id: ShortcutId, handler: () => void) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        ...DEFAULT_SETTINGS,
        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        setMotion: (motion) => set({ motion }, false, 'setMotion'),
        setUiScale: (uiScale) => set({ uiScale }, false, 'setUiScale'),
        setShowAllPanels: (showAllPanels) => set({ showAllPanels }, false, 'setShowAllPanels'),
        toggleXray: () => set((state) => ({ xray: !state.xray }), false, 'toggleXray'),
        markToursSeen: (ids) =>
          set((state) => ({ toursSeen: [...new Set([...state.toursSeen, ...ids])] }), false, 'markToursSeen'),
        resetToursSeen: () => set({ toursSeen: [] }, false, 'resetToursSeen'),
        setXrayDepth: (xrayDepth) => set({ xrayDepth }, false, 'setXrayDepth'),
        setXrayLens: (levelId, lens) =>
          set((state) => ({ xrayLens: readLenses({ ...state.xrayLens, [levelId]: lens }) }), false, 'setXrayLens'),
        setXrayPredict: (xrayPredict) => set({ xrayPredict }, false, 'setXrayPredict'),
        markXraySeen: (key) => set((state) => ({ xraySeen: addKey(state.xraySeen, key) }), false, 'markXraySeen'),
        markXrayAutoplayed: (key) =>
          set((state) => ({ xrayAutoplayed: addKey(state.xrayAutoplayed, key) }), false, 'markXrayAutoplayed'),
        setXrayGuess: (key, option) =>
          set(
            (state) => ({ xrayGuesses: readGuesses({ ...state.xrayGuesses, [key]: option }) }),
            false,
            'setXrayGuess'
          ),
        setPanelSize: (panel, size) =>
          set(
            (state) => ({ panelSizes: readPanelSizes({ ...state.panelSizes, [panel]: size }) }),
            false,
            'setPanelSize'
          ),
        setClarityConsent: (clarityConsent) => set({ clarityConsent }, false, 'setClarityConsent'),
        resetSettings: () => {
          set(DEFAULT_SETTINGS, false, 'resetSettings')
          useAppStore.persist.clearStorage()
        },

        tourScreen: null,
        setTourScreen: (tourScreen) => set({ tourScreen }, false, 'setTourScreen'),

        cheatSheetOpen: false,
        openCheatSheet: () => set({ cheatSheetOpen: true }, false, 'openCheatSheet'),
        closeCheatSheet: () => set({ cheatSheetOpen: false }, false, 'closeCheatSheet'),

        shortcutHandlers: {},
        registerShortcut: (id, handler) =>
          set(
            (state) => ({ shortcutHandlers: { ...state.shortcutHandlers, [id]: handler } }),
            false,
            'registerShortcut'
          ),
        unregisterShortcut: (id, handler) =>
          set(
            (state) => {
              if (state.shortcutHandlers[id] !== handler) {
                return state
              }
              const { [id]: _removed, ...rest } = state.shortcutHandlers
              return { shortcutHandlers: rest }
            },
            false,
            'unregisterShortcut'
          ),
      })),
      {
        name: STORAGE_KEYS.SETTINGS,
        version: SETTINGS_VERSION,
        storage: settingsStorage(pageTextStorage),
        partialize: settingsOf,
        // Every stored version is read field by field, so an old or hand-edited value never breaks start-up.
        migrate: migrateSettings,
        merge: (stored, current) => ({ ...current, ...readSettings(stored) }),
      }
    ),
    { name: 'AppStore' }
  )
)

// Object selectors need `useShallow`: a fresh object literal per render never settles.
export const useDisplaySettings = () =>
  useAppStore(
    useShallow((state) => ({
      theme: state.theme,
      motion: state.motion,
      uiScale: state.uiScale,
      setTheme: state.setTheme,
      setMotion: state.setMotion,
      setUiScale: state.setUiScale,
    }))
  )

export const useSettings = () => {
  // Nested in the object below, a fresh settings object would never compare equal.
  const settings = useAppStore(useShallow(settingsOf))
  const actions = useAppStore(
    useShallow((state) => ({
      setTheme: state.setTheme,
      setMotion: state.setMotion,
      setUiScale: state.setUiScale,
      setShowAllPanels: state.setShowAllPanels,
      setClarityConsent: state.setClarityConsent,
      resetSettings: state.resetSettings,
    }))
  )
  return { settings, ...actions }
}

export const useShowAllPanels = () => useAppStore((state) => state.showAllPanels)

export const useXray = () =>
  useAppStore(
    useShallow((state) => ({
      xray: state.xray,
      toggleXray: state.toggleXray,
    }))
  )

export const useXrayPrefs = () =>
  useAppStore(
    useShallow((state) => ({
      depth: state.xrayDepth,
      lenses: state.xrayLens,
      predict: state.xrayPredict,
      seen: state.xraySeen,
      autoplayed: state.xrayAutoplayed,
      guesses: state.xrayGuesses,
      setDepth: state.setXrayDepth,
      setLens: state.setXrayLens,
      setPredict: state.setXrayPredict,
      markSeen: state.markXraySeen,
      markAutoplayed: state.markXrayAutoplayed,
      setGuess: state.setXrayGuess,
    }))
  )

export const usePanelSizes = () =>
  useAppStore(
    useShallow((state) => ({
      sizes: state.panelSizes,
      setPanelSize: state.setPanelSize,
    }))
  )

export const useTourState = () =>
  useAppStore(
    useShallow((state) => ({
      tourScreen: state.tourScreen,
      toursSeen: state.toursSeen,
      setTourScreen: state.setTourScreen,
      markToursSeen: state.markToursSeen,
      resetToursSeen: state.resetToursSeen,
    }))
  )

export const useClarityConsent = () =>
  useAppStore(
    useShallow((state) => ({
      consent: state.clarityConsent,
      setConsent: state.setClarityConsent,
    }))
  )

export const useCheatSheet = () =>
  useAppStore(
    useShallow((state) => ({
      cheatSheetOpen: state.cheatSheetOpen,
      openCheatSheet: state.openCheatSheet,
      closeCheatSheet: state.closeCheatSheet,
    }))
  )

export type { AppState }
