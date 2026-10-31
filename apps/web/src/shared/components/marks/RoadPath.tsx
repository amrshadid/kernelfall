import type { RoadShape } from '@shared/types'
import './Marks.css'

/** The road through the stops: inked where travelled, dashed ahead. */
export function RoadPath({ road }: { road: RoadShape }) {
  return (
    <>
      {road.reached !== '' && <path d={road.reached} className="kf-road" />}
      <path d={road.ahead} className="kf-road kf-road--ahead" />
    </>
  )
}
