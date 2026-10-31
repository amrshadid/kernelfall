import type { Notice } from '@features/notices/types'
import { StatusMark } from '@shared/components/ui'
import './NoticeStack.css'

export interface NoticeStackPresentationProps {
  notice: Notice | null
  /** How many more wait behind it. */
  waiting: number
  onDismiss: (id: string) => void
}

/** Outside every panel, so nothing the player is reading is covered. Never takes focus; read out politely. */
export function NoticeStackPresentation({ notice, waiting, onDismiss }: NoticeStackPresentationProps) {
  return (
    <section className="kf-notices" aria-label="Notices" aria-live="polite">
      {notice && (
        <article key={notice.id} className={`kf-notice kf-notice--${notice.kind}`} title={notice.text}>
          <span className="kf-notice__mark" aria-hidden="true">
            {notice.kind === 'save-failed' ? '▲' : <StatusMark passed />}
          </span>
          <p className="kf-notice__body">
            <span className="kf-notice__kicker">{notice.kicker}</span>{' '}
            <span className="kf-notice__text">{notice.text}</span>
          </p>
          {waiting > 0 && <span className="kf-notice__more">+{waiting} more</span>}
          <button
            type="button"
            className="kf-notice__close"
            aria-label={`Dismiss: ${notice.kicker}`}
            onClick={() => onDismiss(notice.id)}
          >
            ×
          </button>
        </article>
      )}
    </section>
  )
}
