import { eventBus } from '@kernelfall/core/services'
import type { Event } from '@kernelfall/core/types'
import type { CommandFinishedPayload, CommandProgressPayload } from '#events/types'
import { LAB_EVENTS } from '#events/types'
import { useTraceStore } from '#store/trace.store'

function handleCommandFinished(event: Event<CommandFinishedPayload>) {
  const { command, events } = event.payload
  useTraceStore.getState().record(events, command)
}

// A running command shows in the trace as it goes, so X-ray can follow an interactive program.
function handleCommandProgress(event: Event<CommandProgressPayload>) {
  const { command, events } = event.payload
  useTraceStore.getState().follow(events, command.commandLine)
}

export function setupMachineListeners() {
  eventBus.on(LAB_EVENTS.COMMAND_FINISHED, handleCommandFinished)
  eventBus.on(LAB_EVENTS.COMMAND_PROGRESS, handleCommandProgress)
}

export function cleanupMachineListeners() {
  eventBus.off(LAB_EVENTS.COMMAND_FINISHED, handleCommandFinished)
  eventBus.off(LAB_EVENTS.COMMAND_PROGRESS, handleCommandProgress)
}
