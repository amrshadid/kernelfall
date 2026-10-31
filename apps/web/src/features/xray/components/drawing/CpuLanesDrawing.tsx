import type { CpuLanesView, LaneTaskState } from '@features/xray/types'
import './CpuLanesDrawing.css'

export interface CpuLanesDrawingProps {
  view: CpuLanesView
}

const STATE_WORDS: Readonly<Record<LaneTaskState, string>> = {
  R: 'running or ready',
  S: 'sleeping in a call',
  T: 'stopped',
  Z: 'a zombie, waiting to be reaped',
}

const nameOf = (pid: number, program: string | null) => (program === null ? `PID ${pid}` : `${program} (${pid})`)

/** One lane per CPU: who ran there in order, and the CPU's run queue when the run ended. */
export function CpuLanesDrawing({ view }: CpuLanesDrawingProps) {
  return (
    <div className="xr-cpus">
      {view.lanes.map((lane) => (
        <section key={lane.cpu} className="xr-cpus__lane" aria-label={`CPU ${lane.cpu}`}>
          <h3 className="xr-cpus__name">CPU {lane.cpu}</h3>
          {lane.slices.length > 0 ? (
            <ol className="xr-cpus__slices">
              {lane.slices.map((slice, at) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: a lane's slices never reorder
                <li key={at} className="xr-cpus__slice">
                  <strong>{nameOf(slice.pid, slice.program)}</strong>
                  {slice.calls.length > 0 && <code>{slice.calls.join(', ')}</code>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="xr-cpus__idle">Idle: nothing ran here during this command.</p>
          )}
          <div className="xr-cpus__queue">
            <span className="xr-cpus__queue-name">Run queue</span>
            {lane.queue.length > 0 ? (
              <ul>
                {lane.queue.map((task) => (
                  <li key={task.pid}>
                    {nameOf(task.pid, task.program)}{' '}
                    <abbr title={STATE_WORDS[task.state]} className={`xr-cpus__state xr-cpus__state--${task.state}`}>
                      {task.state}
                    </abbr>
                  </li>
                ))}
              </ul>
            ) : (
              <span>empty</span>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
