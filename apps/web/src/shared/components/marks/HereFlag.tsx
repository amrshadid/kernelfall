import type { FlagBounds, MarkPoint } from '@shared/types'
import { hereFlag } from '@shared/utils/map'
import './Marks.css'

export interface HereFlagProps {
  stop: MarkPoint
  /** The stop's NodeMark size: the pin stops just short of its red ring. */
  nodeSize: number
  bounds: FlagBounds
  className?: string
}

/** "You are here" over a stop of the Kernel Map. */
export function HereFlag({ stop, nodeSize, bounds, className }: HereFlagProps) {
  const { pin, box, label } = hereFlag(stop, nodeSize, bounds)
  return (
    <g className={`kf-flag${className ? ` ${className}` : ''}`}>
      <path d={pin} className="kf-flag__red" />
      <rect {...box} className="kf-flag__red" />
      <text x={label.x} y={label.y} textAnchor="middle" className="kf-flag__label">
        You are here
      </text>
    </g>
  )
}
