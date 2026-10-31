import type { Stage, XrayDepth } from '@features/xray/types'
import { kernelSourceUrl } from '@kernelfall/machine/utils'
import { InlineText } from '@shared/components/ui'
import './Narration.css'

export interface NarrationProps {
  stage: Stage<unknown>
  index: number
  count: number
  /** The next stage is waiting for a guess. */
  guessNext: boolean
  /** What the player guessed for this stage, if it had a Predict beat. */
  guess: string | null
  depth: XrayDepth
}

export function Narration({ stage, index, count, guessNext, guess, depth }: NarrationProps) {
  return (
    <>
      <div className="xr__narr-head">
        <p className="xr__narr-step">
          Stage {index + 1} of {count} · {stage.tick}
          {guessNext ? ' · next, guess first' : ''}
        </p>
        <h3 className="xr__narr-title" aria-live="polite">
          {stage.title}
        </h3>
      </div>
      <div className="xr__narr-body">
        {guess !== null && stage.predict && (
          <p className="xr__guess">
            You guessed <b>{guess}</b>. <InlineText text={stage.predict.explain} />
          </p>
        )}
        <p className="xr__what" aria-live="polite">
          <InlineText text={stage.what} />
        </p>
        <p className="xr__why">
          <b>Why this way:</b> <InlineText text={stage.why} />
        </p>
        {stage.gate !== undefined && (
          <div className="xr__gatekeeper xr-simple">
            <svg viewBox="0 0 34 40" aria-hidden="true">
              <path d="M5 39 V12 Q17 1 29 12 V39 Z" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="2" />
              <rect x="11" y="15" width="12" height="9" fill="var(--red)" />
              <path d="M9 30 H25" stroke="var(--ink)" strokeWidth="2" />
            </svg>
            <p>
              <b>The Gatekeeper</b> · the syscall entry path
              <br />“{stage.gate}”
            </p>
          </div>
        )}
        {stage.simplified !== undefined && (
          <p className="xr__simplified">
            <b>X-ray simplifies:</b> <InlineText text={stage.simplified} />
          </p>
        )}
        {/* Keyed by depth so switching to Deep opens it, while the player can still fold it. */}
        <details key={depth} open={depth === 'deep'}>
          <summary>Go deeper</summary>
          <p>
            <InlineText text={stage.deeper} />
          </p>
        </details>
        {stage.sources.length > 0 && (
          <details>
            <summary>Source</summary>
            <ul className="xr__sources">
              {stage.sources.map((source) => (
                <li key={`${source.path}${source.fn ?? ''}`}>
                  <a href={kernelSourceUrl(source.path)} target="_blank" rel="noreferrer">
                    {source.path}
                  </a>
                  {source.fn ? ` · ${source.fn}` : ''}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </>
  )
}
