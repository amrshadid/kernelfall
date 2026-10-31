import { Button } from '@shared/components/ui'
import './ConsentNotice.css'

export interface ConsentNoticePresentationProps {
  /** The privacy note in Settings. */
  privacyHref: string
  onAllow: () => void
  onDecline: () => void
}

/** A plate in the corner, not a modal: it never takes focus or covers play, and both answers weigh the same. */
export function ConsentNoticePresentation({ privacyHref, onAllow, onDecline }: ConsentNoticePresentationProps) {
  return (
    <aside className="kf-consent" aria-labelledby="kf-consent-title" aria-describedby="kf-consent-text">
      <p className="kf-consent__label">Notice · Usage recording</p>
      <h2 id="kf-consent-title" className="kf-consent__title">
        Help improve Kernelfall?
      </h2>
      <p id="kf-consent-text" className="kf-consent__text">
        Microsoft Clarity would record how you play: clicks, scrolling, the screens you open, and what you type in the
        terminal and the editor. It uses cookies. Your progress stays in your browser either way.
      </p>
      <div className="kf-consent__actions">
        <Button size="sm" onClick={onAllow}>
          Allow
        </Button>
        <Button size="sm" onClick={onDecline}>
          No thanks
        </Button>
        <a className="kf-consent__link" href={privacyHref}>
          What's recorded?
        </a>
      </div>
    </aside>
  )
}
