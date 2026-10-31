import type { PortraitProps } from '@shared/types'
import './Portrait.css'

/** init, PID 1: a draftsman-lamplighter with a `1` badge. Red only for the lamp's light. */
export function InitPortrait({ size = 56 }: PortraitProps) {
  return (
    <svg className="kf-portrait" viewBox="0 0 56 56" width={size} height={size} aria-hidden="true">
      <g fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round">
        <circle cx="22" cy="14" r="7" />
        <path d="M10 52 L14 27 Q22 22 30 27 L34 52 Z" />
        <path d="M29 30 L42 20" />
        <line x1="44" y1="8" x2="44" y2="52" />
      </g>
      <rect x="39" y="6" width="10" height="9" fill="var(--red)" />
      <rect x="16" y="34" width="12" height="12" fill="var(--ink)" />
      <text
        x="22"
        y="44"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="var(--sheet)"
        fontFamily="var(--mono)"
      >
        1
      </text>
    </svg>
  )
}
