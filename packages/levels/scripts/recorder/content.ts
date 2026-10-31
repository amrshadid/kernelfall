import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LabSetup } from '@kernelfall/machine/types'
import { parse } from 'yaml'
import type { RunFile } from '#test/reference-runs'

/** Every level's `lab:` block by level id, read from content/ as the loader would. */
export function labSetups(contentDir: string): ReadonlyMap<string, LabSetup> {
  const setups = new Map<string, LabSetup>()
  const files = readdirSync(contentDir, { recursive: true, encoding: 'utf8' }).filter((file) =>
    file.endsWith('level.yaml')
  )
  for (const file of files) {
    const level = parse(readFileSync(join(contentDir, file), 'utf8')) as { id: string; lab?: LabSetup }
    setups.set(level.id, level.lab ?? {})
  }
  return setups
}

/** A run's file as the player has it: a content file, with the run's edits made, each exactly once. */
export function runFileText(contentDir: string, file: RunFile): string {
  if (typeof file === 'string') {
    return readFileSync(join(contentDir, file), 'utf8')
  }
  let text = readFileSync(join(contentDir, file.from), 'utf8')
  for (const [from, to] of file.edits) {
    if (text.split(from).length !== 2) {
      throw new Error(`${file.from}: "${from}" must appear exactly once`)
    }
    text = text.replace(from, to)
  }
  return text
}
