import type { RailStep } from '@shared/types'
import { stepStates } from '@shared/utils/level'
import './StepRail.css'

export interface StepRailProps {
  steps: readonly RailStep[]
  /** Index of the current step; `steps.length` once every step is done. */
  currentIndex: number
  /** The step being looked at again, if the player went back to one. */
  reviewing?: string | null
  /** Lets the player revisit a done step. Without it, done steps are plain text. */
  onSelect?: (id: string) => void
}

export function StepRail({ steps, currentIndex, reviewing = null, onSelect }: StepRailProps) {
  const states = stepStates(steps.length, currentIndex)
  return (
    <ol className="kf-rail" aria-label="Level steps">
      {steps.map((step, index) => {
        const state = states[index] ?? 'future'
        const isReviewed = reviewing === step.id
        return (
          <li
            key={step.id}
            className={`kf-rail__step kf-rail__step--${state}${isReviewed ? ' kf-rail__step--reviewing' : ''}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="kf-rail__sq" aria-hidden="true" />
            {state === 'done' && onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                aria-pressed={isReviewed}
                aria-label={`${step.label} (done), look again`}
              >
                {step.label}
              </button>
            ) : (
              <span>{step.label}</span>
            )}
            {state === 'done' && !onSelect && <span className="kf-visually-hidden">(done)</span>}
          </li>
        )
      })}
    </ol>
  )
}
