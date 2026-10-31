import type { FileRead } from '@kernelfall/game/types'
import { filesOpened, readsOf } from '@kernelfall/game/utils'
import type { LabEvent, Pid } from '@kernelfall/machine/events'

// The Prologue's checkers judge commands as well as the player's programs: any task
// of a command (cat, ls, free) may be the one that read the file.

/** Every task of the command, in the order it first appears. */
export const tasksOf = (events: readonly LabEvent[]): Pid[] => [
  ...new Set(events.flatMap((event) => ('pid' in event ? [event.pid] : []))),
]

/** Every file any task opened by a path that passes `wanted`, with what its reads returned. */
export const readsByAnyTask = (events: readonly LabEvent[], wanted: (path: string) => boolean): FileRead[] =>
  tasksOf(events).flatMap((pid) =>
    [...new Set(filesOpened(events, pid).map(({ path }) => path))]
      .filter(wanted)
      .flatMap((path) => readsOf(events, pid, path))
  )
