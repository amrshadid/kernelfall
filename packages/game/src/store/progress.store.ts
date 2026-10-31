import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { EpochMs, Progress } from '#types/definitions/progress'
import type { SaveIssue } from '#types/definitions/saves'
import type { ActiveLevel, GameStatus } from '#types/definitions/store'
import { GAME_STATUS } from '#types/definitions/store'
import { emptyProgress } from '#utils/progress/index'

interface ProgressState {
  status: GameStatus
  progress: Progress
  /** The level being played, or null. */
  active: ActiveLevel | null
  /** When play time was last counted, or null when no level is active. */
  lastActivityAt: EpochMs | null
  /** Saves written but not finished yet. */
  pendingSaves: number
  /** When the loaded or last written save was made. */
  lastSavedAt: EpochMs | null
  saveIssue: SaveIssue | null
  /** Advances when the progress is replaced (open, import, reset); async work drops a stale result. */
  epoch: number
}

interface ProgressActions {
  opening: () => void
  open: (progress: Progress, lastSavedAt: EpochMs | null, saveIssue: SaveIssue | null) => void
  setProgress: (progress: Progress) => void
  setActive: (active: ActiveLevel | null, lastActivityAt: EpochMs | null) => void
  touch: (progress: Progress, lastActivityAt: EpochMs) => void
  saveStarted: () => void
  saveFinished: (savedAt: EpochMs | null, saveIssue: SaveIssue | null) => void
  reset: () => void
}

type ProgressStore = ProgressState & ProgressActions

const initialState: ProgressState = {
  status: GAME_STATUS.closed,
  progress: emptyProgress(),
  active: null,
  lastActivityAt: null,
  pendingSaves: 0,
  lastSavedAt: null,
  saveIssue: null,
  epoch: 0,
}

export const useProgressStore = create<ProgressStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      opening: () => set({ status: GAME_STATUS.opening, epoch: get().epoch + 1 }),

      // Keeps pendingSaves: writes already queued still finish and report back.
      open: (progress, lastSavedAt, saveIssue) =>
        set({
          status: GAME_STATUS.open,
          progress,
          active: null,
          lastActivityAt: null,
          lastSavedAt,
          saveIssue,
          epoch: get().epoch + 1,
        }),

      setProgress: (progress) => set({ progress }),

      setActive: (active, lastActivityAt) => set({ active, lastActivityAt }),

      touch: (progress, lastActivityAt) => set({ progress, lastActivityAt }),

      saveStarted: () => set({ pendingSaves: get().pendingSaves + 1 }),

      saveFinished: (savedAt, saveIssue) =>
        set({
          pendingSaves: Math.max(0, get().pendingSaves - 1),
          lastSavedAt: savedAt ?? get().lastSavedAt,
          saveIssue,
        }),

      // The epoch keeps counting across resets, so work started before one still sees it as stale.
      reset: () => set({ ...initialState, epoch: get().epoch + 1 }),
    }),
    { name: 'ProgressStore' }
  )
)
