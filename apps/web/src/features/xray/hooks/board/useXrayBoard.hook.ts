import { useXrayPrefs } from '@app/store'
import { useStoryboardPlayer } from '@features/xray/hooks/player'
import type {
  XrayChoice,
  XrayControlActions,
  XrayControlState,
  XrayControls,
  XrayFigure,
  XrayLens,
  XrayPlayback,
  XrayPlaybackActions,
} from '@features/xray/types'
import {
  memoryKeysOf,
  pickCall,
  pickEpisode,
  picksOf,
  runChoices,
  xrayCaption,
  xrayEmptyText,
} from '@features/xray/utils/board'
import { toXrayCalls } from '@features/xray/utils/calls'
import { cpuLanesOf } from '@features/xray/utils/cpus'
import { toLogRun } from '@features/xray/utils/log'
import { isWholeRun } from '@features/xray/utils/panel'
import { isEpisodeOver, processEpisodes, processStoryboard } from '@features/xray/utils/processes'
import { routeOf, routesOf } from '@features/xray/utils/route'
import { sectionOf } from '@features/xray/utils/section'
import { syscallStoryboard } from '@features/xray/utils/syscalls'
import { xrayContent } from '@kernelfall/levels/utils'
import type { RunEvent } from '@kernelfall/machine/hooks'
import type { TraceRun } from '@kernelfall/machine/types'
import { useMemo } from 'react'

export interface XrayBoardInput {
  readonly runs: readonly TraceRun[]
  readonly run: TraceRun | undefined
  readonly events: readonly RunEvent[]
  readonly lenses: readonly XrayChoice<XrayLens>[]
  readonly state: XrayControlState
  readonly animate: boolean
  /** Where the player is: what X-ray remembers is per level, and it plays on its own once per level step. */
  readonly scope: { readonly levelId: string | null; readonly step: string | null }
  /** CPUs online, one lane each. */
  readonly cpus: number
}

export interface XrayBoardState {
  readonly controls: XrayControls
  readonly controlActions: XrayControlActions
  readonly figure: XrayFigure | null
  readonly emptyText: string | null
  readonly caption: string
  readonly playback: XrayPlayback
  readonly playbackActions: XrayPlaybackActions
}

export function useXrayBoard({
  runs,
  run,
  events,
  lenses,
  state,
  animate,
  scope,
  cpus,
}: XrayBoardInput): XrayBoardState {
  const prefs = useXrayPrefs()
  // Checked once for the whole game; a broken file throws here, where the error boundary shows it.
  const content = xrayContent()
  // While the command still runs (an interactive shell), only what has finished is drawn.
  const live = run?.running === true
  const calls = useMemo(() => {
    const all = run ? toXrayCalls(run, events, content) : []
    return live ? all.filter((c) => c.outcome.kind !== 'pending') : all
  }, [run, events, live, content])
  const episodes = useMemo(() => {
    const all = run ? processEpisodes(run, events) : []
    return live ? all.filter(isEpisodeOver) : all
  }, [run, events, live])
  const log = useMemo(() => (run ? toLogRun(run) : null), [run])

  const syscalls = state.lens === 'syscalls'
  const call = pickCall(calls, state.pick)
  const episode = pickEpisode(episodes, state.pick, live)
  const callBoard = useMemo(() => (call ? syscallStoryboard(call, content.narration) : null), [call, content])
  const episodeBoard = useMemo(
    () => (episode ? processStoryboard(episode, content.narration) : null),
    [episode, content]
  )

  const whole = isWholeRun(state.lens)
  const wholeFigure = useMemo((): XrayFigure | null => {
    if (!run) {
      return null
    }
    switch (state.lens) {
      case 'section':
        return { kind: 'section', view: sectionOf(run, routesOf(events)), commandLine: run.commandLine }
      case 'route':
        return { kind: 'route', view: routeOf(run.commandLine, calls, events) }
      case 'cpus':
        return { kind: 'cpus', view: cpuLanesOf(run.commandLine, run.pid, events, cpus) }
      default:
        return null
    }
  }, [state.lens, run, events, calls, cpus])

  const figure: XrayFigure | null = whole
    ? wholeFigure
    : syscalls
      ? callBoard && { kind: 'syscalls', storyboard: callBoard }
      : episodeBoard && { kind: 'processes', storyboard: episodeBoard }
  const storyboard = figure?.kind === 'syscalls' || figure?.kind === 'processes' ? figure.storyboard : null
  const pickId = whole ? null : syscalls ? (call ? String(call.id) : null) : (episode?.key ?? null)
  const picks = picksOf(state.lens, calls, episodes)
  const nextPick = picks[picks.findIndex((p) => p.id === pickId) + 1]
  const { memoryKey, autoplayKey } = memoryKeysOf(scope.levelId, scope.step, state.lens, figure)
  const player = useStoryboardPlayer({
    storyboardKey: storyboard?.key ?? 'none',
    stages: storyboard?.stages ?? [],
    animate,
    predict: state.predict,
    memoryKey,
    seen: prefs.seen.includes(memoryKey),
    autoplay: !prefs.autoplayed.includes(autoplayKey),
    guesses: prefs.guesses,
    onGuess: prefs.setGuess,
    onSeen: () => prefs.markSeen(memoryKey),
    onAutoplayed: () => prefs.markAutoplayed(autoplayKey),
    // Playing runs on through the command: the next call, or the next child.
    onFinished: nextPick ? () => state.select(nextPick.id) : undefined,
  })

  const emptyText = xrayEmptyText({
    run,
    lens: state.lens,
    live,
    count: whole ? (run?.calls.length ?? 0) : syscalls ? calls.length : episodes.length,
    logNote: log?.note ?? null,
  })

  const stages = storyboard?.stages ?? []
  const shownGuess = stages[player.index]?.predict ? player.guessAt(player.index) : null

  return {
    controls: {
      lenses,
      lens: state.lens,
      depth: state.depth,
      predict: state.predict,
      runs: runChoices(runs),
      runId: run?.id ?? null,
      picks,
      pickId,
      pickLegend: syscalls ? 'Call' : 'Child',
      log: syscalls ? log : null,
      expanded: state.expanded,
    },
    controlActions: {
      setLens: state.setLens,
      setDepth: state.setDepth,
      setPredict: state.setPredict,
      selectRun: state.selectRun,
      select: state.select,
      setExpanded: state.setExpanded,
    },
    figure,
    emptyText,
    caption: xrayCaption(figure),
    playback: {
      stages,
      index: player.index,
      current: player.current,
      pending: player.pending,
      playing: player.playing,
      speed: player.speed,
      shownGuess: shownGuess ?? null,
      pendingGuess: player.pending !== null ? player.guessAt(player.pending) : null,
    },
    playbackActions: {
      goto: player.goto,
      forward: player.forward,
      back: player.back,
      togglePlay: player.togglePlay,
      replay: player.replay,
      setSpeed: player.setSpeed,
      guess: player.guess,
      reveal: player.reveal,
    },
  }
}
