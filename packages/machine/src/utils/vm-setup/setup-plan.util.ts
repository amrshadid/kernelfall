import { setupScript } from '#utils/vm-setup/setup-script.util'

export interface SetupPlan {
  readonly restore: boolean
  readonly apply: boolean
}

export interface SetupState {
  /** Still exactly the clean boot: no keys, files, root lines or reboot since. */
  readonly pristine: boolean
  readonly lines: readonly string[]
  readonly reboot: boolean
}

// The boot shell already runs this session: no session file reads as empty, no player file as `you`.
const DEFAULT_LINES = setupScript({})

export const isDefaultSetup = (lines: readonly string[]): boolean =>
  lines.length === DEFAULT_LINES.length && lines.every((line, index) => line === DEFAULT_LINES[index])

export function planSetup({ pristine, lines, reboot }: SetupState): SetupPlan {
  return {
    restore: !pristine,
    apply: !pristine || reboot || !isDefaultSetup(lines),
  }
}
