import type { Stage } from '@features/xray/types'
import { InlineText } from '@shared/components/ui'
import './BeatLine.css'

export interface BeatLineProps {
  stage: Stage<unknown>
  index: number
  count: number
  /** The next beat is waiting for a guess. */
  guessNext: boolean
  /** What the player guessed for this beat, if it had a Predict pause. */
  guess: string | null
}

/** The beat's one sentence, right under the drawing, so it is read with the beat it belongs to. */
export function BeatLine({ stage, index, count, guessNext, guess }: BeatLineProps) {
  return (
    <div className="xr__beat" aria-live="polite">
      <p className="xr__beat-step">
        {index + 1} of {count} · {stage.title}
        {guessNext ? ' · next, guess first' : ''}
      </p>
      <p className="xr__beat-say">
        <InlineText text={stage.what} />
      </p>
      {guess !== null && stage.predict && (
        <p className="xr__beat-guess">
          You guessed <b>{guess}</b>. <InlineText text={stage.predict.explain} />
        </p>
      )}
    </div>
  )
}
