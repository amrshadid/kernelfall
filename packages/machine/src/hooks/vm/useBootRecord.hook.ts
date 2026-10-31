import { useVmStore } from '#store/vm.store'
import type { BootRecord } from '#types/definitions/boot'

/** How the running Machine booted, from its own dmesg (X-ray's boot lens); null until Linux is up. */
export function useBootRecord(): BootRecord | null {
  return useVmStore((state) => state.facts?.boot ?? null)
}
