import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVmSession } from '#services/vm/vm-session.service'
import type { VmPhase, VmSession } from '#types/definitions/vm'
import { setupScript } from '#utils/vm-setup/setup-script.util'

// A stand-in for v86 that logs what the session does to the guest, in order, and answers like it.
const fake = vi.hoisted(() => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  class FakeV86 {
    static last: FakeV86 | null = null
    readonly log: string[] = []
    readonly listeners = new Map<string, ((byte: number) => void)[]>()
    controlText = ''
    readonly v86 = {
      cpu: {
        option_roms: [] as unknown[],
        reboot_internal: () => {
          this.log.push('reset')
          setTimeout(() => this.prompt(), 50)
        },
      },
    }

    constructor(options: { initial_state?: unknown }) {
      FakeV86.last = this
      setTimeout(() => {
        this.emit('emulator-ready', 0)
        if (!options.initial_state) {
          setTimeout(() => this.prompt(), 50)
        }
      }, 10)
    }

    add_listener(name: string, listener: (byte: number) => void) {
      this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener])
    }

    emit(name: string, byte: number) {
      for (const listener of this.listeners.get(name) ?? []) {
        listener(byte)
      }
    }

    out(uart: number, text: string) {
      for (const byte of encoder.encode(text)) {
        this.emit(`serial${uart}-output-byte`, byte)
      }
    }

    prompt() {
      this.out(0, 'kernelfall:~$ ')
    }

    serial0_send(text: string) {
      this.log.push(`keys:${text}`)
    }

    serial_send_bytes(_uart: number, bytes: Uint8Array) {
      this.controlText += decoder.decode(bytes)
      let end = this.controlText.indexOf('\n')
      while (end >= 0) {
        const line = this.controlText.slice(0, end)
        this.controlText = this.controlText.slice(end + 1)
        this.log.push(`root:${line}`)
        setTimeout(() => {
          this.out(2, 'kf-done 0\n')
          if (line.startsWith('kill -9')) {
            setTimeout(() => this.prompt(), 20)
          }
          if (line === 'reboot') {
            this.v86.cpu.reboot_internal()
          }
        }, 5)
        end = this.controlText.indexOf('\n')
      }
    }

    async save_state() {
      this.log.push('save')
      return new ArrayBuffer(8)
    }

    async restore_state() {
      this.log.push('restore')
    }

    async create_file(path: string) {
      this.log.push(`file:${path}`)
    }

    async destroy() {}
  }
  return { FakeV86, loadVmState: vi.fn(), saveVmState: vi.fn() }
})

vi.mock('v86', () => ({ V86: fake.FakeV86 }))
vi.mock('#services/vm/vm-files.service', () => ({ loadVmFile: async () => new ArrayBuffer(8) }))
vi.mock('#services/vm/vm-state.service', () => ({
  loadVmState: (version: string) => fake.loadVmState(version),
  saveVmState: (version: string, state: ArrayBuffer) => fake.saveVmState(version, state),
}))

const DEFAULT = setupScript({})
const LAB = setupScript({ cwd: '/tmp', processes: [{ argv: ['yes'], pid: 400 }] })
const BOOT = setupScript({ boot: { args: 'console=ttyS0 quiet' } })

const vm = () => fake.FakeV86.last as InstanceType<typeof fake.FakeV86>
const restores = () => vm().log.filter((entry) => entry === 'restore').length
const run = (ms = 3_000) => vi.advanceTimersByTimeAsync(ms)

let session: VmSession
let phases: VmPhase[]

async function start(saved: boolean, settleMs = 3_000) {
  fake.loadVmState.mockResolvedValue(saved ? new ArrayBuffer(8) : null)
  session = createVmSession('v86.wasm')
  phases = []
  void session.start(
    { baseUrl: '/vm/' },
    () => {},
    (status) => phases.push(status.phase),
    () => {}
  )
  await run(settleMs)
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ version: 'v1' })))
  fake.saveVmState.mockResolvedValue(true)
})

afterEach(async () => {
  await session.stop()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  fake.loadVmState.mockReset()
  fake.saveVmState.mockReset()
})

