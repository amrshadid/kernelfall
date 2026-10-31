import { V86 } from 'v86'
import { CONTROL_LOST, createVmControl } from '#services/vm/vm-control.service'
import { loadVmFile } from '#services/vm/vm-files.service'
import { loadVmState, saveVmState } from '#services/vm/vm-state.service'
import { createVmTrace } from '#services/vm/vm-trace.service'
import {
  VM_CMDLINE,
  VM_CONTROL_TIMEOUT_MS,
  VM_CPUS,
  VM_DISK_FILE,
  VM_HOME,
  VM_MEMORY_BYTES,
  VM_NET_DEVICE,
  VM_OUTPUT_FLUSH_MS,
  VM_PLAYER,
  VM_PLAYER_FILE,
  VM_PROMPT,
  VM_REPORT_TIMEOUT_MS,
  VM_RESTORE_SETTLE_MS,
  VM_SAVE_DELAY_MS,
  VM_SETUP_TIMEOUT_MS,
  VM_SHELL_PID_FILE,
  type VmFacts,
  type VmManifest,
  type VmSession,
  type VmSetupOptions,
  type VmStartOptions,
  type VmStatus,
} from '#types/definitions/vm'
import { TRACE_PROGRESS_MS, type TracedCommand } from '#types/definitions/vm-trace'
import { BOOT_REPORT_SCRIPT, parseBootReport } from '#utils/boot/index'
import { runAsScript, shellQuote } from '#utils/vm-setup/index'
import { mergeProgress } from '#utils/vm-trace/index'

const PROMPT_TAIL = 64
const CONTROL_UART = 2
const REBOOT = 'reboot'
const settle = () => new Promise((resolve) => setTimeout(resolve, VM_RESTORE_SETTLE_MS))

// v86 internals: no public API reaches them.
interface V86Cpu {
  option_roms: unknown[]
  reboot_internal: () => void
}

/** v86's kernel ROM would jump to a stale kernel, so restarts boot SeaBIOS → GRUB from the disk. */
function bootDiskOnReset(emulator: V86, onReset: () => void) {
  const cpu = (emulator as unknown as { v86?: { cpu?: Partial<V86Cpu> } }).v86?.cpu
  if (typeof cpu?.reboot_internal !== 'function' || !Array.isArray(cpu.option_roms)) {
    return
  }
  const reset = cpu.reboot_internal.bind(cpu)
  const roms = cpu.option_roms
  cpu.reboot_internal = () => {
    roms.length = 0
    onReset()
    reset()
  }
}

/** One Linux VM in this worker: the console goes out as bytes, keys come in as text. `wasmUrl` is
 * the emulator a start without its own uses. */
