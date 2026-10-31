import { ManHead, Sheet } from '@shared/components/layout'
import { ButtonLink } from '@shared/components/ui'
import { LevelLayout, type LevelLayoutProps } from './LevelLayout'
import './LevelScreenPresentation.css'

export interface LevelUnavailable {
  readonly reason: string
  readonly mapHref: string
}

export interface LevelScreenPresentationProps {
  /** `null` while the level is being opened. */
  layout: LevelLayoutProps | null
  unavailable: LevelUnavailable | null
}

/** A level that can't be played gets a plain explanation, never a dead end. */
export function LevelScreenPresentation({ layout, unavailable }: LevelScreenPresentationProps) {
  if (unavailable) {
    return (
      <div className="level-unavailable">
        <ManHead left="Kernelfall(2)" center="Kernelfall Service Manual" right="Kernelfall(2)" />
        <Sheet as="main" className="level-unavailable__sheet" aria-labelledby="level-unavailable-h">
          <h1 id="level-unavailable-h" tabIndex={-1}>
            This level can't be played yet.
          </h1>
          <p>{unavailable.reason}</p>
          <ButtonLink variant="primary" href={unavailable.mapHref}>
            Back to the map
          </ButtonLink>
        </Sheet>
      </div>
    )
  }
  return layout ? <LevelLayout {...layout} /> : null
}
