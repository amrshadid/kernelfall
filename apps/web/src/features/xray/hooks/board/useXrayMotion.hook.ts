import { useSettings } from '@app/store'
import { useReducedMotion } from '@shared/hooks/motion'

/** False when the system or the game's Motion setting asks for less motion: X-ray becomes step mode. */
export function useXrayMotion(): boolean {
  const systemReduced = useReducedMotion()
  const { settings } = useSettings()
  return !systemReduced && settings.motion !== 'reduce'
}
