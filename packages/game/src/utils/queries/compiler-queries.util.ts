import type { LabEvent, Pid } from '@kernelfall/machine/events'
import { STDERR_FILENO } from '@kernelfall/machine/types'
import type { CompilerWarning } from '#types/definitions/checker'
import { basename, eventsOf } from '#utils/queries/event-queries.util'
import { writtenTo } from '#utils/queries/output-queries.util'
import { exitOf } from '#utils/queries/process-queries.util'

/** The compiler drivers a build runs; each starts cc1, as and collect2 as its children. */
const COMPILERS = new Set(['gcc', 'cc', 'tcc'])
/** `hello.c:19:17: error: expected ';' before '}' token`, as gcc and tcc print a diagnostic. */
const DIAGNOSTIC = /^(?<file>[^:\s][^:]*):(?<line>\d+):(?:(?<column>\d+):)? (?<kind>error|warning): (?<message>.*)$/
const WARNING_FLAG = / \[(-W[\w-]+)\]$/
/** gcc colours its diagnostics on a terminal (SGR codes, plus `\e[K` to clear the line). */
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching the escape character is the point
const TERMINAL_CODES = /\x1b\[[0-9;]*[A-Za-z]/g
/** gcc's line for an error with no place: the linker's, or a missing file. */
const PLACELESS_ERROR = /^(?:[\w./-]+: )?(?:fatal )?error: |collect2: error: /

export interface CompileReport {
  readonly errors: number
  readonly warnings: readonly CompilerWarning[]
}

/**
 * What the command's compiles printed: gcc writes its diagnostics to stderr from the driver and
 * its children. Null when the command compiled nothing.
 */
export function compileReport(events: readonly LabEvent[]): CompileReport | null {
  const drivers = eventsOf(events, 'sched_process_exec')
    .filter((exec) => COMPILERS.has(basename(exec.filename)))
    .map((exec) => exec.pid)
  if (drivers.length === 0) {
    return null
  }
  const lines = buildPids(events, drivers).flatMap((pid) =>
    writtenTo(events, pid, STDERR_FILENO).replace(TERMINAL_CODES, '').split('\n')
  )
  const warnings: CompilerWarning[] = []
  let errors = 0
  for (const text of lines) {
    const found = DIAGNOSTIC.exec(text)?.groups
    if (found?.kind === 'warning') {
      warnings.push({
        message: (found.message ?? '').replace(WARNING_FLAG, ''),
        location: { file: found.file ?? '', line: Number(found.line), column: Number(found.column ?? 0) },
        flag: WARNING_FLAG.exec(found.message ?? '')?.[1] ?? null,
      })
    } else if (found?.kind === 'error' || PLACELESS_ERROR.test(text)) {
      errors += 1
    }
  }
  // A failed driver with no error line the trace kept still failed the build.
  const failed = drivers.some((pid) => (exitOf(events, pid)?.code ?? 0) !== 0)
  return { errors: failed && errors === 0 ? 1 : errors, warnings }
}

/** The drivers and every process they started. */
function buildPids(events: readonly LabEvent[], drivers: readonly Pid[]): Pid[] {
  const pids = new Set(drivers)
  for (const fork of eventsOf(events, 'sched_process_fork')) {
    if (pids.has(fork.parentPid)) {
      pids.add(fork.childPid)
    }
  }
  return [...pids]
}
