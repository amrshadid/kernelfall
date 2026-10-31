import type { CheckInput } from '#types/definitions/checker'
import type { TaintCheck } from '#types/definitions/checks'
import type { TaintFinding } from '#types/definitions/taint'
import { basename, eventsOf, forkedChildren, judgedProcesses } from '#utils/queries/index'

/** What one declared Taint check finds in a command's events: nothing, or each hack with its revealing event. */
export function findTaint(check: TaintCheck, { events }: CheckInput): readonly TaintFinding[] {
  switch (check.kind) {
    case 'unreaped-children':
      return judgedProcesses(events, check).flatMap((pid) => {
        const children = forkedChildren(events, pid)
        const zombies = children.filter((child) => child.reapedSeq === null)
        const first = zombies[0]
        if (!first) {
          return []
        }
        const pids = zombies.map((child) => child.pid).join(', ')
        return [
          {
            detail: `${zombies.length} of ${children.length} children were never waited for (pid ${pids})`,
            seq: first.forkSeq,
          },
        ]
      })
    case 'ran-program': {
      const judged = new Set(judgedProcesses(events, check))
      const ran = eventsOf(events, 'sched_process_exec').find(
        (event) => !judged.has(event.pid) && check.programs.includes(basename(event.filename))
      )
      return ran ? [{ detail: `pid ${ran.pid} ran ${ran.filename}`, seq: ran.seq }] : []
    }
  }
}
