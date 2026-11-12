import type { SectionFloor, SectionPartView, SectionView } from '@features/xray/types'
import { SECTION_FLOORS } from '@features/xray/utils/section'
import './SectionDrawing.css'

export interface SectionDrawingProps {
  view: SectionView
  /** The command the drawing shows; empty before anything ran. */
  commandLine: string
}

const FLOOR_NAMES = new Map(SECTION_FLOORS.map((floor) => [floor.floor, floor.name]))

const FLOOR_NOTES: Readonly<Record<SectionFloor, string>> = {
  userland: 'where programs run',
  kernel: 'the only program that touches the hardware',
  hardware: 'what the kernel drives',
}

function Part({ part }: { part: SectionPartView }) {
  const lit = part.calls > 0
  return (
    <li className={`xr-section__part${lit ? ' xr-section__part--lit' : ''}`}>
      <span className="xr-section__name">{part.name}</span>
      {lit && (
        <span className="xr-section__count">
          {part.calls} call{part.calls === 1 ? '' : 's'}
        </span>
      )}
      <code className="xr-section__source">{part.source}</code>
      {lit && <span className="xr-section__calls">{part.names.join(', ')}</span>}
    </li>
  )
}

/** init's old drawing: the Machine cut open, each part ruled in red when the run passed through it. */
export function SectionDrawing({ view, commandLine }: SectionDrawingProps) {
  const command = commandLine.trim()
  return (
    // Real text, not a picture: every part and its calls are read out in order.
    <div className={`xr-section${view.total > 0 ? ' xr-section--ran' : ''}`}>
      {view.floors.map(({ floor, parts }) => (
        <section key={floor} className={`xr-section__floor xr-section__floor--${floor}`}>
          <header className="xr-section__head">
            <h3 className="xr-section__floor-name">{FLOOR_NAMES.get(floor)}</h3>
            <p className="xr-section__note">{FLOOR_NOTES[floor]}</p>
          </header>
          {floor === 'userland' ? (
            <>
              <p className={`xr-section__program${command ? ' xr-section__program--ran' : ''}`}>
                {command ? <code>$ {command}</code> : 'No command has run yet.'}
              </p>
              {/* The syscall interface is the Gate itself, so it is drawn as the line, not as a part. */}
              <p className="xr-section__gate">
                <span className="xr-section__gate-name">The Gate</span>
                <span className="xr-section__gate-count">
                  {view.total > 0
                    ? `${view.total} request${view.total === 1 ? '' : 's'} crossed`
                    : 'every request to the kernel crosses here'}
                </span>
              </p>
            </>
          ) : (
            <ul className="xr-section__parts">
              {parts
                .filter((part) => part.id !== 'syscalls')
                .map((part) => (
                  <Part key={part.id} part={part} />
                ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
