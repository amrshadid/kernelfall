import type { LevelTopBarData } from '@features/level/types'
import { ButtonLink, HintButton, Icon, StepRail, TaintMeter } from '@shared/components/ui'
import './LevelTopBar.css'

export interface LevelTopBarProps {
  bar: LevelTopBarData
  onMenu: () => void
}

export function LevelTopBar({ bar, onMenu }: LevelTopBarProps) {
  return (
    <nav className="screen__topbar level-topbar" aria-label="Level">
      <ButtonLink href={bar.mapHref} variant="quiet">
        <Icon name="back" />
        Map
      </ButtonLink>
      {/* X-ray has a Replay of its own; the name says which one this is. */}
      <button
        type="button"
        className="kf-btn kf-btn--quiet kf-btn--md"
        aria-label="Replay this level"
        onClick={bar.onReplay}
      >
        <Icon name="replay" />
        Replay
      </button>
      <div className="level-topbar__name">
        <h1 tabIndex={-1}>{bar.heading}</h1>
        <span>{bar.subheading}</span>
      </div>
      <StepRail steps={bar.steps} currentIndex={bar.currentIndex} reviewing={bar.reviewing} onSelect={bar.onReview} />
      <TaintMeter taint={bar.taint} onOpen={bar.onOpenTaint} />
      <HintButton left={bar.hintsLeft} offered={bar.hintOffered} disabled={!bar.hintEnabled} onReveal={bar.onHint} />
      <button
        type="button"
        className="kf-btn kf-btn--quiet kf-btn--md"
        aria-label="Shortcuts and menu"
        onClick={onMenu}
      >
        <Icon name="menu" />
      </button>
    </nav>
  )
}
