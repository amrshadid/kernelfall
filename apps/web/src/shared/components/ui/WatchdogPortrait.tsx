import type { PortraitProps } from '@shared/types'
import './Portrait.css'

export function WatchdogPortrait({ size = 30 }: PortraitProps) {
  return (
    <svg className="kf-portrait" viewBox="0 0 30 30" width={size} height={size} aria-hidden="true">
      <g fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round">
        <path d="M3 10 H20 L27 16 V26 H3 Z" />
        <path d="M5 10 L9 3 L13 10" />
        <circle cx="12" cy="17" r="4.5" fill="var(--sheet)" />
        <path d="M12 14.5 V17 H14" />
      </g>
    </svg>
  )
}
