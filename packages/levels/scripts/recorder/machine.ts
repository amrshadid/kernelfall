import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { LabEvent } from '@kernelfall/machine/events'
import { createVmSession } from '@kernelfall/machine/services'
import { type TracedCommand, VM_PROMPT, type VmManifest, type VmSetupOptions } from '@kernelfall/machine/types'

const POLL_MS = 50
const BOOT_TIMEOUT_MS = 10 * 60_000
/** gcc takes seconds in the emulator; a line this slow is stuck. */
const LINE_TIMEOUT_MS = 2 * 60_000
/** The session saves the clean boot half a second after the first prompt; setting up sooner would race it. */
const SAVE_SETTLE_MS = 3_000
const STDIN = 0
// biome-ignore lint/suspicious/noControlCharactersInRegex: matches the terminal's escape sequences
const TERMINAL_CODES = /\x1b\[[0-9;?]*[A-Za-z]/g

/** In the image's grub.cfg: the menu is up. */
const GRUB_MENU = 'Alpine, with Linux virt'
const KEYS_SETTLE_MS = 1_000

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Without bash's bracketed-paste switches, colours and GRUB's cursor moves, it reads as a player sees it.
const plain = (shown: string) =>
  Buffer.from(shown, 'latin1')
    .toString('utf8')
    .replace(TERMINAL_CODES, '')
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '')

async function until(what: string, ok: () => boolean, timeoutMs = LINE_TIMEOUT_MS): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!ok()) {
    if (Date.now() > deadline) {
      throw new Error(`timed out waiting for ${what}`)
    }
    await wait(POLL_MS)
  }
}

const readsOfTerminal = (events: readonly LabEvent[]) =>
  events.filter((event) => event.type === 'sys_enter' && event.name === 'read' && event.args[0] === STDIN)

const terminalReads = (events: readonly LabEvent[]) => readsOfTerminal(events).length

/** The program reads the terminal: its read(0, …) entered after `seen` such reads, and hasn't returned. */
function readsTerminal(events: readonly LabEvent[], seen: number): boolean {
  const reads = readsOfTerminal(events)
  const last = reads.at(-1)
  if (reads.length <= seen || last?.type !== 'sys_enter') {
    return false
  }
  return !events.some((event) => event.type === 'sys_exit' && event.pid === last.pid && event.seq > last.seq)
}

// v86 in Node reads its files from disk; the session fetches only manifest.json, so that read is served from disk too.
function serveFromDisk(): void {
  const fetchUrl = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = String(input)
    if (!url.startsWith('/')) {
      return fetchUrl(input, init)
    }
    return new Response(await readFile(url))
  }
}

/** The game's VM session, booted in Node on the built image, with waits a recorder needs. */
export async function bootMachine(repo: string, vm = join(repo, 'apps/web/public/vm')) {
  const manifest = JSON.parse(
    await readFile(join(vm, 'manifest.json'), 'utf8').catch(() => 'null')
  ) as VmManifest | null
  if (!manifest) {
    throw new Error(`no image in ${vm}: run pnpm vm:image`)
  }
  serveFromDisk()
  // The session is the code the game boots with.
  const session = createVmSession()
  /** Everything the player's terminal showed, one character per byte. */
  let screen = ''
  let phase = 'off'
  let detail: string | null = null
  let running: TracedCommand | null = null
  const finished: TracedCommand[] = []

  await session.start(
    { baseUrl: `${vm}/`, wasmUrl: join(repo, 'packages/machine/node_modules/v86/build/v86.wasm'), fresh: true },
    (bytes) => {
      screen += Buffer.from(bytes).toString('latin1')
    },
    (status) => {
      phase = status.phase
      detail = status.detail
    },
    (command) => {
      if (command.status === null) {
        running = command
      } else {
        running = null
        finished.push(command)
      }
    }
  )
  await until('Linux to boot', () => phase === 'ready' || phase === 'failed', BOOT_TIMEOUT_MS)
  if (phase === 'failed') {
    throw new Error(`the Machine failed to boot: ${detail}`)
  }
  await wait(SAVE_SETTLE_MS)

  const atPrompt = (from: number) => () => VM_PROMPT.test(screen.slice(from))
  const shows = (from: number, text: string) => () => plain(screen.slice(from)).includes(text)
  const commandAfter = async (before: number, what: string): Promise<TracedCommand> => {
    await until(what, () => finished.length > before)
    return finished[before] as TracedCommand
  }

  return {
    image: manifest.version,

    /** The clean boot with a level's setup applied: its shell back at the prompt, or GRUB's menu after a reboot. */
    async setup(lines: readonly string[], options: VmSetupOptions = {}) {
      const from = screen.length
      await session.setupLevel(lines, options)
      if (options.reboot) {
        await until("GRUB's menu", shows(from, GRUB_MENU), BOOT_TIMEOUT_MS)
      } else {
        await until('the level shell', atPrompt(from))
      }
    },

    /**
     * Keys sent as they are, then a wait for `text` on the screen, or bash's prompt (a whole boot after
     * Ctrl-X); `''` only lets GRUB redraw, whose wrapped lines may never show the text whole.
     */
    async keys(keys: string, text?: string) {
      const from = screen.length
      session.input(keys)
      if (text === '') {
        await wait(KEYS_SETTLE_MS)
        return
      }
      await until(text ?? 'the prompt', text === undefined ? atPrompt(from) : shows(from, text), BOOT_TIMEOUT_MS)
    },

    /** Root runs `line` as `user` on the control channel; resolves with its trace. */
    async runAs(user: string, line: string): Promise<TracedCommand> {
      const before = finished.length
      await session.runAs(user, line)
      return commandAfter(before, `"${line}" as ${user} to finish`)
    },

    writeFiles: (files: Readonly<Record<string, string>>) => session.writeFiles(files),

    /** Types `line` at bash, each `input` line when the program reads the terminal; resolves with its trace. */
    async type(line: string, input: readonly string[] = []): Promise<TracedCommand> {
      const before = finished.length
      const from = screen.length
      session.input(`${line}\n`)
      for (const text of input) {
        // Counting reads already seen makes each line wait for a new read, not the one it answered.
        const seen = terminalReads(running?.events ?? [])
        const ended = () => finished.length > before
        await until(
          `a read of the terminal before "${text}"`,
          () => ended() || readsTerminal(running?.events ?? [], seen)
        )
        if (ended()) {
          throw new Error(`"${line}" ended before it read "${text}"`)
        }
        session.input(`${text}\n`)
      }
      const command = await commandAfter(before, `"${line}" to finish`)
      await until('the prompt', atPrompt(from))
      return command
    },

    /** Types `line` and returns what the terminal showed for it, without the echoed line and the next prompt. */
    async output(line: string): Promise<string> {
      const from = screen.length
      await this.type(line)
      return plain(screen.slice(from)).split('\n').slice(1, -1).join('\n')
    },

    /** Gets a stuck line off the terminal: `q` for a pager, then Ctrl-C. */
    interrupt() {
      session.input('q')
      session.input('\x03')
    },

    /** Everything the terminal showed so far, as plain text: for finding the keys a GRUB run needs. */
    shown: () => plain(screen),

    stop: () => session.stop(),
  }
}
