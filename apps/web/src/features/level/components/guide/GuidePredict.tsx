import type { GuidePredict as GuidePredictPart } from '@features/level/types'
import { InlineText } from '@shared/components/ui'

export interface GuidePredictProps {
  predict: GuidePredictPart
}

/** The answers to a question the story asked: picked first, then shown beside what happens. No score. */
export function GuidePredict({ predict }: GuidePredictProps) {
  const { onPick } = predict
  if (onPick !== null) {
    return (
      <fieldset className="level-guide__predict">
        <legend>Your call, before init answers</legend>
        <div className="level-guide__predict-options">
          {predict.options.map((option, index) => (
            <button key={option.text} type="button" onClick={() => onPick(index)}>
              <InlineText text={option.text} />
            </button>
          ))}
        </div>
        <p className="level-guide__predict-hint">
          No score.{' '}
          <button type="button" onClick={() => onPick(null)}>
            Just show me
          </button>
        </p>
      </fieldset>
    )
  }
  return (
    <ul className="level-guide__predict level-guide__predict--answered" aria-label="Answers">
      {predict.options.map((option, index) => (
        <li
          key={option.text}
          className={
            option.right
              ? 'level-guide__predict-answer level-guide__predict-answer--right'
              : 'level-guide__predict-answer'
          }
        >
          <InlineText text={option.text} />
          {index === predict.picked && <span className="level-guide__predict-tag">your call</span>}
          {option.right && (
            <span className="level-guide__predict-tag level-guide__predict-tag--right">what happens</span>
          )}
        </li>
      ))}
    </ul>
  )
}
