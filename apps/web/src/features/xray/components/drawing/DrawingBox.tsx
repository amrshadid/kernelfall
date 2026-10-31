import type { ReactNode } from 'react'

export interface DrawingBoxProps {
  x: number
  y: number
  width: number
  height: number
  title?: string | undefined
  /** Outlined in red: where the story is now. */
  on?: boolean | undefined
  /** Dashed: something that has ended (a zombie, a freed task). */
  ghost?: boolean | undefined
  hidden?: boolean | undefined
  faint?: boolean | undefined
  children?: ReactNode
}

const TITLE_BAND = 22

export function DrawingBox({
  x,
  y,
  width,
  height,
  title,
  on = false,
  ghost = false,
  hidden = false,
  faint = false,
  children,
}: DrawingBoxProps) {
  const classes = [
    'xr-box xr-fade',
    on && 'xr-box--on',
    ghost && 'xr-box--ghost',
    hidden && 'xr-hide',
    faint && 'xr-faint',
  ].filter(Boolean)
  return (
    <g className={classes.join(' ')}>
      <rect className="xr-frame" x={x} y={y} width={width} height={height} />
      {title !== undefined && (
        <>
          <rect className="xr-hdr" x={x + 1} y={y + 1} width={width - 2} height={TITLE_BAND} />
          <text className="xr-ttl" x={x + 8} y={y + 16}>
            {title}
          </text>
        </>
      )}
      {children}
    </g>
  )
}
