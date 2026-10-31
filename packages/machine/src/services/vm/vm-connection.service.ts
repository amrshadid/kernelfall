import { eventBus } from '@kernelfall/core/services'
import { proxy, type Remote, wrap } from 'comlink'
import { getMachineConfig } from '#config'
import { type BootedPayload, type CommandFinishedPayload, type CommandProgressPayload, LAB_EVENTS } from '#events/types'
import type { MachineEndpoint } from '#types/definitions/endpoint'
import type { VmFacts, VmSession, VmSetupOptions, VmStatus } from '#types/definitions/vm'
import type { TracedCommand } from '#types/definitions/vm-trace'

const SOURCE = 'machine/vm'

/** A command's events go out on the bus the trace store, X-ray and the checkers already follow. */
function publishCommand({ commandLine, status, events, from = 0 }: TracedCommand): void {
  if (status === null) {
    eventBus.emit<CommandProgressPayload>(
      LAB_EVENTS.COMMAND_PROGRESS,
      { command: { commandLine }, from, events },
      { source: SOURCE }
    )
  } else {
    eventBus.emit<CommandFinishedPayload>(
      LAB_EVENTS.COMMAND_FINISHED,
      { command: { commandLine, status }, events },
      { source: SOURCE }
    )
  }
}

interface VmConnection {
  readonly endpoint: MachineEndpoint
  readonly session: Remote<VmSession>
}

let connection: VmConnection | null = null
/** Mounted users; the VM stops when the last one leaves. */
let users = 0
const outputListeners = new Set<(bytes: Uint8Array) => void>()
/** The level each running VM was last set up for. */
const setupKeys = new WeakMap<VmConnection, string>()

/**
 * Adds a user; the first one starts the VM worker and boots or restores Linux. Once it first
 * reaches its prompt, the guest is asked about itself and `onFacts` gets the answer.
 */
export function connectVm(
  onStatus: (status: VmStatus) => void,
  onFacts: (facts: VmFacts) => void = () => {}
): { started: boolean } {
  users++
  if (connection !== null) {
    return { started: false }
  }
  const config = getMachineConfig()
  const endpoint = config.createVmEndpoint()
  const started: VmConnection = { endpoint, session: wrap<VmSession>(endpoint) }
  connection = started
  let asked = false
  let rebooted = false
  void started.session.start(
    { baseUrl: config.vmBaseUrl, ...(config.vmWasmUrl === null ? {} : { wasmUrl: config.vmWasmUrl }) },
    proxy((bytes: Uint8Array) => {
      for (const listener of [...outputListeners]) {
        listener(bytes)
      }
    }),
    proxy((status: VmStatus) => {
      // A status from a VM that was stopped and replaced is stale.
      if (connection !== started) {
        return
      }
      onStatus(status)
      // A restart is a new boot, with its own record (the boot levels judge it).
      if (asked && status.phase === 'booting') {
        rebooted = true
      }
      if (status.phase === 'ready' && (!asked || rebooted)) {
        asked = true
        rebooted = false
        void started.session.facts().then((facts) => {
          if (connection !== started) {
            return
          }
          onFacts(facts)
          if (facts.boot) {
            eventBus.emit<BootedPayload>(LAB_EVENTS.BOOTED, { boot: facts.boot.summary }, { source: SOURCE })
          }
        })
      }
    }),
    proxy((command: TracedCommand) => {
      if (connection === started) {
        publishCommand(command)
      }
    })
  )
  return { started: true }
}

/** Removes a user. True when this call stopped the VM. */
export function disconnectVm(): { stopped: boolean } {
  users = Math.max(0, users - 1)
  if (users > 0 || connection === null) {
    return { stopped: false }
  }
  const closed = connection
  connection = null
  void closed.session.stop().finally(() => closed.endpoint.terminate())
  return { stopped: true }
}

/** Keys typed at the terminal; dropped while no VM runs. */
export function sendToVm(text: string): void {
  void connection?.session.input(text)
}

/** Writes files into the shell's home; false while no VM runs. */
export async function writeVmFiles(files: Readonly<Record<string, string>>): Promise<boolean> {
  const running = connection
  if (!running) {
    return false
  }
  await running.session.writeFiles(files)
  return true
}

/**
 * Puts the VM in a level's state: the clean boot, then `lines` as root. Once per level per VM, so
 * coming back to the same level's screen keeps what the player made there. `onStart` runs only
 * when the setup really begins.
 */
export async function setupVmLevel(
  key: string,
  lines: readonly string[],
  onStart?: () => void,
  options: VmSetupOptions = {}
): Promise<boolean> {
  const running = connection
  if (!running || setupKeys.get(running) === key) {
    return false
  }
  setupKeys.set(running, key)
  onStart?.()
  await running.session.setupLevel(lines, options)
  return true
}

/** Restarts the Machine through SeaBIOS and GRUB; false while no VM runs. */
export async function rebootVm(): Promise<boolean> {
  const running = connection
  if (!running) {
    return false
  }
  await running.session.reboot()
  return true
}

/** Runs a command line as another user, traced like the player's; null while no VM runs. */
export async function runVmCommandAs(user: string, commandLine: string): Promise<number | null> {
  const running = connection
  return running ? running.session.runAs(user, commandLine) : null
}

/** Every console byte from now on; returns the unsubscribe. */
export function onVmOutput(listener: (bytes: Uint8Array) => void): () => void {
  outputListeners.add(listener)
  return () => {
    outputListeners.delete(listener)
  }
}
