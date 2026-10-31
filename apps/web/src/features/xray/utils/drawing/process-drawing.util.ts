import type { DrawingTableRow, ProcessPages, ProcessScene, ProcessStoryboard } from '@features/xray/types'
import { firstLine, fitText } from './drawing-text.util'
import {
  CHILD_X,
  CROSSING_INSET,
  NEW_PROGRAM_PAGE,
  PAGES,
  PARENT_X,
  POINTER_DROP,
  POINTER_X,
  PROCESS_BOX_Y,
  PROCESS_FIT,
  PROCESS_KERNEL_TOP,
  STATE_TEXT,
} from './process-drawing.constants'

/** Where things go on the process figure, for one scene. */
export interface ProcessDrawingLayout {
  readonly hasChild: boolean
  readonly childEnded: boolean
  readonly parentPages: ProcessPages
  readonly childPages: ProcessPages
  readonly pointerX: number
  readonly pointerY: number
  /** Where the crossing tag starts, under the process making the call. */
  readonly crossingX: number
  readonly parentRows: readonly DrawingTableRow[]
  readonly childRows: readonly DrawingTableRow[]
}

/** The process figure's text lines, each already cut to its box. */
export interface ProcessDrawingText {
  readonly parentTitle: string
  readonly childTitle: string
  readonly parentLine1: string
  readonly parentLine2: string
  readonly childLine1: string
  readonly childLine2: string
  readonly printed: string
  readonly nowFn: string
}

function hasEnded(scene: ProcessScene): boolean {
  return scene.childState === 'Z' || scene.childState === 'gone'
}

/** The child's exit as task_struct shows it: a code, a signal, or nothing yet. */
export function exitText(storyboard: ProcessStoryboard, scene: ProcessScene): string {
  const { exit } = storyboard.episode
  if (exit === null || !hasEnded(scene)) {
    return '—'
  }
  return exit.signal !== null ? `signal ${exit.signal}` : String(exit.code)
}

function childLine1(scene: ProcessScene): string {
  if (scene.step === 'execfail') {
    return 'execve → -1, must _exit'
  }
  if (scene.childMemory === 'new' || hasEnded(scene)) {
    return `running ${scene.childProgram}`
  }
  return scene.forkReturned ? 'fork() → 0' : ''
}

function childLine2(scene: ProcessScene): string {
  if (scene.childState === 'Z') {
    return 'zombie: status kept'
  }
  return scene.childState === 'gone' ? 'reaped' : ''
}

function parentLine2(storyboard: ProcessStoryboard, scene: ProcessScene): string {
  const { child, exit } = storyboard.episode
  if (scene.collected) {
    const status = exit?.signal != null ? `sig ${exit.signal}` : (exit?.code ?? 0)
    return fitText(`wait4 → ${child}, status ${status}`, PROCESS_FIT.parentLine)
  }
  return scene.parentState === 'S' ? 'asleep in wait4' : ''
}

export function processDrawingText(storyboard: ProcessStoryboard, scene: ProcessScene): ProcessDrawingText {
  const { episode } = storyboard
  const { parent, child } = episode
  return {
    parentTitle: fitText(`${parent.program} · PID ${parent.pid}`, PROCESS_FIT.title),
    childTitle: fitText(`${scene.childProgram} · PID ${child ?? '?'}`, PROCESS_FIT.title),
    parentLine1: scene.forkReturned && child !== null ? `fork() → ${child}` : `${episode.fork.name}()`,
    parentLine2: parentLine2(storyboard, scene),
    childLine1: childLine1(scene),
    childLine2: childLine2(scene),
    printed: fitText(firstLine(episode.printed), PROCESS_FIT.printed),
    nowFn: fitText(scene.now.fn, PROCESS_FIT.now),
  }
}

export function processDrawingLayout(storyboard: ProcessStoryboard, scene: ProcessScene): ProcessDrawingLayout {
  const { parent, child } = storyboard.episode
  const hasChild = scene.childState !== null && child !== null
  const shared = scene.step === 'memory' || (scene.childMemory === 'copy' && scene.step === 'returns')
  const ownKind = shared ? 'shared' : 'own'
  const newProgram = scene.childMemory === 'new'

  return {
    hasChild,
    childEnded: hasEnded(scene),
    parentPages: { labels: PAGES, kind: ownKind, hidden: false },
    childPages: {
      labels: newProgram ? PAGES.map((page) => (page === 'heap' || page === 'stack' ? page : NEW_PROGRAM_PAGE)) : PAGES,
      kind: newProgram ? 'new' : ownKind,
      hidden: !hasChild || scene.childMemory === 'freed',
    },
    pointerX: scene.focus === 'child' ? CHILD_X - POINTER_X.childGap : POINTER_X.parent,
    pointerY: scene.ring === 0 ? PROCESS_KERNEL_TOP + POINTER_DROP.kernel : PROCESS_BOX_Y + POINTER_DROP.user,
    crossingX: (scene.crossing?.by === 'child' ? CHILD_X : PARENT_X) + CROSSING_INSET,
    parentRows: [
      { label: 'pid', value: String(parent.pid) },
      { label: 'comm', value: fitText(`"${parent.program}"`, PROCESS_FIT.comm) },
      {
        label: 'state',
        value: STATE_TEXT[scene.parentState],
        on: scene.step === 'returns' || scene.step === 'wait',
      },
    ],
    childRows: [
      { label: 'pid', value: String(child ?? '') },
      { label: 'comm', value: fitText(`"${scene.childProgram}"`, PROCESS_FIT.comm), on: scene.step === 'newprog' },
      {
        label: 'state',
        value: STATE_TEXT[scene.childState ?? 'R'],
        on: scene.step === 'exit' || scene.step === 'zombie' || scene.step === 'reaped',
      },
      { label: 'exit', value: exitText(storyboard, scene), on: scene.step === 'wait' },
      { label: 'parent', value: `${parent.pid}` },
    ],
  }
}
