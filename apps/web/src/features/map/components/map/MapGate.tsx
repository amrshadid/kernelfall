import type { SceneGate } from '@features/map/types'
import './MapGate.css'

/** The A–A section line across the sheet, broken by the Gate: two piers and two leaves, shut until 1.B is passed. */
export function MapGate({ gate }: { gate: SceneGate }) {
  const { x, y, left, right, open } = gate
  return (
    <g>
      <line x1={left + 12} x2={x - 50} y1={y} y2={y} className="map-fig__section" />
      <line x1={x + 50} x2={right - 12} y1={y} y2={y} className="map-fig__section" />
      {[left, right].map((cx) => (
        <g key={cx}>
          <path d={`M${cx} ${y + 12} v14 m-5 -6 l5 6 l5 -6`} className="map-fig__section-arrow" />
          <circle cx={cx} cy={y} r="11" className="map-fig__section-mark" />
          <text x={cx} y={y + 5} textAnchor="middle" className="map-fig__section-lbl">
            A
          </text>
        </g>
      ))}
      <rect x={x - 50} y={y - 20} width="10" height="40" className="map-fig__pier" />
      <rect x={x + 40} y={y - 20} width="10" height="40" className="map-fig__pier" />
      {open ? (
        <>
          <line x1={x - 40} x2={x - 40} y1={y - 18} y2={y + 18} className="map-fig__leaf" />
          <line x1={x + 40} x2={x + 40} y1={y - 18} y2={y + 18} className="map-fig__leaf" />
        </>
      ) : (
        <>
          <line x1={x - 40} x2={x - 22} y1={y} y2={y} className="map-fig__leaf" />
          <line x1={x + 22} x2={x + 40} y1={y} y2={y} className="map-fig__leaf" />
        </>
      )}
    </g>
  )
}