export function createVmSession(wasmUrl?: string): VmSession {
  let emulator: V86 | null = null
  let flushTimer: ReturnType<typeof setInterval> | null = null
  let markReady: () => void = () => {}
  // Files written before bash is up wait for it: the 9p root is mounted by then.
  const ready = new Promise<void>((resolve) => {
    markReady = resolve
  })
  const encoder = new TextEncoder()
  const control = createVmControl((bytes) => emulator?.serial_send_bytes(CONTROL_UART, bytes))
  /** The Machine as it first reached its prompt: every level starts from it. */
  let clean: ArrayBuffer | null = null
  let status: (phase: VmStatus['phase'], detail?: string | null) => void = () => {}
  let resetTrace: () => void = () => {}
  let nextPrompt: () => Promise<void> = async () => {}
  let rebooting = false
  // Keys typed while a level is set up wait for its new shell: the restore and the shell's restart
  // would lose them.
  let heldInput: string[] | null = null
  // A restore under a file write would wipe it and strand its chown: they take turns, after boot.
  let turn: Promise<unknown> = ready
  const exclusive = (work: () => Promise<void>): Promise<void> => {
    const result = turn.then(work)
    turn = result.catch(() => undefined)
    return result
  }

  return {
    async start(options: VmStartOptions, onOutput, onStatus, onCommand) {
      status = (phase, detail = null) => onStatus({ phase, detail })
      status('loading')
      try {
        // The one file that changes with each image; everything it points to has a versioned path.
        const response = await fetch(`${options.baseUrl}manifest.json`, { cache: 'no-cache' })
        if (!response.ok) {
          throw new Error(`No Linux image at ${options.baseUrl} (HTTP ${response.status}); run pnpm vm:image`)
        }
        const { version } = (await response.json()) as VmManifest
        const saved = options.fresh ? null : await loadVmState(version)
        clean = saved
        const base = `${options.baseUrl}${version}/`
        // A copy: v86 writes the guest's disk writes into it, and the cached one is the clean disk.
        const disk = (await loadVmFile(`${base}${VM_DISK_FILE}`)).slice(0)
        const wasm = options.wasmUrl ?? wasmUrl
        if (wasm === undefined) {
          throw new Error('No emulator wasm: pass wasmUrl to start() or createVmSession()')
        }
        emulator = new V86({
          wasm_path: wasm,
          bios: { url: `${base}bios/seabios.bin` },
          vga_bios: { url: `${base}bios/vgabios.bin` },
          ...(saved
            ? { initial_state: { buffer: saved } }
            : {
                bzimage: { url: `${base}vmlinuz` },
                initrd: { url: `${base}initramfs.cpio.gz` },
                cmdline: VM_CMDLINE,
              }),
          filesystem: { basefs: `${base}fs.json`, baseurl: `${base}flat/` },
          hda: { buffer: disk },
          net_device: VM_NET_DEVICE,
          memory_size: VM_MEMORY_BYTES,
          // COM2 carries the kernel's trace, apart from the player's terminal on COM1; COM3 is root's.
          uart1: true,
          uart2: true,
          autostart: true,
          disable_keyboard: true,
          disable_mouse: true,
          disable_speaker: true,
        })
        const running = emulator

        let pending: number[] = []
        let tail = ''
        let atPrompt = Boolean(saved)
        running.add_listener('emulator-ready', () => {
          // v86 creates its CPU only once the wasm has loaded.
          bootDiskOnReset(running, () => {
            rebooting = true
            control.drop()
            resetTrace()
            status('booting')
          })
          if (!saved) {
            status('booting')
            return
          }
          // v86 applies the saved state just after emulator-ready: a key or a file sent sooner is lost.
          setTimeout(() => {
            status('ready')
            markReady()
            // A restored shell is already at its prompt; a newline makes it print one.
            running.serial0_send('\n')
          }, VM_RESTORE_SETTLE_MS)
        })
        let onPrompt: (() => void) | null = null
        nextPrompt = () =>
          new Promise<void>((resolve) => {
            tail = ''
            onPrompt = resolve
            setTimeout(resolve, VM_CONTROL_TIMEOUT_MS)
          })
        running.add_listener('serial0-output-byte', (byte) => {
          pending.push(byte)
          tail = (tail + String.fromCharCode(byte)).slice(-PROMPT_TAIL)
          if (onPrompt && VM_PROMPT.test(tail)) {
            onPrompt()
            onPrompt = null
          }
          // Never saved: the clean boot is the first one.
          if (rebooting && VM_PROMPT.test(tail)) {
            rebooting = false
            status('ready')
            markReady()
            return
          }
          if (atPrompt || !VM_PROMPT.test(tail)) {
            return
          }
          atPrompt = true
          status('ready')
          markReady()
          // Saved at an idle prompt: a 9p load still in flight would be lost from the state.
          setTimeout(() => {
            void running.save_state().then((state) => {
              clean = state
              return saveVmState(version, state)
            })
          }, VM_SAVE_DELAY_MS)
        })
        running.add_listener('serial2-output-byte', (byte) => control.push(byte))
        let traceBytes: number[] = []
        let progress: TracedCommand | null = null
        let progressAt = 0
        const traceText = new TextDecoder()
        const newTrace = () =>
          createVmTrace({
            onProgress: (command) => {
              progress = mergeProgress(progress, command)
            },
            onFinished: (command) => {
              progress = null
              onCommand(command)
            },
          })
        let trace = newTrace()
        // A restored Machine starts mid-nothing: half a command from before it would never end.
        resetTrace = () => {
          trace = newTrace()
          progress = null
          traceBytes = []
        }
        running.add_listener('serial1-output-byte', (byte) => {
          traceBytes.push(byte)
        })
        flushTimer = setInterval(() => {
          if (traceBytes.length > 0) {
            // Paths may be UTF-8, split anywhere between ticks.
            trace.pushTrace(traceText.decode(new Uint8Array(traceBytes), { stream: true }))
            traceBytes = []
          }
          if (pending.length > 0) {
            const bytes = new Uint8Array(pending)
            onOutput(bytes)
            pending = []
          }
          const now = Date.now()
          if (progress && now - progressAt >= TRACE_PROGRESS_MS) {
            onCommand(progress)
            progress = null
            progressAt = now
          }
        }, VM_OUTPUT_FLUSH_MS)
        if (saved) {
          status('restoring')
        }
      } catch (error) {
        status('failed', error instanceof Error ? error.message : String(error))
      }
    },

    input(text) {
      if (heldInput) {
        heldInput.push(text)
        return
      }
      emulator?.serial0_send(text)
    },

    writeFiles(files) {
      return exclusive(async () => {
        const running = emulator
        const names = Object.keys(files)
        if (!running || names.length === 0) {
          return
        }
        for (const name of names) {
          await running.create_file(`${VM_HOME}/${name}`, encoder.encode(files[name] ?? ''))
        }
        // 9p creates them as root's; the player edits and rebuilds them, so they are the player's.
        const paths = names.map((name) => shellQuote(`/${VM_HOME}/${name}`)).join(' ')
        await control.run(`chown "$(cat ${VM_PLAYER_FILE} 2>/dev/null || echo ${VM_PLAYER.name}):" ${paths}`)
      })
    },

    setupLevel(lines, options: VmSetupOptions = {}) {
      // From the request on: keys typed while it waits its turn would reach the shell it replaces.
      heldInput = heldInput ?? []
      return exclusive(async () => {
        const running = emulator
        if (!running) {
          heldInput = null
          return
        }
        heldInput = heldInput ?? []
        try {
          status('restoring')
          if (clean) {
            control.drop()
            await running.restore_state(clean.slice(0))
            await settle()
            resetTrace()
            rebooting = false
          }
          for (const line of lines) {
            await control.capture(line, VM_SETUP_TIMEOUT_MS)
          }
          if (options.reboot) {
            await control.run(REBOOT)
            return
          }
          const prompt = nextPrompt()
          await control.run(`kill -9 "$(cat ${VM_SHELL_PID_FILE})"`)
          await prompt
          // bash prints its prompt just before readline takes the terminal; keys sooner split the line.
          await settle()
          status('ready')
        } finally {
          const keys = heldInput.join('')
          heldInput = null
          if (keys) {
            running.serial0_send(keys)
          }
        }
      })
    },

    async facts() {
      let facts: VmFacts = { cpus: VM_CPUS, boot: null }
      await exclusive(async () => {
        const report = await control.capture(BOOT_REPORT_SCRIPT, VM_REPORT_TIMEOUT_MS)
        if (report.status !== CONTROL_LOST) {
          facts = parseBootReport(report.output)
        }
      })
      return facts
    },

    async runAs(user, commandLine) {
      let status = CONTROL_LOST
      await exclusive(async () => {
        status = (await control.capture(runAsScript(user, commandLine), VM_SETUP_TIMEOUT_MS)).status
      })
      return status
    },

    reboot() {
      return exclusive(async () => {
        await control.run(REBOOT)
      })
    },

    async stop() {
      if (flushTimer !== null) {
        clearInterval(flushTimer)
        flushTimer = null
      }
      await emulator?.destroy()
      emulator = null
    },
  }
}
