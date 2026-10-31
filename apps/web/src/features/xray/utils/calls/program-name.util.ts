// Commands that run another command: the process ends up as the program after their options.
const WRAPPERS = new Set(['prlimit', 'env', 'nice', 'time'])

export function baseName(path: string): string {
  return path.split('/').filter(Boolean).at(-1) ?? path
}

/** A guess from the command line; once the trace has the execve, its filename wins (toXrayCalls). */
export function programOf(commandLine: string): string {
  const last = commandLine.split(/&&|\|\||;|\|/).at(-1) ?? commandLine
  const words = last.trim().split(/\s+/)
  let i = 0
  while (WRAPPERS.has(words[i] ?? '')) {
    i++
    while (words[i]?.startsWith('-') || words[i]?.includes('=')) {
      i++
    }
  }
  return baseName(words[i] ?? words[0] ?? '')
}
