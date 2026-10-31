import type {
  ProcessEpisode,
  ProcessScene,
  ProcessStep,
  ProcessStoryboard,
  Stage,
  StageTextOptions,
} from '@features/xray/types'
import { stageText } from '@features/xray/utils/narration'
import type { ProcessStageKey, TemplateValues, XrayNarration } from '@kernelfall/levels/types'
import { fillTemplate } from '@kernelfall/levels/utils'
import { processValues } from './process-values.util'

type ScenePatch = Partial<Omit<ProcessScene, 'step' | 'now'>>

/** "In the kernel now" before anything has reached the kernel. */
const NOTHING_YET = { fn: '—', file: '' }

/** Each scene carries the drawing's state so far. */
class StageList {
  readonly #narration: XrayNarration
  readonly #values: TemplateValues
  readonly #stages: Stage<ProcessScene>[] = []
  #scene: Omit<ProcessScene, 'step'>

  constructor(episode: ProcessEpisode, narration: XrayNarration, values: TemplateValues) {
    this.#narration = narration
    this.#values = values
    this.#scene = {
      ring: 3,
      crossing: null,
      focus: 'parent',
      parentState: 'R',
      childState: null,
      childProgram: episode.parent.program,
      forkReturned: false,
      childMemory: null,
      sigchld: false,
      collected: false,
      printed: false,
      now: NOTHING_YET,
    }
  }

  /** Adds stage `step`, told by the content's `key` (a variant of it, or itself). */
  add(step: ProcessStep, patch: ScenePatch, key: ProcessStageKey = step, options: StageTextOptions = {}): void {
    const text = this.#narration.processStages[key]
    const fill = (template: string) => fillTemplate(template, this.#values)
    const now = text.now ? { fn: fill(text.now.fn), file: fill(text.now.file) } : this.#scene.now
    // A crossing and a signal belong to their own stage only.
    this.#scene = { ...this.#scene, crossing: null, sigchld: false, ...patch, now }
    this.#stages.push({
      ...stageText(text, this.#values, { predict: 'content', ...options }),
      key: step,
      scene: { step, ...this.#scene },
    })
  }

  get stages(): readonly Stage<ProcessScene>[] {
    return this.#stages
  }
}

/** Only the stages its events show. */
export function processStoryboard(episode: ProcessEpisode, narration: XrayNarration): ProcessStoryboard {
  const { fork, child, exec, exit, wait, reaped } = episode
  const values = processValues(episode, narration.parts)
  const list = new StageList(episode, narration, values)

  list.add('fork', { ring: 0, crossing: { name: fork.name, nr: fork.nr, by: 'parent' } })

  if (child === null) {
    list.add('forkfail', { ring: 3 })
    return { key: episode.key, episode, stages: list.stages }
  }

  list.add('copy', { ring: 0, childState: 'R', childMemory: 'copy' })
  list.add('memory', { ring: 0 })
  list.add('returns', { ring: 3, focus: 'child', forkReturned: true, parentState: wait !== null ? 'S' : 'R' })

  if (exec) {
    list.add('execve', { ring: 0, focus: 'child', crossing: { name: 'execve', nr: exec.nr, by: 'child' } })
    if (exec.errno !== null) {
      list.add('execfail', { ring: 3, focus: 'child' })
    } else {
      list.add('newprog', { ring: 3, focus: 'child', childProgram: episode.childProgram, childMemory: 'new' })
    }
  }

  if (episode.work.length > 0 || episode.printed !== '') {
    list.add('runs', { ring: 3, focus: 'child', printed: episode.printed !== '' })
  }

  if (exit) {
    list.add(
      'exit',
      {
        ring: 0,
        focus: 'child',
        crossing: exit.nr !== null ? { name: 'exit_group', nr: exit.nr, by: 'child' } : null,
        childState: 'Z',
        childMemory: 'freed',
        sigchld: episode.sigchld,
      },
      exit.signal !== null ? 'exit-killed' : 'exit',
      // Only an exit_group call crosses the Gate; a signal ends the child where it stands.
      { gate: exit.nr !== null }
    )
  }

  if (wait && exit) {
    list.add('wait', {
      ring: 0,
      focus: 'parent',
      crossing: { name: 'wait4', nr: wait.nr, by: 'parent' },
      parentState: 'R',
      collected: true,
    })
  }

  if (reaped) {
    list.add('reaped', { ring: 3, focus: 'parent', childState: 'gone' }, reaped.byParent ? 'reaped' : 'reaped-by-init')
  } else if (exit) {
    list.add('zombie', { ring: 3, focus: 'child' })
  }

  return { key: episode.key, episode, stages: list.stages }
}

export function episodeLabel(episode: ProcessEpisode): string {
  if (episode.child === null) {
    return `fork failed (${episode.fork.errno ?? 'error'})`
  }
  return `PID ${episode.child} · ${episode.childProgram}`
}
