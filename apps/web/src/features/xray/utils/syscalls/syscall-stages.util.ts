import type {
  CallStep,
  Stage,
  StageText,
  StageTextOptions,
  SyscallScene,
  SyscallStoryboard,
  XrayCall,
} from '@features/xray/types'
import { stageText } from '@features/xray/utils/narration'
import type { SyscallDeskKey, SyscallStageKey, TemplateValues, XrayNarration } from '@kernelfall/levels/types'
import { fillTemplate } from '@kernelfall/levels/utils'
import { forkChoices, returnOf, syscallValues, writeChoices } from './syscall-values.util'

// SIMPLIFIED: every call is drawn entering by int $0x80 (arch/x86/entry/entry_32.S, syscall_32.c);
// most musl calls really enter by sysenter through the vDSO and join this path at the dispatch.
const ENTRY_PATH = ['entry_INT80_32', 'do_int80_syscall_32', 'ia32_sys_call'] as const
// models drivers/tty/tty_io.c: tty_write() → iterate_tty_write() → the line discipline's write
const CONSOLE_PATH = ['tty_write', 'iterate_tty_write', 'n_tty_write'] as const
/** The console path's functions that copy the bytes in; the last one draws them. */
const CONSOLE_COPY_STEPS = 2

type ScenePatch = Partial<Pick<SyscallScene, 'loaded' | 'saved' | 'answered' | 'copied' | 'printed' | 'back'>>

/** Which "In the kernel now" line a step shows; the step where the call does its own work has none. */
function deskKeyOf(step: CallStep, call: XrayCall): SyscallDeskKey | null {
  const done = returnOf(call)
  switch (step) {
    case 'fd':
      return done?.errno === 'EBADF' ? 'fd-ebadf' : call.console !== null ? 'fd-console' : 'fd'
    case 'copy':
      return call.console !== null ? 'copy-console' : 'copy'
    case 'answer':
      return done ? 'answer' : 'answer-none'
    case 'work':
      return null
    default:
      return step
  }
}

/** Each stage carries the drawing's state so far. */
class StageList {
  readonly #call: XrayCall
  readonly #path: readonly string[]
  readonly #narration: XrayNarration
  readonly #values: TemplateValues
  readonly #stages: Stage<SyscallScene>[] = []
  #reached = 0
  #flags: Required<ScenePatch> = {
    loaded: false,
    saved: false,
    answered: false,
    copied: false,
    printed: false,
    back: false,
  }

  constructor(call: XrayCall, path: readonly string[], narration: XrayNarration, values: TemplateValues) {
    this.#call = call
    this.#path = path
    this.#narration = narration
    this.#values = values
  }

  text(key: SyscallStageKey, predict: StageTextOptions['predict'] = null): StageText {
    return stageText(this.#narration.syscallStages[key], this.#values, { sources: this.#call.sources, predict })
  }

  add(step: CallStep, text: StageText, ring: 0 | 3, active: readonly string[], patch: ScenePatch = {}): void {
    for (const name of active) {
      this.#reached = Math.max(this.#reached, this.#path.indexOf(name) + 1)
    }
    this.#flags = { ...this.#flags, ...patch }
    this.#stages.push({
      ...text,
      key: step,
      scene: { step, ring, active, reached: this.#reached, ...this.#flags, desk: this.#desk(step) },
    })
  }

  #desk(step: CallStep): SyscallScene['desk'] {
    const key = deskKeyOf(step, this.#call)
    if (key === null) {
      const call = this.#call
      return { fn: call.kernelPath.at(-1) ?? call.name, say: call.desk, file: call.sources[0]?.path ?? '' }
    }
    const desk = this.#narration.desks[key]
    const fill = (text: string) => fillTemplate(text, this.#values)
    return { fn: fill(desk.fn), say: fill(desk.say), file: fill(desk.file) }
  }

  get stages(): readonly Stage<SyscallScene>[] {
    return this.#stages
  }
}

/** The stage where the call does its own work: its family's variant for how it ended. */
function workKey(call: XrayCall): SyscallStageKey {
  const done = returnOf(call)
  const failed = done?.errno != null
  switch (call.family) {
    case 'execve':
      return failed ? 'execve-failed' : 'execve'
    case 'fork':
      return failed ? 'fork-failed' : 'fork'
    case 'wait':
      return failed ? 'wait-failed' : done?.ret === 0 ? 'wait-none' : 'wait'
    default:
      return 'work'
  }
}

/** The answer stage: no answer yet, an error, or a result, with a guess where there is one to make. */
function answerText(list: StageList, call: XrayCall): StageText {
  const done = returnOf(call)
  const write = call.family === 'write'
  if (!done) {
    return list.text(call.outcome.kind === 'pending' ? 'answer-pending' : 'answer-killed')
  }
  if (done.errno !== null) {
    return write ? list.text('answer-error-write', writeChoices(call)) : list.text('answer-error')
  }
  if (write) {
    return list.text('answer-write', writeChoices(call))
  }
  return call.family === 'fork' ? list.text('answer-fork', forkChoices(call)) : list.text('answer')
}

/** The same way in for every syscall, then what this call does, then the way out. */
export function syscallStoryboard(call: XrayCall, narration: XrayNarration): SyscallStoryboard {
  const handlerPath = call.kernelPath
  const toConsole = call.family === 'write' && call.console !== null
  const path = [...ENTRY_PATH, ...handlerPath, ...(toConsole ? CONSOLE_PATH : [])]
  const list = new StageList(call, path, narration, syscallValues(call, narration.parts))
  const [entry, dispatch, table] = ENTRY_PATH
  const done = returnOf(call)
  const key = `call:${call.id}`

  list.add('call', list.text('call'), 3, [])
  list.add('registers', list.text('registers'), 3, [], { loaded: true })
  list.add('gate', list.text('gate'), 0, [entry])
  list.add('entry', list.text('entry'), 0, [entry], { saved: true })
  list.add('dispatch', list.text('dispatch'), 0, [dispatch, table, handlerPath[0] ?? ''])

  if (call.family === 'exit') {
    list.add('work', list.text('exit'), 0, handlerPath.slice(1))
    list.add('noreturn', list.text('noreturn', 'content'), 0, handlerPath.slice(-1))
    return { key, call, path, stages: list.stages }
  }

  if (call.family === 'write') {
    const [, ksys, vfs] = handlerPath
    const badFd = done?.errno === 'EBADF'
    list.add('fd', list.text(badFd ? 'fd-ebadf' : toConsole ? 'fd-console' : 'fd'), 0, [ksys ?? '', vfs ?? ''])
    if (!badFd && call.buffer) {
      const fault = done?.errno === 'EFAULT'
      const copied = fault ? 'copy-efault' : toConsole ? 'copy-console' : 'copy'
      list.add('copy', list.text(copied), 0, toConsole ? CONSOLE_PATH.slice(0, CONSOLE_COPY_STEPS) : [], {
        copied: !fault,
      })
    }
    if (toConsole) {
      list.add('driver', list.text('driver'), 0, CONSOLE_PATH.slice(CONSOLE_COPY_STEPS), { printed: true })
    }
  } else {
    list.add('work', list.text(workKey(call)), 0, handlerPath.slice(1))
  }

  list.add('answer', answerText(list, call), 0, [dispatch], { answered: done !== null })
  if (done) {
    const execed = call.family === 'execve' && done.errno === null
    list.add('sysret', list.text(execed ? 'sysret-exec' : 'sysret'), 3, [], { back: true })
  }
  return { key, call, path, stages: list.stages }
}
