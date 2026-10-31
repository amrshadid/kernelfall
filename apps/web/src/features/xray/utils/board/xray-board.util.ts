import type { ProcessEpisode, XrayCall, XrayChoice, XrayFigure, XrayLens } from '@features/xray/types'
import { defaultCallId } from '@features/xray/utils/calls'
import { isWholeRun } from '@features/xray/utils/panel'
import { episodeLabel } from '@features/xray/utils/processes'
import type { TraceRun } from '@kernelfall/machine/types'
import { ANY_STEP, BOOT_PENDING, FREE_PLAY, NO_RUN, PROCESS_KIND } from './xray-board.constants'

export interface XrayEmptyTextInput {
  readonly run: TraceRun | undefined
  readonly lens: XrayLens
  readonly live: boolean
  /** How many calls, or children, there are to draw for the lens. */
  readonly count: number
  /** Why the run has no strace lines, when the log says. */
  readonly logNote: string | null
}

export interface XrayMemoryKeys {
  /** What has been explained once: per level, view and kind of call. */
  readonly memoryKey: string
  /** What has played on its own once: per level step. */
  readonly autoplayKey: string
}

/** The call the player picked, else the lesson's lead call, else the run's default one. */
export function pickCall(
  calls: readonly XrayCall[],
  pick: string | null,
  lead: number | null = null
): XrayCall | undefined {
  return calls.find((c) => String(c.id) === pick) ?? calls.find((c) => c.id === (lead ?? defaultCallId(calls)))
}

/** Playing runs on to the next call the level teaches, or the next call when it teaches none. */
export function nextCallPick(
  calls: readonly XrayCall[],
  lesson: readonly XrayCall[],
  current: number | null
): XrayChoice<string> | undefined {
  const order = lesson.length > 0 ? lesson : calls
  const next = current === null ? undefined : order.find((c) => c.id > current)
  return next && { id: String(next.id), label: next.name }
}

/** The child the player picked; otherwise a running shell's newest child leads, as the command just typed. */
export function pickEpisode(
  episodes: readonly ProcessEpisode[],
  pick: string | null,
  live: boolean
): ProcessEpisode | undefined {
  return episodes.find((e) => e.key === pick) ?? (live ? episodes.at(-1) : episodes[0])
}

export function picksOf(
  lens: XrayLens,
  calls: readonly XrayCall[],
  episodes: readonly ProcessEpisode[]
): readonly XrayChoice<string>[] {
  if (isWholeRun(lens)) {
    return []
  }
  return lens === 'syscalls'
    ? calls.map((c) => ({ id: String(c.id), label: c.name }))
    : episodes.map((e) => ({ id: e.key, label: episodeLabel(e) }))
}

export function runChoices(runs: readonly TraceRun[]): readonly XrayChoice<number>[] {
  return runs.map((r) => ({ id: r.id, label: `${r.commandLine.trim()}${r.running ? ' (running)' : ''}` }))
}

/** Why there is nothing to draw, or null when there is. */
export function xrayEmptyText({ run, lens, live, count, logNote }: XrayEmptyTextInput): string | null {
  if (lens === 'boot') {
    return count > 0 ? null : BOOT_PENDING
  }
  if (!run) {
    return NO_RUN
  }
  if (count > 0) {
    return null
  }
  const command = `\`${run.commandLine.trim()}\``
  if (lens !== 'processes') {
    return live
      ? `${command} is still running. Each syscall shows here once it returns.`
      : (logNote ?? 'This command made no syscalls.')
  }
  return live
    ? `${command} is still running. Each child it forks shows here once it has ended and been waited for.`
    : `${command} never called \`fork()\`: it ran as one process. Run a program that forks, like a shell running a command, to see a parent and its child.`
}

export function xrayCaption(figure: XrayFigure | null): string {
  if (figure?.kind === 'syscalls') {
    return `Fig. 1. ${figure.storyboard.call.text}, end to end.`
  }
  if (figure?.kind === 'processes') {
    const { parent, child, exec } = figure.storyboard.episode
    return child === null
      ? `Fig. 2. ${parent.program} tries to fork.`
      : `Fig. 2. ${parent.program} forks PID ${child}${exec ? `, which runs ${exec.path}` : ''}.`
  }
  if (figure?.kind === 'section') {
    return `Fig. 3. Section of the Machine: the parts \`${figure.commandLine.trim()}\` passed through.`
  }
  if (figure?.kind === 'route') {
    return `Fig. 4. The route of \`${figure.view.commandLine.trim()}\`: each call, the process that made it, and the part that served it.`
  }
  if (figure?.kind === 'cpus') {
    return `Fig. 5. The CPUs while \`${figure.view.commandLine.trim()}\` ran: who ran where, and each run queue.`
  }
  if (figure?.kind === 'boot') {
    return `Fig. 6. How this Machine booted, from its own kernel log (Linux ${figure.view.kernel}).`
  }
  return ''
}

// Remembered per level and view: one kind of syscall, or a fork, is explained once.
export function memoryKeysOf(
  levelId: string | null,
  step: string | null,
  lens: XrayLens,
  figure: XrayFigure | null
): XrayMemoryKeys {
  const level = levelId ?? FREE_PLAY
  const kind =
    figure?.kind === 'syscalls' ? figure.storyboard.call.name : figure && isWholeRun(lens) ? figure.kind : PROCESS_KIND
  return { memoryKey: `${level}:${lens}:${kind}`, autoplayKey: `${level}:${step ?? ANY_STEP}` }
}
