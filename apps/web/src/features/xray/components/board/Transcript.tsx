import type { TranscriptEntry } from '@features/xray/types'
import './Transcript.css'

export interface TranscriptProps {
  entries: readonly TranscriptEntry[]
  current: number
}

/** The drawing's twin, for screen readers and for reading at your own pace. */
export function Transcript({ entries, current }: TranscriptProps) {
  return (
    <details className="xr__transcript">
      <summary>Transcript</summary>
      <ol>
        {entries.map((entry, i) => (
          <li key={entry.key} aria-current={i === current ? 'step' : undefined}>
            <p>
              <b>{entry.title}</b> {entry.what}
            </p>
            <p>Why: {entry.why}</p>
          </li>
        ))}
      </ol>
    </details>
  )
}
