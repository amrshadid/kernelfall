import type { ProcessPages } from '@features/xray/types'
import { PAGE } from '@features/xray/utils/drawing'

export interface MemoryPagesProps {
  x: number
  /** The top of the program box the pages sit in. */
  y: number
  pages: ProcessPages
  /** The hatch pattern's id, for shared copy-on-write pages. */
  hatch: string
}

export function MemoryPages({ x, y, pages, hatch }: MemoryPagesProps) {
  const { labels, kind, hidden } = pages
  return (
    <g className={`xr-fade${hidden ? ' xr-hide' : ''}`}>
      {labels.map((label, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a new program's pages share one label
        <g key={i}>
          <rect
            className={kind === 'new' ? 'xr-cell xr-cell--new' : 'xr-cell'}
            fill={kind === 'shared' ? `url(#${hatch})` : undefined}
            x={x + i * PAGE.step}
            y={y + PAGE.top}
            width={PAGE.width}
            height={PAGE.height}
          />
          <text
            className="xr-m xr-page"
            x={x + i * PAGE.step + PAGE.width / 2}
            y={y + PAGE.baseline}
            textAnchor="middle"
          >
            {label}
          </text>
        </g>
      ))}
    </g>
  )
}
