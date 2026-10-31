import { Button } from './Button'
import { Icon } from './Icon'
import './HintButton.css'

export interface HintButtonProps {
  /** Hints not revealed yet (0–3). */
  left: number
  /** init has a thought to offer: the button gets a soft ring, never a popup. */
  offered?: boolean
  disabled?: boolean
  onReveal: () => void
}

/** Reveals init's next hint. Hints cost score, never Taint, and are never forced. */
export function HintButton({ left, offered = false, disabled = false, onReveal }: HintButtonProps) {
  const none = left <= 0
  return (
    <Button
      className={`kf-hint${offered && !none ? ' kf-hint--offered' : ''}`}
      onClick={onReveal}
      disabled={disabled || none}
      aria-keyshortcuts="Alt+H"
    >
      <Icon name="hint" />
      Hint <span className="kf-hint__left">{none ? 'none left' : `${left} left`}</span>
    </Button>
  )
}
