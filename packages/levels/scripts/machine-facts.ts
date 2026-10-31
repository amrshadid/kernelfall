// Types each fact command on the real Machine as the player and saves what it printed, so level
// text and checkers quote the Machine instead of guessing. Re-run after the image changes.
// Usage: pnpm vm:facts   (build the image with pnpm vm:image)
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bootMachine } from '#recorder/machine'
import { FACT_COMMANDS, MACHINE_FACTS_FILE } from '#test/machine-facts'

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..')
const repo = join(pkg, '..', '..')

const machine = await bootMachine(repo, process.env.VM_IMAGE_DIR)
await machine.setup([])
const outputs: Record<string, string> = {}
for (const command of FACT_COMMANDS) {
  outputs[command] = await machine.output(command)
  console.log(`$ ${command}\n${outputs[command]}\n`)
}
await machine.stop()

writeFileSync(join(pkg, MACHINE_FACTS_FILE), `${JSON.stringify({ image: machine.image, outputs }, null, 2)}\n`)
process.exit(0)
