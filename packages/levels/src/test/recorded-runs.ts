import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import type { CheckInput } from '@kernelfall/game/types'
import type { LabEvent } from '@kernelfall/machine/events'
import type { TracedCommand } from '@kernelfall/machine/types'
import { decodeRunFixture, RUN_FIXTURE_EXTENSION, type RunFixture } from '#test/run-fixture'

const RUNS_DIR = fileURLToPath(new URL('runs', import.meta.url))

/** The commands of the run `pnpm vm:record` saved as runs/<level>/<run>.json.gz, as the checker receives them. */
export function recordedCommands(level: string, run: string): TracedCommand[] {
  const path = join(RUNS_DIR, level, `${run}${RUN_FIXTURE_EXTENSION}`)
  let fixture: RunFixture
  try {
    fixture = JSON.parse(gunzipSync(readFileSync(path)).toString('utf8')) as RunFixture
  } catch {
    throw new Error(`no recorded run ${level}/${run}: run pnpm vm:record ${level}/${run}`)
  }
  return decodeRunFixture(fixture)
}

/** Each command as the game hands it to the checkers: its events, its line, and the commands finished before it. */
export const checkInputsOf = (commands: readonly TracedCommand[]): CheckInput[] =>
  commands.map(({ events, commandLine }, index) => ({
    events,
    commandLine,
    // The recorder saves finished commands only; an unknown status must never read as success.
    history: commands
      .slice(0, index)
      .map((earlier) => ({ commandLine: earlier.commandLine, status: earlier.status ?? -1 })),
  }))

/** A recorded run's commands as the checkers receive them in one play-through. */
export const recordedInputs = (level: string, run: string): CheckInput[] => checkInputsOf(recordedCommands(level, run))

/** The events of each command of a recorded run, one list per typed line. */
export const recordedRun = (level: string, run: string): LabEvent[][] =>
  recordedCommands(level, run).map((command) => [...command.events])

/** The `<level>/<run>` names of every saved fixture. */
export const recordedRunNames = (): string[] =>
  readdirSync(RUNS_DIR, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith(RUN_FIXTURE_EXTENSION))
    .map((file) => file.slice(0, -RUN_FIXTURE_EXTENSION.length))
    .sort()
