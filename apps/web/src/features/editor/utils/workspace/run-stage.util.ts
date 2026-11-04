export type RunStage = 'building' | 'running'

export interface ExecSeen {
  readonly type: string
  readonly filename?: string
}

// The program Run starts last: `./hello` in `gcc … -o hello && ./hello`.
export const programOf = (commandLine: string): string | null =>
  commandLine.match(/(?:^|\s|&&\s*)\.\/([\w.-]+)\s*$/)?.[1] ?? null

export function runStageOf(commandLine: string, events: readonly ExecSeen[]): RunStage {
  const program = programOf(commandLine)
  if (program === null) {
    return 'building'
  }
  const started = events.some(
    (event) =>
      event.type === 'sched_process_exec' && event.filename !== undefined && event.filename.endsWith(`/${program}`)
  )
  return started ? 'running' : 'building'
}
