// Plays every reference run on the real Machine (v86 in Node, the built image) and saves what the
// kernel traced, one TracedCommand per typed line, as src/test/runs/<level>/<run>.json.
// Usage: pnpm vm:record [filter]   (filter: a level id or `<level>/<run>`; build the image with pnpm vm:image)
//        VM_IMAGE_DIR=<dir> records on an image elsewhere than apps/web/public/vm.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import type { TracedCommand } from '@kernelfall/machine/types'
import { setupNeedsReboot, setupScript } from '@kernelfall/machine/utils'
import { labSetups, runFileText } from '#recorder/content'
import { bootMachine } from '#recorder/machine'
import { REFERENCE_RUNS, type ReferenceRun, type RunLine } from '#test/reference-runs'
import { encodeRunFixture, RUN_FIXTURE_EXTENSION } from '#test/run-fixture'

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..')
const repo = join(pkg, '..', '..')
const contentDir = join(pkg, 'content')
const runsDir = join(pkg, 'src/test/runs')

const filter = process.argv[2] ?? ''
const runs = REFERENCE_RUNS.filter((run) => `${run.level}/${run.name}`.startsWith(filter))
if (runs.length === 0) {
  throw new Error(`no reference run matches "${filter}"`)
}
const setups = labSetups(contentDir)
// VM_IMAGE_DIR: a copy of the image to record on while `pnpm vm:image` rewrites the app's.
const machine = await bootMachine(repo, process.env.VM_IMAGE_DIR)

const linesOf = (run: ReferenceRun): RunLine[] => [
  ...(run.script === undefined
    ? []
    : readFileSync(join(contentDir, run.script), 'utf8')
        .split('\n')
        .filter((line) => line.trim() !== '' && !line.startsWith('#'))
        .map((line) => ({ line }))),
  ...(run.lines ?? []),
]

async function record(run: ReferenceRun): Promise<TracedCommand[]> {
  const setup = setups.get(run.level)
  if (!setup) {
    throw new Error(`no level ${run.level}`)
  }
  // A boot level waits at GRUB's menu: its run's first lines are keys.
  await machine.setup(setupScript(setup), { reboot: setupNeedsReboot(setup) })
  await machine.writeFiles(
    Object.fromEntries(Object.entries(run.files ?? {}).map(([name, file]) => [name, runFileText(contentDir, file)]))
  )
  const commands: TracedCommand[] = []
  for (const step of linesOf(run)) {
    if ('keys' in step) {
      await machine.keys(step.keys, step.until)
      continue
    }
    const command =
      step.as === undefined ? await machine.type(step.line, step.input) : await machine.runAs(step.as, step.line)
    if (step.record !== false) {
      commands.push(command)
    }
  }
  return commands
}

const failed: string[] = []
for (const run of runs) {
  const name = `${run.level}/${run.name}`
  const started = Date.now()
  try {
    const commands = await record(run)
    const path = join(runsDir, run.level, `${run.name}${RUN_FIXTURE_EXTENSION}`)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, gzipSync(encodeRunFixture({ image: machine.image, commands }), { level: 9 }))
    const events = commands.reduce((sum, command) => sum + command.events.length, 0)
    console.log(`${name}: ${commands.length} lines, ${events} events, ${Math.round((Date.now() - started) / 1000)}s`)
  } catch (error) {
    // The next run's setup restores the clean boot, so one stuck run doesn't spoil the rest.
    failed.push(name)
    console.error(`${name}: ${error instanceof Error ? error.message : String(error)}`)
    machine.interrupt()
  }
}
await machine.stop()
if (failed.length > 0) {
  console.error(`not recorded: ${failed.join(', ')}`)
}
process.exit(failed.length > 0 ? 1 : 0)
