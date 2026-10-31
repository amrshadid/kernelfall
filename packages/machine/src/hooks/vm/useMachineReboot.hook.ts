import { useMemo } from 'react'
import { rebootVm } from '#services/vm/vm-connection.service'

export interface UseMachineRebootResult {
  /**
   * Root's `reboot` (the Watchdog restarting the Machine): SeaBIOS, then GRUB's menu on the
   * player's terminal. Resolves once the shutdown begins; false with no Machine.
   */
  readonly reboot: () => Promise<boolean>
}

export function useMachineReboot(): UseMachineRebootResult {
  return useMemo(() => ({ reboot: rebootVm }), [])
}
