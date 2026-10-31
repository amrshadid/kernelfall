import type { NodeState } from '@shared/types'
import { NodeMark } from './NodeMark'

export interface NodeMarkIconProps {
  state: NodeState
  planned?: boolean
}

export function NodeMarkIcon({ state, planned = false }: NodeMarkIconProps) {
  return (
    <svg className="kf-node-icon" viewBox="-17 -17 34 34" aria-hidden="true">
      <NodeMark state={state} planned={planned} />
    </svg>
  )
}
