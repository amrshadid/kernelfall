import { useMemo } from 'react'
import { getContent, getGameConfig } from '#config'
import { useProgressStore } from '#store/progress.store'
import type { KernelMap } from '#types/definitions/map'
import { kernelMap } from '#utils/map/index'

export type UseKernelMapResult = KernelMap

/** Every level with its status, the player's record and its Taint, in content order, for the Kernel Map. */
export function useKernelMap(): UseKernelMapResult {
  const progress = useProgressStore((state) => state.progress)
  return useMemo(() => kernelMap(progress, getContent(), getGameConfig()), [progress])
}
