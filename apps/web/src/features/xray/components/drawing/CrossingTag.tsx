import { MONO_CHAR_PX } from '@features/xray/utils/drawing'

export interface CrossingTagProps {
  /** The syscall crossing the Gate, e.g. `clone`. */
  name: string
  nr: number
  /** Where the tag starts, when there is room before `maxRight`. */
  x: number
  y: number
  /** Where the tag must end: short of the Gate's posts. */
  maxRight: number
}

const PAD_X = 8
const HEIGHT = 20
/** From the tag's middle to the text's baseline, for 11.5px text. */
const BASELINE_DROP = 4

export function CrossingTag({ name, nr, x, y, maxRight }: CrossingTagProps) {
  const label = `${name} · nr ${nr}`
  const width = label.length * MONO_CHAR_PX + 2 * PAD_X
  const left = Math.min(x, maxRight - width)
  return (
    <g className="xr-cross">
      <rect x={left} y={y - HEIGHT / 2} width={width} height={HEIGHT} fill="var(--red)" />
      <text className="xr-m xr-mb xr-on-red" x={left + PAD_X} y={y + BASELINE_DROP}>
        {label}
      </text>
    </g>
  )
}
