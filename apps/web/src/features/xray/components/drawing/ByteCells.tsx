import { CELL_HEIGHT, CELL_WIDTH } from '@features/xray/utils/drawing'

export interface ByteCellsProps {
  x: number
  y: number
  /** One label per byte; an empty label draws an empty cell. */
  cells: readonly string[]
  /** `copy` cells are toned: the kernel's copy, not the original. */
  tone?: 'plain' | 'copy'
  /** Draw a trailing ellipsis: more bytes than cells. */
  more?: boolean
}

export function ByteCells({ x, y, cells, tone = 'plain', more = false }: ByteCellsProps) {
  const cellClass = tone === 'copy' ? 'xr-cell xr-cell--new' : 'xr-cell'
  return (
    <g>
      {cells.map((cell, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a byte's place is its identity
        <g key={i}>
          <rect className={cellClass} x={x + i * CELL_WIDTH} y={y} width={CELL_WIDTH} height={CELL_HEIGHT} />
          <text
            className="xr-m xr-mb"
            x={x + i * CELL_WIDTH + CELL_WIDTH / 2}
            y={y + 16}
            textAnchor="middle"
            style={cell.length > 1 ? { fontSize: '9px' } : undefined}
          >
            {cell}
          </text>
        </g>
      ))}
      {more && (
        <text className="xr-m xr-dim" x={x + cells.length * CELL_WIDTH + 4} y={y + 16}>
          …
        </text>
      )}
    </g>
  )
}
