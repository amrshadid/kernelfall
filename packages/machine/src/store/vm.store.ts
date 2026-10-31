import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { VmFacts, VmStatus } from '#types/definitions/vm'

interface VmState {
  status: VmStatus
  /** Null until the running guest has answered. */
  facts: VmFacts | null
}

interface VmActions {
  setStatus: (status: VmStatus) => void
  setFacts: (facts: VmFacts) => void
  reset: () => void
}

type VmStore = VmState & VmActions

const initialState: VmState = { status: { phase: 'off', detail: null }, facts: null }

export const useVmStore = create<VmStore>()(
  devtools(
    (set) => ({
      ...initialState,
      setStatus: (status) => set({ status }),
      setFacts: (facts) => set({ facts }),
      reset: () => set(initialState),
    }),
    { name: 'VmStore' }
  )
)
