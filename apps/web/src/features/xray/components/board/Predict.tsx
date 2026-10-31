import type { StagePredict } from '@features/xray/types'
import { Button, InlineText } from '@shared/components/ui'
import './Predict.css'

export interface PredictProps {
  predict: StagePredict
  picked: string | null
  onPick: (option: string) => void
  /** Play the stage: after a pick, or straight away without one. */
  onWatch: () => void
}

/** No score, and skipping is fine. */
export function Predict({ predict, picked, onPick, onWatch }: PredictProps) {
  return (
    <section className="xr__predict" aria-label="Predict first">
      <h3>Predict first</h3>
      <p className="xr__predict-q">
        <InlineText text={predict.question} />
      </p>
      <div className="xr__options">
        {predict.options.map((option) => (
          <button
            key={option}
            type="button"
            className={option.length > 4 ? 'xr__option--long' : undefined}
            aria-pressed={option === picked}
            onClick={() => onPick(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="xr__predict-hint">No score. Pick one, then watch what really happens.</p>
      <div className="xr__predict-actions">
        {picked !== null ? (
          <Button size="sm" variant="primary" onClick={onWatch}>
            Watch it happen
          </Button>
        ) : (
          <Button size="sm" variant="quiet" onClick={onWatch}>
            Just show me
          </Button>
        )}
      </div>
    </section>
  )
}
