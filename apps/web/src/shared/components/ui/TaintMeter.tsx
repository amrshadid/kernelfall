import { TAINT_SEGMENTS } from '@shared/constants/ui'
import { filledSegments, taintLabel } from '@shared/utils/level'
import './TaintMeter.css'

export interface TaintMeterProps {
  taint: number
  onOpen: () => void
}

const SEGMENT_IDS = Array.from({ length: TAINT_SEGMENTS }, (_, index) => `segment-${index}`)

/** Segments plus the number, so it never relies on colour. */
export function TaintMeter({ taint, onOpen }: TaintMeterProps) {
  const filled = filledSegments(taint)
  const label = taintLabel(taint)
  return (
    <button
      type="button"
      className="kf-taint"
      onClick={onOpen}
      aria-label={`Taint ${taint}, ${label}. Open the Taint report`}
    >
      Taint {taint}
      <span className="kf-taint__segs" aria-hidden="true">
        {SEGMENT_IDS.map((id, index) => (
          <i key={id} className={index < filled ? 'kf-taint__seg--on' : undefined} />
        ))}
      </span>
      <small className={taint > 0 ? 'kf-taint__label--tainted' : undefined}>{label}</small>
    </button>
  )
}
