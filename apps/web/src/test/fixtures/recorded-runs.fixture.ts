import type { RunEvent } from '@kernelfall/machine/hooks'

export interface RecordedCommand {
  readonly commandLine: string
  readonly events: readonly RunEvent[]
}

interface FixtureFile {
  readonly commands: readonly { readonly commandLine: string; readonly events: readonly Record<string, unknown>[] }[]
}

// The web app has no Node types; the tests run in Node, so the module is loaded by name.
const NODE_FS = 'node:fs'
const RUNS = '../../../../../packages/levels/src/test/runs/'
// The recorder keeps byte fields as one character per byte (packages/levels/src/test/run-fixture.ts).
const BYTE_FIELDS = ['data', 'bytes']

const toBytes = (text: string): Uint8Array => Uint8Array.from(text, (char) => char.charCodeAt(0))

/** A command `pnpm vm:record` saved on the real image, from runs/<level>/<run>.json.gz. */
export async function recordedCommand(level: string, run: string, commandLine: string): Promise<RecordedCommand> {
  const { readFileSync } = (await import(/* @vite-ignore */ NODE_FS)) as {
    readFileSync(path: URL): Uint8Array<ArrayBuffer>
  }
  const gz = readFileSync(new URL(`${RUNS}${level}/${run}.json.gz`, import.meta.url))
  const json = await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
  const command = (JSON.parse(json) as FixtureFile).commands.find((c) => c.commandLine === commandLine)
  if (!command) {
    throw new Error(`${level}/${run} has no command ${commandLine}`)
  }
  const events = command.events.map((event) => {
    const copy = { ...event }
    for (const field of BYTE_FIELDS) {
      const value = copy[field]
      if (typeof value === 'string') {
        copy[field] = toBytes(value)
      }
    }
    return copy as unknown as RunEvent
  })
  return { commandLine, events }
}
