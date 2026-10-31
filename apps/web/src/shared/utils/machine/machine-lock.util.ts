import type { VmStatus } from '@kernelfall/machine/types'
import type { MachineLock } from '@shared/types'
import { MACHINE_LOCK_TEXT, RESTORING_HOLDS_KEYS, RUN_FAILED, RUN_WAITS } from './machine-lock.constants'

/** Null once bash is at its prompt; `rebooted` is true once the Machine has been ready since the page opened. */
export function machineLockOf({ phase, detail }: VmStatus, rebooted: boolean): MachineLock | null {
  if (phase === 'ready') {
    return null
  }
  const text = MACHINE_LOCK_TEXT[phase]
  const failed = phase === 'failed'
  // After the first boot, `restoring` is a level setup: the Machine holds keys for its new shell.
  const holdsKeys = phase === 'restoring' && rebooted
  return {
    phase,
    title: text.title,
    detail: detail ?? (holdsKeys ? RESTORING_HOLDS_KEYS : text.detail),
    failed,
    typing: phase === 'booting' && rebooted,
    holdsKeys,
    runReason: failed ? RUN_FAILED : `${text.title}. ${RUN_WAITS}`,
  }
}
