import type { SectionView } from '@features/xray/types'
import { SECTION_FLOORS } from '@features/xray/utils/section'
import './SectionDrawing.css'

export interface SectionDrawingProps {
  view: SectionView
}

const FLOOR_NAMES = new Map(SECTION_FLOORS.map((floor) => [floor.floor, floor.name]))

/** init's old drawing: the Machine cut open, each part ruled in red when the run passed through it. */
export function SectionDrawing({ view }: SectionDrawingProps) {
  return (
    // Real text, not a picture: every part and its calls are read out in order.
    <div className="xr-section">
      {view.floors.map(({ floor, parts }) => (
        <section key={floor} className={`xr-section__floor xr-section__floor--${floor}`}>
          <h3 className="xr-section__floor-name">{FLOOR_NAMES.get(floor)}</h3>
          <ul className="xr-section__parts">
            {parts.map((part) => (
              <li key={part.id} className={`xr-section__part${part.calls > 0 ? ' xr-section__part--lit' : ''}`}>
                <span className="xr-section__name">{part.name}</span>
                <code className="xr-section__source">{part.source}</code>
                {part.calls > 0 && (
                  <span className="xr-section__calls">
                    {part.calls} call{part.calls === 1 ? '' : 's'}: {part.names.join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
