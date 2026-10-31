import { useEventListener } from '@kernelfall/core/hooks'
import { type CommandFinishedPayload, LAB_EVENTS, type LabEvent } from '#events/types'

/** A command line the player ran to its end, and everything the kernel did for it. */
export interface CommandResult {
  readonly commandLine: string
  readonly status: number
  readonly events: readonly LabEvent[]
}

/**
 * Calls `onResult` with each command the player finishes in the terminal, while mounted: what a
 * screen that judges commands itself needs (a placement check's `judge(events)`). Always the latest
 * `onResult`, so it can be an inline function.
 */
export function useCommandResults(onResult: (result: CommandResult) => void): void {
  useEventListener<CommandFinishedPayload>(LAB_EVENTS.COMMAND_FINISHED, ({ payload }) =>
    onResult({ commandLine: payload.command.commandLine, status: payload.command.status, events: payload.events })
  )
}
