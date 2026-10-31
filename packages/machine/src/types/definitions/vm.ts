import type { BootRecord } from '#types/definitions/boot'
import type { TracedCommand } from '#types/definitions/vm-trace'

/**
 * `loading`: fetching the emulator and the image. `booting`: Linux is starting (first visit).
 * `restoring`: coming back from the boot saved in this browser. `ready`: bash is at its prompt.
 */
export type VmPhase = 'off' | 'loading' | 'booting' | 'restoring' | 'ready' | 'failed'

export interface VmStatus {
  readonly phase: VmPhase
  /** Why it failed, or what it is doing, in words for the status bar. */
  readonly detail: string | null
}

/** Written by `pnpm vm:image` beside the image. */
export interface VmManifest {
  /** Changes with every image, so a boot saved for an older image is never restored. */
  readonly version: string
  readonly kernelRelease: string
}

export interface VmStartOptions {
  /** Where the image lives, ending in `/`: fs.json, flat/, vmlinuz, initramfs.cpio.gz, bios/. */
  readonly baseUrl: string
  /** The emulator's wasm; left out, the session's own. */
  readonly wasmUrl?: string
  /** Boot from scratch even when a saved boot exists. */
  readonly fresh?: boolean
}

/** The VM worker's interface, reached through Comlink. */
export interface VmSession {
  start(
    options: VmStartOptions,
    onOutput: (bytes: Uint8Array) => void,
    onStatus: (status: VmStatus) => void,
    /** The kernel's events for each command line: while it runs, and once when it finishes. */
    onCommand: (command: TracedCommand) => void
  ): Promise<void>
  /** Bytes typed at the terminal, as xterm reports them (escape sequences included). */
  input(text: string): void
  /** Writes files into the player's home, once bash is up, owned by the player; flat names only. */
  writeFiles(files: Readonly<Record<string, string>>): Promise<void>
  /** Back to the clean boot, then a level's setup commands as root, then a new shell (or a reboot). */
  setupLevel(lines: readonly string[], options?: VmSetupOptions): Promise<void>
  /** What the guest reports about itself, once bash is up. */
  facts(): Promise<VmFacts>
  /** Runs a command line as another user, traced like the player's: its run arrives through onCommand. */
  runAs(user: string, commandLine: string): Promise<number>
  /** Root's `reboot`, through SeaBIOS and GRUB on the data disk; resolves once the shutdown begins. */
  reboot(): Promise<void>
  stop(): Promise<void>
}

export interface VmSetupOptions {
  /** For the boot levels: GRUB's menu instead of a new shell. */
  readonly reboot?: boolean
}

/** v86 emulates one CPU (owner's decision: the game teaches on one); the guest's answer replaces it. */
export const VM_CPUS = 1

/** The running Machine as its kernel describes it. */
export interface VmFacts {
  /** CPUs online, as `nproc` counts them. */
  readonly cpus: number
  /** Null if the guest's report couldn't be read. */
  readonly boot: BootRecord | null
}

/** The player's account: every level's story has them as `you`, never root. */
export const VM_PLAYER = { name: 'you', uid: 1000, gid: 1000, home: '/home/you' } as const

/** The player's home, as a path inside the 9p root (no leading slash). */
export const VM_HOME = VM_PLAYER.home.slice(1)

/** Written by the host's level setup, read by the player's shell when it starts: cd and exports. */
export const VM_SESSION_FILE = '/run/kf-session'
/** Who the player logs in as, when a level says (`lab.player`); the shell starts as `you` without it. */
export const VM_PLAYER_FILE = '/run/kf-player'
/** The player's shell writes its pid here, so a new level can restart it into its session. */
export const VM_SHELL_PID_FILE = '/run/kf-shell.pid'
/** The fd the player's shell writes markers on: trace_marker is root's, so root opens it first. */
export const VM_MARKER_FD = 9
/** The root control channel's reply to each command line: `kf-done <status>`. */
export const VM_CONTROL_DONE = 'kf-done'
/** A setup line answers in well under a second; one this late was lost. */
export const VM_CONTROL_TIMEOUT_MS = 10_000
/** A level's setup line may run gcc (`lab.bin`), which takes seconds in the emulator. */
export const VM_SETUP_TIMEOUT_MS = 120_000
/** `lab.bin` programs: sources and binaries where a local admin's go (hier(7)); PATH has the bin. */
export const VM_BIN_SOURCE_DIR = '/usr/local/src'
export const VM_BIN_DIR = '/usr/local/bin'
/** The boot report carries all of dmesg: tens of kilobytes through the serial port. */
export const VM_REPORT_TIMEOUT_MS = 30_000

/** Written by bash into trace_marker around every command line. */
export const VM_TRACE_START = 'kf-start'
export const VM_TRACE_END = 'kf-end'
/** Written around a command the host runs as another user: it isn't the player's shell. */
export const VM_TRACE_AS_START = 'kf-as-start'
export const VM_TRACE_AS_END = 'kf-as-end'

/** A virtio network card with no backend: eth0 exists, with its driver, and its frames go nowhere. */
export const VM_NET_DEVICE = { type: 'virtio' } as const
/** The data disk beside the image (v86's hda, the guest's /dev/sda): built by `pnpm vm:image`. */
export const VM_DISK_FILE = 'disk.img'
/** Holds /boot (GRUB, kernel, initramfs); not mounted at boot. */
export const VM_BOOT_PARTITION = '/dev/sda1'
/** On VM_BOOT_PARTITION. */
export const VM_GRUB_CFG = '/boot/grub/grub.cfg'
/** VM_BOOT_PARTITION's ext4 UUID, fixed so the image is the same every build; GRUB finds /boot by it. */
export const VM_BOOT_FS_UUID = '6b65726e-656c-4661-916c-000000000001'
/** Enough for gcc on a small program; the saved boot grows with it. */
export const VM_MEMORY_BYTES = 256 * 1024 * 1024
/** Alpine's /etc/profile sets PS1 to `\h:\w\$ `: `$` for the player, `#` for root. */
export const VM_PROMPT = /kernelfall:[^\n]*[$#] $/
// linux-virt's log buffer is 16 KiB, about one boot: 128K keeps the boot in dmesg as levels add to it.
// GRUB's entry boots this same line, so both boots match.
export const VM_CMDLINE = 'console=ttyS0 rw tsc=reliable mitigations=off random.trust_cpu=on log_buf_len=128K quiet'
/** Content-addressed image files, so a cached one never goes stale. */
export const VM_FILE_CACHE = 'kernelfall-vm-files-v1'
export const VM_STATE_DB = 'kernelfall-vm'
export const VM_STATE_STORE = 'boots'
/** Console bytes go to the page at most this often, not one message per byte. */
export const VM_OUTPUT_FLUSH_MS = 16
/** Waiting at the prompt this long before saving the boot, so no file load is still in flight. */
export const VM_SAVE_DELAY_MS = 500
/** How long after emulator-ready a restored machine takes to apply its saved state. */
export const VM_RESTORE_SETTLE_MS = 300
