import type { CallTone, LogRun, OutputStream } from '@features/xray/types'
import { type KeyboardEvent, useEffect, useRef } from 'react'
import './StraceLog.css'

// Words, not only colour: the two streams must read apart without it.
const STREAM_LABEL: Record<OutputStream, string> = { stdout: 'fd 1', stderr: 'fd 2' }

export interface StraceLogProps {
  runs: readonly LogRun[]
  focusId: number | null
  onSelect: (id: number) => void
  /** False under reduced motion: scrolling jumps instead of gliding. */
  animate: boolean
}

const TONE_TEXT: Record<CallTone, string> = {
  ok: 'text-ok',
  error: 'text-error',
  exit: 'text-muted',
  pending: 'text-muted',
}

const LINE_SELECTOR = 'button[data-syscall]'

function moveFocus(event: KeyboardEvent<HTMLOListElement>): void {
  const lines = [...event.currentTarget.querySelectorAll<HTMLButtonElement>(LINE_SELECTOR)]
  const current = lines.indexOf(document.activeElement as HTMLButtonElement)
  const targets: Record<string, number> = {
    ArrowDown: current + 1,
    ArrowUp: current - 1,
    Home: 0,
    End: lines.length - 1,
  }
  const target = targets[event.key]
  if (target === undefined || current === -1) {
    return
  }
  event.preventDefault()
  lines[Math.max(0, Math.min(target, lines.length - 1))]?.focus()
}

/** The same syscalls as the Gate, as strace prints them. */
export function StraceLog({ runs, focusId, onSelect, animate }: StraceLogProps) {
  const list = useRef<HTMLOListElement>(null)

  const behavior = animate ? 'smooth' : 'auto'
  const latestRun = runs.at(-1)?.id
  // biome-ignore lint/correctness/useExhaustiveDependencies: follow the log as new commands arrive
  useEffect(() => {
    list.current?.lastElementChild?.scrollIntoView({ block: 'nearest', behavior })
  }, [latestRun])

  useEffect(() => {
    const line = list.current?.querySelector(`[data-syscall="${focusId}"]`)
    line?.scrollIntoView({ block: 'nearest', behavior })
  }, [focusId, behavior])

  if (runs.length === 0) {
    return <p className="px-3 py-4 text-xs text-muted">strace output appears here, one line per syscall.</p>
  }

  return (
    <ol
      ref={list}
      aria-label="strace log"
      className="space-y-3 overflow-x-auto px-1 py-2 font-mono text-xs"
      onKeyDown={moveFocus}
    >
      {runs.map((run) => (
        <li key={run.id}>
          <p className="px-2 text-muted">
            <span aria-hidden="true" className="text-accent">
              ${' '}
            </span>
            <span className="sr-only">Command: </span>
            {run.commandLine}
          </p>
          {run.note && <p className="mt-1 px-2 text-muted italic">{run.note}</p>}
          <ul className="mt-1">
            {run.lines.map((line) =>
              line.kind === 'exit' ? (
                <li key="exit" className="px-2 py-0.5 whitespace-pre-wrap text-muted">
                  {line.text}
                </li>
              ) : (
                <li key={line.id}>
                  <button
                    type="button"
                    data-syscall={line.id}
                    aria-current={line.id === focusId}
                    onClick={() => onSelect(line.id)}
                    className="flex w-max min-w-full items-baseline px-2 py-0.5 text-left font-mono hover:bg-[var(--red-wash)] aria-[current=true]:bg-[var(--red-wash)] aria-[current=true]:shadow-[inset_3px_0_0] aria-[current=true]:shadow-accent"
                  >
                    {line.stream && (
                      <span className={`xr-stream xr-stream--${line.stream}`}>{STREAM_LABEL[line.stream]}</span>
                    )}
                    {/* One line per call, as strace prints it: the log scrolls sideways rather than wrap. */}
                    <span className="whitespace-pre">{line.head}</span>
                    <span className={`whitespace-pre ${TONE_TEXT[line.tone]}`}>{line.returned}</span>
                  </button>
                </li>
              )
            )}
          </ul>
        </li>
      ))}
    </ol>
  )
}
