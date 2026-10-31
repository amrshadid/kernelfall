import type { RunEvent } from '@kernelfall/machine/hooks'
import type { TraceRun } from '@kernelfall/machine/types'
import { useEffect, useRef, useState } from 'react'

/** A live run is redrawn at most this often per event it holds, up to LIVE_REDRAW_MAX_MS. */
const LIVE_REDRAW_MS_PER_EVENT = 0.02
const LIVE_REDRAW_MAX_MS = 2000

interface Shown {
  readonly run: TraceRun | undefined
  readonly events: readonly RunEvent[]
}

export function liveRedrawMs(events: number): number {
  return Math.min(LIVE_REDRAW_MAX_MS, events * LIVE_REDRAW_MS_PER_EVENT)
}

/**
 * The run X-ray draws. While it runs, it is redrawn less often the bigger it is: grouping 90k
 * events takes ~150 ms, and the trace updates ten times a second. A finished run shows at once.
 */
export function useLiveRun(run: TraceRun | undefined, events: readonly RunEvent[]): Shown {
  const live = run?.running === true
  const [shown, setShown] = useState<Shown>({ run, events })
  const shownAt = useRef(0)
  const sameRun = shown.run?.id === run?.id

  useEffect(() => {
    if (!live) {
      return
    }
    const show = () => {
      shownAt.current = Date.now()
      setShown({ run, events })
    }
    const wait = sameRun ? shownAt.current + liveRedrawMs(events.length) - Date.now() : 0
    if (wait <= 0) {
      show()
      return
    }
    const timer = setTimeout(show, wait)
    return () => clearTimeout(timer)
  }, [live, sameRun, run, events])

  return live && sameRun ? shown : { run, events }
}
