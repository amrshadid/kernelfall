import type { PlacementRow, PlacementStep, PlacementSummary } from '@features/placement/types'
import { Button, ButtonLink, InlineText } from '@shared/components/ui'
import type { ReactNode } from 'react'
import './Placement.css'

export interface PlacementPresentationProps {
  regionName: string
  /** init's offer. */
  offer: string
  minutes: number
  step: PlacementStep
  rows: readonly PlacementRow[]
  index: number
  summary: PlacementSummary | null
  /** Where "walk me through" goes: the region's first level. */
  firstLevelHref: string
  /** Where the result sends the player: the level to play, or the region's capstone. */
  nextHref: string
  /** The Machine for the task on screen: its editor and terminal. */
  workbench: ReactNode
  onBegin: () => void
  onGoTo: (index: number) => void
  onFinish: () => void
  onRetake: () => void
}

export function PlacementPresentation(props: PlacementPresentationProps) {
  const { regionName, step } = props
  return (
    <section className="placement" aria-label={`Placement check: ${regionName}`}>
      <header className="placement__head">
        <p className="placement__kicker">Placement check</p>
        <h1 tabIndex={-1}>{regionName}</h1>
      </header>
      {step === 'offer' && <Offer {...props} />}
      {step === 'tasks' && <Tasks {...props} />}
      {step === 'result' && <Result {...props} />}
    </section>
  )
}

function Offer({ offer, minutes, rows, firstLevelHref, onBegin }: PlacementPresentationProps) {
  return (
    <div className="placement__offer">
      <p className="placement__line">
        <b>init:</b> {offer}
      </p>
      <p>
        About {minutes} minutes, {rows.length} small tasks, one per level. Each is checked by what the Machine does: no
        trivia, no timer. A task you pass places you past its level; one you don't sends you to just that level.
      </p>
      <ol className="placement__list">
        {rows.map((row) => (
          <li key={row.levelId}>
            <span className="placement__level">{row.level}</span>
            <InlineText text={row.task} />
          </li>
        ))}
      </ol>
      <div className="placement__actions">
        <Button variant="primary" onClick={onBegin}>
          Show init
        </Button>
        <ButtonLink href={firstLevelHref} variant="quiet">
          Walk me through it
        </ButtonLink>
      </div>
    </div>
  )
}

function Tasks({ rows, index, workbench, onGoTo, onFinish }: PlacementPresentationProps) {
  const row = rows[index]
  return (
    <div className="placement__tasks">
      <nav aria-label="Tasks">
        <ol className="placement__steps">
          {rows.map((each, at) => (
            <li key={each.levelId}>
              <button type="button" aria-current={at === index ? 'step' : undefined} onClick={() => onGoTo(at)}>
                <span>{each.level}</span>
                <span className={each.passed ? 'placement__done' : 'placement__todo'}>
                  {each.passed ? 'done' : `${each.met} of ${each.of}`}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {row && (
        <div className="placement__task">
          <h2>
            Task {index + 1}: {row.level}
          </h2>
          <p>
            <InlineText text={row.task} />
          </p>
          <div className="placement__workbench">{workbench}</div>
          <div className="placement__actions">
            {index < rows.length - 1 && (
              <Button variant="primary" onClick={() => onGoTo(index + 1)}>
                Next task
              </Button>
            )}
            <Button variant={index < rows.length - 1 ? 'quiet' : 'primary'} onClick={onFinish}>
              I'm done: show me where I stand
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Result({ summary, nextHref, onRetake }: PlacementPresentationProps) {
  if (!summary) return null
  return (
    <div className="placement__result">
      {summary.placed.length > 0 ? (
        <>
          <p>Placed past, marked "placed", with their Codex cards filed by placement:</p>
          <ul className="placement__list">
            {summary.placed.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>No level placed this time.</p>
      )}
      <p>
        {summary.sendTo
          ? `Next: ${summary.sendTo}. Placed levels stay playable from the map.`
          : 'Every task passed. On to the stalled Machine.'}
      </p>
      <div className="placement__actions">
        <ButtonLink href={nextHref} variant="primary">
          {summary.sendTo ? 'Play it' : 'Go on'}
        </ButtonLink>
        <Button variant="quiet" onClick={onRetake}>
          Retake the check
        </Button>
      </div>
    </div>
  )
}
