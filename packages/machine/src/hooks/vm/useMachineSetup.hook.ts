import { useEffect } from 'react'
import { setupVmLevel } from '#services/vm/vm-connection.service'
import { useTraceStore } from '#store/trace.store'
import { useVmStore } from '#store/vm.store'
import type { LabSetup } from '#types/definitions/lab-setup'
import { setupNeedsReboot, setupScript } from '#utils/vm-setup/setup-script.util'

const NO_SOURCES: Readonly<Record<string, string>> = {}

/**
 * Gives a level its own Machine: the clean boot with the level's `lab:` setup applied (accounts,
 * files, the `bin` programs built from `binSources` by name, cwd, env, running programs), once
 * Linux is up; a level with `lab.boot` restarts into GRUB's menu instead of a new shell. A new
 * `key` sets it up again.
 */
export function useMachineSetup(
  setup: LabSetup | undefined,
  key: string,
  binSources: Readonly<Record<string, string>> = NO_SOURCES
): void {
  const ready = useVmStore((state) => state.status.phase === 'ready')

  useEffect(() => {
    if (ready) {
      // Another level's runs don't belong in this one's X-ray.
      void setupVmLevel(key, setupScript(setup ?? {}, binSources), () => useTraceStore.getState().reset(), {
        reboot: setupNeedsReboot(setup),
      })
    }
  }, [ready, key, setup, binSources])
}
