import type { NodeState } from '@shared/types'
import './NodeMark.css'

export interface NodeMarkProps {
  state: NodeState
  /** Side of the square in SVG units. */
  size?: number
  /** One gentle pulse on the "you are here" ring (removed under reduced motion). */
  pulse?: boolean
  /** Planned but not built yet: a pencilled outline, no padlock. */
  planned?: boolean
  /** The signal-red ring of "you are here", whatever the state. */
  here?: boolean
}

/** Centred on (0, 0) for use inside an SVG. States differ by shape, so colour is never the only signal. */
export function NodeMark({ state, size = 22, pulse = false, planned = false, here = false }: NodeMarkProps) {
  const h = size / 2
  const square = { x: -h, y: -h, width: size, height: size }
  const ring =
    here || state === 'progress' ? (
      <rect
        x={-h - 6}
        y={-h - 6}
        width={size + 12}
        height={size + 12}
        className={`kf-node__here${pulse ? ' kf-node__here--pulse' : ''}`}
      />
    ) : null
  if (planned) {
    return (
      <>
        <rect {...square} className="kf-node__planned" />
        <path d={`M${-h + 5} ${h - 5} L${h - 5} ${-h + 5}`} className="kf-node__planned-stroke" />
      </>
    )
  }
  switch (state) {
    case 'done':
      return (
        <>
          {ring}
          <rect {...square} className="kf-node__solid" />
        </>
      )
    case 'clean':
      return (
        <>
          {ring}
          <rect {...square} className="kf-node__solid" />
          <path d={`M${h + 2} ${-h - 9} l6 6 -6 6 -6 -6z`} className="kf-node__clean" />
        </>
      )
    case 'helped':
      return (
        <>
          {ring}
          <rect {...square} className="kf-node__open" />
          <rect x={-h + 4} y={-h + 4} width={size - 8} height={size - 8} className="kf-node__solid" />
        </>
      )
    case 'progress':
      return (
        <>
          {ring}
          <rect {...square} className="kf-node__open" />
          <rect x={-h} y={-h} width={h} height={size} className="kf-node__fill" />
        </>
      )
    case 'available':
      return (
        <>
          {ring}
          <rect {...square} className="kf-node__open" />
          <rect x={-h + 5} y={-h + 5} width={size - 10} height={size - 10} className="kf-node__inner" />
        </>
      )
    case 'locked':
      return (
        <>
          {ring}
          <rect {...square} className="kf-node__locked" />
          <path d="M-4 -1 v-3 a4 4 0 0 1 8 0 v3 M-6 -1 h12 v8 h-12z" className="kf-node__padlock" />
        </>
      )
  }
}