describe('the first visit', () => {
  it('saves the clean boot once, before a setup asked for at the first prompt', async () => {
    await start(false, 100)
    expect(phases.at(-1)).toBe('ready')
    void session.setupLevel(LAB)
    await run()

    expect(vm().log[0]).toBe('save')
    expect(vm().log.filter((entry) => entry === 'save')).toHaveLength(1)
    expect(fake.saveVmState).toHaveBeenCalledOnce()
    expect(restores()).toBe(0)
    expect(vm().log.slice(1, 1 + LAB.length)).toEqual(LAB.map((line) => `root:${line}`))
    expect(phases).toEqual(['loading', 'booting', 'ready', 'restoring', 'ready'])
  })

  it('holds keys typed before the save, so the clean boot never holds them', async () => {
    await start(false, 100)
    session.input('ls\n')
    expect(vm().log).toEqual([])
    await run()
    expect(vm().log).toEqual(['save', 'keys:ls\n'])
    void session.setupLevel(DEFAULT)
    await run()
    expect(restores()).toBe(1)
  })

  it('leaves the Machine as it is for a level with no setup', async () => {
    await start(false, 100)
    void session.setupLevel(DEFAULT)
    await run()
    expect(vm().log).toEqual(['save'])
    expect(phases).toEqual(['loading', 'booting', 'ready'])
  })
})

describe('a restored start', () => {
  it('sets a level up on the boot it restored, without restoring it again', async () => {
    await start(true)
    expect(phases).toEqual(['loading', 'restoring', 'ready'])
    void session.setupLevel(LAB)
    await run()
    expect(restores()).toBe(0)
    expect(vm().log).toContain(`root:${LAB[0]}`)
    expect(vm().log.some((entry) => entry.startsWith('root:kill -9'))).toBe(true)
    expect(phases).toEqual(['loading', 'restoring', 'ready', 'restoring', 'ready'])
  })

  it("doesn't count the boot report as use", async () => {
    await start(true)
    void session.facts()
    void session.setupLevel(LAB)
    await run()
    expect(restores()).toBe(0)
  })
})

describe('a used Machine is restored first', () => {
  const restoresAfter = async (use: () => unknown) => {
    await start(true)
    use()
    await run()
    void session.setupLevel(DEFAULT)
    await run()
    return restores()
  }

  it('after the player typed (a replay after playing)', async () => {
    expect(await restoresAfter(() => session.input('yes > /dev/null &\n'))).toBe(1)
  })

  it('after another level was set up (level A, then level B)', async () => {
    await start(true)
    void session.setupLevel(LAB)
    await run()
    void session.setupLevel(DEFAULT)
    await run()
    expect(restores()).toBe(1)
    expect(vm().log.indexOf('restore')).toBeGreaterThan(vm().log.lastIndexOf(`root:${LAB.at(-1)}`))
  })

  it('after files were written (the editor, Run)', async () => {
    expect(await restoresAfter(() => session.writeFiles({ 'mypid.c': 'int main(void) { return 0; }\n' }))).toBe(1)
  })

  it('after root ran a line as another user (S.2 knock, P.10 link)', async () => {
    expect(await restoresAfter(() => session.runAs('guest', 'true'))).toBe(1)
  })

  it('after a reboot', async () => {
    expect(await restoresAfter(() => session.reboot())).toBe(1)
  })
})

describe('keys typed during a setup', () => {
  it('reach the new shell, in order, after it is up', async () => {
    await start(true)
    void session.setupLevel(LAB)
    session.input('p')
    session.input('s\n')
    await run()
    const kill = vm().log.findIndex((entry) => entry.startsWith('root:kill -9'))
    expect(vm().log.slice(kill + 1)).toEqual(['keys:ps\n'])
  })
})

describe('a boot level', () => {
  it('writes its GRUB entry and reboots, even on a clean Machine', async () => {
    await start(true)
    void session.setupLevel(BOOT, { reboot: true })
    await run()
    expect(restores()).toBe(0)
    expect(vm().log).toEqual(['keys:\n', ...BOOT.map((line) => `root:${line}`), 'root:reboot', 'reset'])
    void session.setupLevel(DEFAULT)
    await run()
    expect(restores()).toBe(1)
  })
})
