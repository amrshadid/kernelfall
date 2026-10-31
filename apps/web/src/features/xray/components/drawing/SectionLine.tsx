export interface SectionLineProps {
  /** Where the line runs across. */
  y: number
  width: number
  /** The syscall number in the Gatekeeper's slot, or empty while nothing is at the Gate. */
  slot: string
  /** Where the Gatekeeper stands. */
  gateX: number
}

/** The user/kernel boundary, A–A, and the Gate where syscalls cross. */
export function SectionLine({ y, width, slot, gateX }: SectionLineProps) {
  return (
    <g>
      <line className="xr-line" x1={0} y1={y} x2={width} y2={y} />
      <text className="xr-ttl xr-dim" x={width} y={y - 6} textAnchor="end">
        A–A
      </text>
      <text className="xr-zone" x={14} y={y + 22}>
        Kernel space · ring 0
      </text>
      <rect className="xr-frame" x={gateX} y={y - 13} width={7} height={26} />
      <rect className="xr-frame" x={gateX + 50} y={y - 13} width={7} height={26} />
      <g className="xr-simple" transform={`translate(${gateX + 6} 0)`}>
        <path
          d={`M0 ${y} V${y - 36} Q22 ${y - 56} 44 ${y - 36} V${y}`}
          fill="var(--sheet)"
          stroke="var(--ink)"
          strokeWidth={2.5}
        />
        <rect x={8} y={y - 34} width={28} height={17} fill="var(--red)" />
        <text key={slot} className="xr-m xr-mb xr-on-red xr-stamp" x={22} y={y - 21} textAnchor="middle">
          {slot}
        </text>
        <path d={`M8 ${y - 8} H36`} stroke="var(--ink)" strokeWidth={2} />
      </g>
    </g>
  )
}
