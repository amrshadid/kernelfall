import { MapOverview, type MapOverviewProps } from '@features/map/components/map'
import type { ContinueTarget } from '@features/title/types'
import { ManHead, ScreenFrame } from '@shared/components/layout'
import { Dialog } from '@shared/components/modals'
import { Button, ButtonLink, ContentsList, Wordmark } from '@shared/components/ui'
import { APP_REPOSITORY_URL } from '@shared/constants/app'
import type { ContentsEntry, ScreenChrome } from '@shared/types'
import './Title.css'

export interface NewGameDialog {
  readonly open: boolean
  onExportAndStart(): void
  onStart(): void
  onCancel(): void
}

export interface TitlePresentationProps {
  chrome: ScreenChrome
  /** The act the player is in, as a volume: "Volume I: Userland" or "Prologue". */
  volume: string
  /** `null` on a first visit: New game becomes the primary action. */
  continueTo: ContinueTarget | null
  onNewGame: () => void
  contents: readonly ContentsEntry[]
  /** Fig. 1: the Kernel Map around "you". */
  figure: MapOverviewProps
  newGame: NewGameDialog
  saveText: string
  onShortcuts: () => void
  /** Whether this build records sessions with Clarity; the footer says so. */
  recorded: boolean
  privacyHref: string
}

/** The cover of the service manual: the wordmark cut in section, the contents, and Fig. 1. */
export function TitlePresentation({
  chrome,
  volume,
  continueTo,
  onNewGame,
  contents,
  figure,
  newGame,
  saveText,
  onShortcuts,
  recorded,
  privacyHref,
}: TitlePresentationProps) {
  return (
    <ScreenFrame
      page="Kernelfall(2)"
      volume={`Machine Service Manual · ${volume}`}
      chrome={chrome}
      foot={
        <ManHead
          kind="foot"
          left={saveText}
          center={
            <>
              Your progress stays in your browser. No accounts.
              {recorded && ' We record how the game is played.'}{' '}
              <a className="title__privacy" href={privacyHref}>
                Privacy
              </a>
            </>
          }
          right={
            <button type="button" className="title__shortcuts" onClick={onShortcuts}>
              Shortcuts <kbd>?</kbd>
            </button>
          }
        />
      }
    >
      <main className="title screen__sheet kf-sheet" aria-labelledby="title-h1">
        <div className="title__wordmark">
          <h1 id="title-h1" className="kf-visually-hidden" tabIndex={-1}>
            Kernelfall
          </h1>
          <Wordmark />
          <div className="title__tagline-row">
            <figure className="title__tagline">
              <blockquote cite="https://lkml.org/lkml/2000/8/25/132">
                <p>
                  Talk is cheap.{' '}
                  <a href={APP_REPOSITORY_URL} target="_blank" rel="noreferrer">
                    Show me the code.
                  </a>
                </p>
              </blockquote>
              <figcaption>Linus Torvalds, on the linux-kernel list, 2000</figcaption>
            </figure>
            <p className="title__key">
              Section line <b>A–A</b>: the Syscall Gate.
              <br />
              Userland above, the Deep below.
            </p>
          </div>
        </div>

        <div className="title__lower">
          <nav className="title__menu" aria-label="Main menu">
            {continueTo ? (
              <div className="title__continue">
                <ButtonLink href={continueTo.href} variant="primary" size="lg" data-primary>
                  Continue
                </ButtonLink>
                <p className="title__where">{continueTo.where}</p>
                <p className="title__step">{continueTo.step}</p>
              </div>
            ) : (
              <div className="title__continue">
                <Button variant="primary" size="lg" onClick={onNewGame} data-primary>
                  New game
                </Button>
                <p className="title__where">Start at First Boot, the Prologue.</p>
                <p className="title__step">About 15 minutes to your first syscall.</p>
              </div>
            )}
            <ContentsList headingId="title-contents" heading="Contents" entries={contents} />
          </nav>

          <figure className="title__drawing">
            <MapOverview {...figure} />
            <figcaption>
              <span>Fig. 1. The Kernel Map around you. Select it to open the whole map.</span>
              <span>Solid: rebuilt. Hatched: dark. Red: lit and you.</span>
            </figcaption>
          </figure>
        </div>
      </main>

      <Dialog
        open={newGame.open}
        title="Start a new game?"
        onClose={newGame.onCancel}
        actions={
          <>
            <Button variant="quiet" onClick={newGame.onCancel}>
              Cancel
            </Button>
            <Button onClick={newGame.onStart}>Start over</Button>
            <Button variant="primary" onClick={newGame.onExportAndStart}>
              Export and start over
            </Button>
          </>
        }
      >
        <p>This replaces your current game. Export it first to keep a copy you can import later.</p>
      </Dialog>
    </ScreenFrame>
  )
}
