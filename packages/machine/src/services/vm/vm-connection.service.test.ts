import { eventBus } from '@kernelfall/core/services'
import { expose } from 'comlink'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { configureMachine, resetMachineConfig } from '#config'
import { type BootedPayload, LAB_EVENTS } from '#events/types'
import {
  connectVm,
  disconnectVm,
  onVmOutput,
  runVmCommandAs,
  sendToVm,
  setupVmLevel,
  writeVmFiles,
} from '#services/vm/vm-connection.service'
import { BOOT_REPORT } from '#test/boot-report'
import type { MachineEndpoint } from '#types/definitions/endpoint'
import type { VmFacts, VmSession, VmStartOptions, VmStatus } from '#types/definitions/vm'
import type { TracedCommand } from '#types/definitions/vm-trace'
import { parseBootReport } from '#utils/boot/boot-report.util'

/** A VM worker without v86: records what it is asked, and lets the test speak for the console. */
function fakeVm() {
  const calls = {
    started: [] as VmStartOptions[],
    input: [] as string[],
    files: [] as object[],
    setups: [] as (readonly string[])[],
    facts: 0,
    runAs: [] as [string, string][],
    stops: 0,
  }
  let console: ((bytes: Uint8Array) => void) | null = null
  let status: ((status: VmStatus) => void) | null = null
  let command: ((command: TracedCommand) => void) | null = null
  const session: VmSession = {
    async start(options, onOutput, onStatus, onCommand) {
      calls.started.push(options)
      console = onOutput
      status = onStatus
      command = onCommand
    },
    input: (text) => void calls.input.push(text),
    async writeFiles(files) {
      calls.files.push(files)
    },
    async setupLevel(lines) {
      calls.setups.push(lines)
    },
    async facts() {
      calls.facts++
      return parseBootReport(BOOT_REPORT)
    },
    async runAs(user, commandLine) {
      calls.runAs.push([user, commandLine])
      return 0
    },
    async stop() {
      calls.stops++
    },
  }
  const { port1, port2 } = new MessageChannel()
  expose(session, port1)
  const endpoint: MachineEndpoint = Object.assign(port2, {
    terminate: vi.fn(() => {
      port1.close()
      port2.close()
    }),
  })
  return {
    calls,
    endpoint,
    print: (text: string) => console?.(new TextEncoder().encode(text)),
    status: (s: VmStatus) => status?.(s),
    command: (c: TracedCommand) => command?.(c),
  }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

const MAX_USERS_PER_TEST = 4

afterEach(() => {
  // Drops every user a test left connected; with none left, disconnecting is a no-op.
  for (let i = 0; i < MAX_USERS_PER_TEST; i++) {
    disconnectVm()
  }
  resetMachineConfig()
})

describe('the VM connection', () => {
  it('starts one VM for the first user, at the configured image, and stops it with the last', async () => {
    const vm = fakeVm()
    configureMachine({ createVmEndpoint: () => vm.endpoint, vmBaseUrl: '/kernelfall/vm/', vmWasmUrl: '/v86.wasm' })
    expect(connectVm(() => {})).toEqual({ started: true })
    expect(connectVm(() => {})).toEqual({ started: false })
    await settle()
    expect(vm.calls.started).toEqual([{ baseUrl: '/kernelfall/vm/', wasmUrl: '/v86.wasm' }])

    expect(disconnectVm()).toEqual({ stopped: false })
    expect(disconnectVm()).toEqual({ stopped: true })
    await settle()
    expect(vm.calls.stops).toBe(1)
    expect(vm.endpoint.terminate).toHaveBeenCalled()
  })

  it('passes keys, files, console bytes and status between the page and the VM', async () => {
    const vm = fakeVm()
    configureMachine({ createVmEndpoint: () => vm.endpoint })
    const statuses: VmStatus[] = []
    connectVm((status) => statuses.push(status))
    const printed: string[] = []
    const unsubscribe = onVmOutput((bytes) => printed.push(new TextDecoder().decode(bytes)))
    await settle()

    sendToVm('ls\r')
    expect(await writeVmFiles({ 'hello.c': 'int main(void) { return 0; }\n' })).toBe(true)
    vm.print('kernelfall:~# ')
    vm.status({ phase: 'ready', detail: null })
    await settle()

    expect(vm.calls.input).toEqual(['ls\r'])
    expect(vm.calls.files).toEqual([{ 'hello.c': 'int main(void) { return 0; }\n' }])
    expect(printed).toEqual(['kernelfall:~# '])
    expect(statuses).toEqual([{ phase: 'ready', detail: null }])
    unsubscribe()
  })

  it("publishes each command's kernel events: progress while it runs, then the finished run", async () => {
    const vm = fakeVm()
    configureMachine({ createVmEndpoint: () => vm.endpoint })
    const seen: { type: string; payload: unknown }[] = []
    const subscription = eventBus.on('LAB_COMMAND_*', (event) => {
      seen.push({ type: event.type, payload: event.payload })
    })
    connectVm(() => {})
    await settle()

    const fork = { type: 'sched_process_fork', parentPid: 434, childPid: 441, cpu: 0, seq: 0, time: 1 } as const
    vm.command({ commandLine: 'ls', status: null, events: [fork] })
    vm.command({ commandLine: 'ls', status: 0, events: [fork] })
    await settle()

    expect(seen).toEqual([
      { type: LAB_EVENTS.COMMAND_PROGRESS, payload: { command: { commandLine: 'ls' }, events: [fork] } },
      { type: LAB_EVENTS.COMMAND_FINISHED, payload: { command: { commandLine: 'ls', status: 0 }, events: [fork] } },
    ])
    subscription.unsubscribe()
  })

  it('asks the guest about itself once, when it first reaches its prompt, and publishes its boot', async () => {
    const vm = fakeVm()
    configureMachine({ createVmEndpoint: () => vm.endpoint })
    const facts: VmFacts[] = []
    const booted: BootedPayload[] = []
    const subscription = eventBus.on<BootedPayload>(LAB_EVENTS.BOOTED, (event) => {
      booted.push(event.payload)
    })
    connectVm(
      () => {},
      (f) => facts.push(f)
    )
    await settle()
    vm.status({ phase: 'booting', detail: null })
    vm.status({ phase: 'ready', detail: null })
    vm.status({ phase: 'restoring', detail: null })
    vm.status({ phase: 'ready', detail: null })
    await settle()
    expect(vm.calls.facts).toBe(1)
    expect(facts.map((f) => f.cpus)).toEqual([1])
    expect(booted).toEqual([{ boot: facts[0]?.boot?.summary }])
    expect(booted[0]?.boot.rootDevice).toBe('host9p')
    subscription.unsubscribe()
  })

  it('sets a level up once per VM, so coming back to its screen keeps what the player made', async () => {
    const vm = fakeVm()
    configureMachine({ createVmEndpoint: () => vm.endpoint })
    connectVm(() => {})
    await settle()

    expect(await setupVmLevel('p1', ['adduser guest'])).toBe(true)
    expect(await setupVmLevel('p1', ['adduser guest'])).toBe(false)
    expect(await setupVmLevel('s2', ['mkdir /home/you/attic'])).toBe(true)
    expect(vm.calls.setups).toEqual([['adduser guest'], ['mkdir /home/you/attic']])
  })

  it("runs another user's command on the VM, and nothing without one", async () => {
    expect(await runVmCommandAs('guest', 'cat /home/you/secret')).toBeNull()
    const vm = fakeVm()
    configureMachine({ createVmEndpoint: () => vm.endpoint })
    connectVm(() => {})
    await settle()
    expect(await runVmCommandAs('guest', 'cat /home/you/secret')).toBe(0)
    expect(vm.calls.runAs).toEqual([['guest', 'cat /home/you/secret']])
  })

  it('writes nothing and drops keys while no VM runs', async () => {
    expect(await writeVmFiles({ 'a.c': '' })).toBe(false)
    expect(() => sendToVm('x')).not.toThrow()
  })
})
