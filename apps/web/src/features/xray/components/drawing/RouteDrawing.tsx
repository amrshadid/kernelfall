import type { RouteView } from '@features/xray/types'
import './RouteDrawing.css'

export interface RouteDrawingProps {
  view: RouteView
}

/** Each call of the run, top to bottom: who made it, the way down through the kernel, and who served it. */
export function RouteDrawing({ view }: RouteDrawingProps) {
  return (
    <table className="xr-route">
      <thead>
        <tr>
          <th scope="col">Process</th>
          <th scope="col">Call</th>
          <th scope="col">Route</th>
          <th scope="col">Served by</th>
        </tr>
      </thead>
      <tbody>
        {view.rows.map((row) => (
          <tr key={row.id} className={`xr-route__row xr-route__row--${row.part.kind}`}>
            <td className="xr-route__process">
              {row.program}
              <span className="xr-route__pid">{row.pid}</span>
            </td>
            <td className="xr-route__call">
              <code>
                {row.text} {row.result}
              </code>
              {row.file !== null && <span className="xr-route__file">{row.file}</span>}
            </td>
            <td className="xr-route__steps">
              <code>{row.steps.join(' → ')}</code>
              {row.end !== null && <span className="xr-route__end">{row.end}</span>}
            </td>
            <td className="xr-route__part">
              <strong>{row.part.name}</strong>
              <code>{row.part.source}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
