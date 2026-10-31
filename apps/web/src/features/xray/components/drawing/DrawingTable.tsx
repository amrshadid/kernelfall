import type { DrawingTableRow } from '@features/xray/types'
import { TABLE_HEAD } from '@features/xray/utils/drawing'
import { DrawingBox } from './DrawingBox'

export interface DrawingTableProps {
  x: number
  y: number
  width: number
  title: string
  rows: readonly DrawingTableRow[]
  /** Where the value column starts, from the box's left edge. */
  keyWidth: number
  rowHeight?: number
  on?: boolean
  ghost?: boolean
  hidden?: boolean
  faint?: boolean
}

export function DrawingTable({
  x,
  y,
  width,
  title,
  rows,
  keyWidth,
  rowHeight = 20,
  on,
  ghost,
  hidden,
  faint,
}: DrawingTableProps) {
  return (
    <DrawingBox
      x={x}
      y={y}
      width={width}
      height={TABLE_HEAD + 4 + rows.length * rowHeight}
      title={title}
      on={on}
      ghost={ghost}
      hidden={hidden}
      faint={faint}
    >
      {rows.map((row, i) => {
        const rowY = y + TABLE_HEAD + 2 + i * rowHeight
        return (
          <g key={row.label}>
            <rect
              className={row.on ? 'xr-rowbg xr-rowbg--on' : 'xr-rowbg'}
              x={x + 2}
              y={rowY}
              width={width - 4}
              height={rowHeight}
            />
            <rect className="xr-bar" x={x + 2} y={rowY} width={4} height={rowHeight} />
            <text className="xr-m xr-mb" x={x + 10} y={rowY + rowHeight - 6}>
              {row.label}
            </text>
            <text
              key={row.flip ? row.value : undefined}
              className={row.flip ? 'xr-m xr-flip' : 'xr-m'}
              x={x + keyWidth}
              y={rowY + rowHeight - 6}
            >
              {row.value}
            </text>
          </g>
        )
      })}
    </DrawingBox>
  )
}
