// The web app has no Node types; the tests run in Node, so the module is loaded by name.
const NODE_FS = 'node:fs'
const FACTS = '../../../../../packages/levels/src/test/machine-facts.json'

/** What a command printed on the real Machine, as packages/levels/src/test/machine-facts.json saved it. */
export async function machineOutput(command: string): Promise<string> {
  const { readFileSync } = (await import(/* @vite-ignore */ NODE_FS)) as {
    readFileSync(path: URL, encoding: 'utf8'): string
  }
  const facts = JSON.parse(readFileSync(new URL(FACTS, import.meta.url), 'utf8')) as {
    readonly outputs: Readonly<Record<string, string>>
  }
  const output = facts.outputs[command]
  if (output === undefined) {
    throw new Error(`machine-facts.json has no output for ${command}`)
  }
  return output
}
