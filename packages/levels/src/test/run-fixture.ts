import type { LabEvent } from '@kernelfall/machine/events'
import type { TracedCommand } from '@kernelfall/machine/types'

/** Gzipped: one `find /` is thousands of events. `zcat` shows the JSON. */
export const RUN_FIXTURE_EXTENSION = '.json.gz'

/** One reference run as runs/<level>/<run>.json.gz holds it. */
export interface RunFixture {
  /** The image it was recorded on: a fixture from an older one is re-recorded with `pnpm vm:record`. */
  readonly image: string
  readonly commands: readonly TracedCommand[]
}

// Byte fields are kept as one character per byte, so text stays readable in the JSON.
const BYTE_FIELDS = ['data', 'bytes']

const toText = (bytes: Uint8Array): string => Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
const toBytes = (text: string): Uint8Array => Uint8Array.from(text, (char) => char.charCodeAt(0))

function mapBytes(event: LabEvent, convert: (value: unknown) => unknown): LabEvent {
  const copy: Record<string, unknown> = { ...event }
  for (const field of BYTE_FIELDS) {
    if (field in copy) {
      copy[field] = convert(copy[field])
    }
  }
  return copy as unknown as LabEvent
}

/** The fixture's JSON: one event per line, so a re-recording diffs line by line. */
export function encodeRunFixture(fixture: RunFixture): string {
  const commands = fixture.commands.map((command) => {
    const events = command.events
      .map((event) => mapBytes(event, (value) => (value instanceof Uint8Array ? toText(value) : value)))
      .map((event) => `      ${JSON.stringify(event)}`)
      .join(',\n')
    const head = `    "commandLine": ${JSON.stringify(command.commandLine)},\n    "status": ${command.status},\n`
    return `  {\n${head}    "events": [\n${events}\n    ]\n  }`
  })
  return `{\n"image": ${JSON.stringify(fixture.image)},\n"commands": [\n${commands.join(',\n')}\n]\n}\n`
}

/** The commands of a fixture as the checker receives them, byte fields as bytes again. */
export function decodeRunFixture(fixture: RunFixture): TracedCommand[] {
  return fixture.commands.map((command) => ({
    ...command,
    events: command.events.map((event) =>
      mapBytes(event, (value) => (typeof value === 'string' ? toBytes(value) : value))
    ),
  }))
}
