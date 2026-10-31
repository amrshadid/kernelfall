import type { ContentsEntry } from '@shared/types'
import './ContentsList.css'

export interface ContentsListProps {
  headingId: string
  heading: string
  entries: readonly ContentsEntry[]
}

export function ContentsList({ headingId, heading, entries }: ContentsListProps) {
  return (
    <div className="kf-contents">
      <h2 id={headingId}>{heading}</h2>
      <ul aria-labelledby={headingId}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <ContentsLine entry={entry} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function ContentsLine({ entry }: { entry: ContentsEntry }) {
  const inner = (
    <>
      <span className="kf-contents__name">{entry.name}</span>
      <span className="kf-contents__leader" aria-hidden="true" />
      <span className="kf-contents__ref">{entry.reference}</span>
    </>
  )
  if (entry.href !== undefined) {
    return (
      <a className="kf-contents__line" href={entry.href}>
        {inner}
      </a>
    )
  }
  return (
    <button type="button" className="kf-contents__line" onClick={entry.onSelect}>
      {inner}
    </button>
  )
}
